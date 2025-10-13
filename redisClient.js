import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
    connectTimeout: 10000,
  },
  retry_unfulfilled_commands: true,
});

redisClient.on('error', (error) => {
  console.error('[REDIS] Connection error:', error.message);
});

redisClient.on('connect', () => {
  console.log('[REDIS] Connected successfully');
});

redisClient.on('reconnecting', () => {
  console.log('[REDIS] Reconnecting...');
});

redisClient.on('ready', () => {
  console.log('[REDIS] Ready for commands');
});

// Connect with error handling
redisClient.connect().catch((error) => {
  console.error('[REDIS] Failed to connect:', error.message);
  // Don't exit the process, let the app continue without Redis
});

export default redisClient;
