import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import redisClient from './redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PANEL_PORT || 3000;

// Store stats in memory for quick access
const botStats = {
  startTime: Date.now(),
  commandsExecuted: 0,
  errorsCount: 0,
  rssItemsProcessed: 0,
  lastActivity: Date.now()
};

// Middleware
app.use(express.json());

// Serve static files for dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Serve dashboard HTML as static file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/stats', async (req, res) => {
  try {
    const uptime = Date.now() - botStats.startTime;
    let rssKeys = [];
    
    // Get RSS feed count with better error handling
    try {
      for await (const batch of scanIterator('monitor:*')) {
        for (const key of batch) {
          if (key && !key.includes(':sent') && !key.includes(':lastCheck')) {
            rssKeys.push(key);
          }
        }
      }
    } catch (redisError) {
      console.warn('[WEB] Redis scan failed for stats, using cached count:', redisError.message);
      // Fallback to cached value or 0
      rssKeys = [];
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
    console.error('[WEB] Stats API error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('[WEB] Commands API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/rss', async (req, res) => {
  try {
    const feeds = [];
    
    try {
      for await (const batch of scanIterator('monitor:*')) {
        for (const key of batch) {
          if (key && !key.includes(':sent') && !key.includes(':lastCheck')) {
            try {
              const config = await redisClient.hGetAll(key);
              const lastCheck = await redisClient.get(`${key}:lastCheck`);
              
              feeds.push({
                key,
                url: config.url || '',
                type: config.type || 'unknown',
                channelId: config.channelId || '',
                interval: config.interval || '',
                lastCheck: lastCheck ? new Date(parseInt(lastCheck)).toISOString() : null,
                status: lastCheck ? 'active' : 'pending'
              });
            } catch (keyError) {
              console.warn(`[WEB] Failed to get config for key ${key}:`, keyError.message);
            }
          }
        }
      }
    } catch (redisError) {
      console.warn('[WEB] Redis scan failed for RSS feeds:', redisError.message);
    }
    
    res.json(feeds);
  } catch (error) {
    console.error('[WEB] RSS API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/logs', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 100, 500);
    const logs = await redisClient.lRange('bot:logs', 0, limit - 1) || [];
    const parsedLogs = logs.map(log => {
      try {
        return JSON.parse(log);
      } catch {
        return { 
          timestamp: new Date().toISOString(), 
          level: 'info', 
          message: log || 'Empty log entry' 
        };
      }
    }).reverse();
    
    res.json(parsedLogs);
  } catch (error) {
    console.error('[WEB] Logs API error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    console.error('[WEB] Health API error:', error);
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Internal server error' 
    });
  }
});

// Redis iterator helper
async function* scanIterator(pattern) {
  let cursor = '0';
  do {
    try {
      const result = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      // Handle both array and object responses from Redis
      const [next, keys] = Array.isArray(result) 
        ? result 
        : [result.cursor, result.keys];
      
      cursor = next;
      yield keys || [];
    } catch (error) {
      console.error('[WEB] Redis scan error:', error.message);
      // Yield empty array instead of breaking to continue iteration
      yield [];
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