import express from 'express';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import path from 'path';
import redisClient from './redisClient.js';
import authManager from './utils/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.WEB_PANEL_PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ['\'self\''],
      styleSrc: ['\'self\'', '\'unsafe-inline\'', 'https://cdnjs.cloudflare.com'],
      scriptSrc: ['\'self\'', '\'unsafe-inline\''],
      imgSrc: ['\'self\'', 'data:', 'https:'],
      connectSrc: ['\'self\''],
      fontSrc: ['\'self\'', 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: 'Too many login attempts, please try again later.'
});

app.use(limiter);

// Session configuration
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Secure wenn production (reverse proxy)
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict'
  },
  name: 'streamyfin.sid'
}));

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

// Authentication middleware
function requireAuth(req, res, next) {
  if (!req.session.isAuthenticated) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

// Admin authentication middleware (legacy support)
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const adminToken = process.env.ADMIN_TOKEN;
  
  // Check session auth first
  if (req.session.isAuthenticated) {
    return next();
  }
  
  // Fallback to token auth for backward compatibility
  if (!adminToken) {
    return res.status(500).json({ error: 'Admin functionality not configured' });
  }
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  if (token !== adminToken) {
    return res.status(401).json({ error: 'Invalid admin token' });
  }
  
  next();
}

// Serve static files for dashboard
app.use(express.static(path.join(__dirname, 'public')));

// Serve dashboard HTML as static file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API Routes
app.get('/api/auth/status', (req, res) => {
  res.json({
    authenticated: !!req.session.isAuthenticated,
    loginTime: req.session.loginTime || null
  });
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password required' });
    }

    const result = await authManager.authenticateAdmin(password);
    
    if (result.success) {
      req.session.isAuthenticated = true;
      req.session.loginTime = new Date().toISOString();
      logActivity('info', 'Admin login successful', { 
        ip: req.ip,
        userAgent: req.get('User-Agent') 
      });
      res.json({ success: true, message: result.message });
    } else {
      logActivity('warn', 'Admin login failed', { 
        ip: req.ip,
        userAgent: req.get('User-Agent') 
      });
      res.status(401).json({ error: result.message });
    }
  } catch (error) {
    console.error('[WEB] Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('[WEB] Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password required' });
    }

    const result = await authManager.changePassword(currentPassword, newPassword);
    
    if (result.success) {
      // Destroy session after password change
      req.session.destroy();
      logActivity('info', 'Admin password changed', { ip: req.ip });
    }
    
    res.json(result);
  } catch (error) {
    console.error('[WEB] Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats', requireAuth, async (req, res) => {
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

app.get('/api/commands', requireAuth, async (req, res) => {
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

app.get('/api/rss', requireAuth, async (req, res) => {
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

app.get('/api/logs', requireAuth, async (req, res) => {
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

app.get('/api/health', (req, res) => {
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

// Admin API Routes (legacy compatibility)
app.post('/api/admin/login', authLimiter, async (req, res) => {
  const { token } = req.body;
  const adminToken = process.env.ADMIN_TOKEN;
  
  if (!adminToken) {
    return res.status(500).json({ error: 'Admin functionality not configured' });
  }
  
  if (token === adminToken) {
    logActivity('info', 'Admin login successful (legacy)', { ip: req.ip });
    res.json({ success: true, message: 'Login successful' });
  } else {
    logActivity('warn', 'Admin login failed (legacy)', { ip: req.ip });
    res.status(401).json({ error: 'Invalid admin token' });
  }
});

app.post('/api/admin/restart', authenticateAdmin, (req, res) => {
  try {
    logActivity('info', 'Bot restart initiated by admin', { ip: req.ip });
    res.json({ success: true, message: 'Bot restart initiated' });
    
    // Graceful shutdown - PM2/Docker will restart automatically
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('[WEB] Restart error:', error);
    res.status(500).json({ error: 'Failed to restart bot' });
  }
});

app.post('/api/admin/clear-logs', authenticateAdmin, async (req, res) => {
  try {
    await redisClient.del('bot:logs');
    logActivity('info', 'Logs cleared by admin', { ip: req.ip });
    res.json({ success: true, message: 'Logs cleared successfully' });
  } catch (error) {
    console.error('[WEB] Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

app.get('/api/admin/status', authenticateAdmin, (req, res) => {
  res.json({
    adminAccess: true,
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage()
  });
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
  
  // Initialize authentication
  authManager.initializeAuth().catch(error => {
    console.error('[WEB] Auth initialization failed:', error);
  });
  
  // Start HTTP server (HTTPS handled by reverse proxy)
  const server = app.listen(PORT, process.env.WEB_PANEL_HOST || '127.0.0.1', () => {
    const host = process.env.WEB_PANEL_HOST || '127.0.0.1';
    
    console.log(`[WEB] Panel available at http://${host}:${PORT}`);
    console.log('[WEB] HTTPS: Handled by reverse proxy');
    console.log('[WEB] Security headers: Enabled');
    console.log('[WEB] Rate limiting: Enabled');
    console.log('[WEB] Session authentication: Enabled');
    
    logActivity('info', 'Web panel started', { 
      port: PORT, 
      host,
      reverseProxy: true
    });
  });

  server.on('error', (error) => {
    console.error('[WEB] Failed to start web panel:', error);
    logActivity('error', 'Web panel startup failed', { error: error.message });
  });
}

export { botStats };