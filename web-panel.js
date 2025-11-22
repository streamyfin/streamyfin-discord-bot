import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import crypto from 'crypto';
import redisClient from './redisClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PANEL_PORT || 3001;

// Store stats in memory for quick access
let botStats = {
  startTime: Date.now(),
  commandsExecuted: 0,
  errorsCount: 0,
  rssItemsProcessed: 0,
  lastActivity: Date.now()
};

// Security constants
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
const MAX_LOGIN_ATTEMPTS = 5; // Max attempts per IP per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const activeSessions = new Map();
const loginAttempts = new Map(); // IP -> { count, firstAttempt }

// Middleware
app.use(express.json());

// Serve Next.js dashboard in production, or redirect to dev server
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'web-dashboard', '.next', 'standalone')));
} else {
  // In development, serve the API only - dashboard runs separately
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Streamyfin Discord Bot API', 
      dashboard: 'http://localhost:3000',
      api: 'http://localhost:3001/api' 
    });
  });
}

// Trust proxy for proper IP detection
app.set('trust proxy', true);

// IP detection middleware
app.use((req, res, next) => {
  req.realIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  next();
});

// Enhanced auth middleware with session management and rate limiting
function basicAuth(req, res, next) {
  if (!process.env.WEB_PANEL_PASSWORD) return next();
  
  const clientIP = req.realIP;
  
  // Check rate limiting
  if (isRateLimited(clientIP)) {
    return res.status(429).json({ 
      error: 'Too many login attempts. Please try again later.' 
    });
  }
  
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Basic ')) {
    recordLoginAttempt(clientIP, false);
    res.status(401).set('WWW-Authenticate', 'Basic realm="Bot Panel"').json({ 
      error: 'Authentication required' 
    });
    return;
  }
  
  try {
    const credentials = Buffer.from(auth.slice(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    
    // Secure comparison to prevent timing attacks
    const expectedUsername = 'admin';
    const expectedPassword = process.env.WEB_PANEL_PASSWORD;
    
    const usernameValid = username && crypto.timingSafeEqual(
      Buffer.from(username.padEnd(expectedUsername.length)),
      Buffer.from(expectedUsername)
    );
    
    const passwordValid = password && crypto.timingSafeEqual(
      Buffer.from(password.padEnd(expectedPassword.length)),
      Buffer.from(expectedPassword)
    );
    
    if (usernameValid && passwordValid && username.length === expectedUsername.length) {
      // Successful login
      recordLoginAttempt(clientIP, true);
      
      // Create/update session
      const sessionId = crypto.randomUUID();
      activeSessions.set(sessionId, {
        username,
        created: Date.now(),
        lastAccess: Date.now(),
        ip: clientIP
      });
      
      // Clean expired sessions
      cleanExpiredSessions();
      
      req.sessionId = sessionId;
      next();
    } else {
      // Failed login
      recordLoginAttempt(clientIP, false);
      
      // Add small delay to prevent brute force attacks
      setTimeout(() => {
        res.status(401).json({ error: 'Invalid credentials' });
      }, 1000 + Math.random() * 1000);
    }
  } catch (error) {
    recordLoginAttempt(clientIP, false);
    res.status(401).json({ error: 'Invalid authentication format' });
  }
}

// Rate limiting functions
function isRateLimited(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip);
  
  if (!attempts) return false;
  
  // Reset if window expired
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    loginAttempts.delete(ip);
    return false;
  }
  
  return attempts.count >= MAX_LOGIN_ATTEMPTS;
}

function recordLoginAttempt(ip, success) {
  const now = Date.now();
  
  if (success) {
    // Clear failed attempts on successful login
    loginAttempts.delete(ip);
    return;
  }
  
  const attempts = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
  
  // Reset if window expired
  if (now - attempts.firstAttempt > RATE_LIMIT_WINDOW) {
    attempts.count = 1;
    attempts.firstAttempt = now;
  } else {
    attempts.count++;
  }
  
  loginAttempts.set(ip, attempts);
}

// Clean expired sessions
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastAccess > SESSION_TIMEOUT) {
      activeSessions.delete(sessionId);
    }
  }
}

app.use('/api', basicAuth);

// Logout endpoint
app.post('/api/logout', basicAuth, (req, res) => {
  if (req.sessionId && activeSessions.has(req.sessionId)) {
    activeSessions.delete(req.sessionId);
  }
  res.json({ message: 'Logged out successfully' });
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
      lastActivity: new Date(botStats.lastActivity).toISOString(),
      activeSessions: activeSessions.size
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