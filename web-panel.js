import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import redisClient from './redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PANEL_PORT || 3000;

// Store stats in memory for quick access
let botStats = {
  startTime: Date.now(),
  commandsExecuted: 0,
  errorsCount: 0,
  rssItemsProcessed: 0,
  lastActivity: Date.now()
};

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web-static')));

// Basic auth middleware (optional)
function basicAuth(req, res, next) {
  if (!process.env.WEB_PANEL_PASSWORD) return next();
  
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    res.status(401).set('WWW-Authenticate', 'Basic realm="Bot Panel"').send('Authentication required');
    return;
  }
  
  const credentials = Buffer.from(auth.slice(6), 'base64').toString();
  const [username, password] = credentials.split(':');
  
  if (username === 'admin' && password === process.env.WEB_PANEL_PASSWORD) {
    next();
  } else {
    res.status(401).send('Invalid credentials');
  }
}

app.use('/api', basicAuth);

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const uptime = Date.now() - botStats.startTime;
    const rssKeys = [];
    
    // Get RSS feed count
    for await (const batch of scanIterator('monitor:*')) {
      for (const key of batch) {
        if (!key.includes(':sent') && !key.includes(':lastCheck')) {
          rssKeys.push(key);
        }
      }
    }
    
    res.json({
      uptime: Math.floor(uptime / 1000),
      commandsExecuted: botStats.commandsExecuted,
      errorsCount: botStats.errorsCount,
      rssItemsProcessed: botStats.rssItemsProcessed,
      rssFeeds: rssKeys.length,
      lastActivity: new Date(botStats.lastActivity).toISOString(),
      status: 'online'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/commands', async (req, res) => {
  try {
    const commands = await redisClient.hGetAll('bot:command_stats') || {};
    const commandList = Object.entries(commands).map(([name, count]) => ({
      name,
      count: parseInt(count) || 0
    })).sort((a, b) => b.count - a.count);
    
    res.json(commandList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rss', async (req, res) => {
  try {
    const feeds = [];
    
    for await (const batch of scanIterator('monitor:*')) {
      for (const key of batch) {
        if (!key.includes(':sent') && !key.includes(':lastCheck')) {
          const config = await redisClient.hGetAll(key);
          const lastCheck = await redisClient.get(`${key}:lastCheck`);
          
          feeds.push({
            key,
            url: config.url,
            type: config.type,
            channelId: config.channelId,
            interval: config.interval,
            lastCheck: lastCheck ? new Date(parseInt(lastCheck)).toISOString() : null,
            status: lastCheck ? 'active' : 'pending'
          });
        }
      }
    }
    
    res.json(feeds);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = await redisClient.lRange('bot:logs', 0, limit - 1) || [];
    res.json(logs.map(log => {
      try {
        return JSON.parse(log);
      } catch {
        return { timestamp: new Date().toISOString(), level: 'info', message: log };
      }
    }).reverse());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    const redis = redisClient.isReady ? 'connected' : 'disconnected';
    const uptime = Math.floor((Date.now() - botStats.startTime) / 1000);
    
    res.json({
      status: 'healthy',
      uptime,
      redis,
      lastActivity: new Date(botStats.lastActivity).toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Redis iterator helper
async function* scanIterator(pattern) {
  let cursor = '0';
  do {
    try {
      const [next, keys] = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = next;
      yield keys;
    } catch (error) {
      console.error('[WEB] Redis scan error:', error.message);
      break;
    }
  } while (cursor !== '0');
}

// Functions to track stats (call these from your main bot code)
export function incrementCommandCount(commandName) {
  botStats.commandsExecuted++;
  botStats.lastActivity = Date.now();
  redisClient.hIncrBy('bot:command_stats', commandName, 1).catch(() => {});
}

export function incrementErrorCount() {
  botStats.errorsCount++;
  botStats.lastActivity = Date.now();
}

export function incrementRSSCount() {
  botStats.rssItemsProcessed++;
  botStats.lastActivity = Date.now();
}

export function logActivity(level, message, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra
  };
  
  redisClient.lPush('bot:logs', JSON.stringify(logEntry)).catch(() => {});
  redisClient.lTrim('bot:logs', 0, 999).catch(() => {}); // Keep last 1000 logs
}

// Start web server only if enabled
export function startWebPanel() {
  if (process.env.ENABLE_WEB_PANEL !== 'true') {
    console.log('[WEB] Web panel disabled');
    return;
  }
  
  app.listen(PORT, () => {
    console.log(`[WEB] Panel available at http://localhost:${PORT}`);
    logActivity('info', 'Web panel started', { port: PORT });
  });
}

export { botStats };