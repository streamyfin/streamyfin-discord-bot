import redisClient from "./redisClient.js";
import Parser from 'rss-parser';
import { incrementRSSCount, logActivity } from './web-panel.js';

const rssParser = new Parser({
  headers: { 
    "User-Agent": "StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)",
    "Accept": "application/rss+xml, application/xml, text/xml"
  },
  timeout: 30000,
  maxRedirects: 5,
});

const RETRY_DELAY = 30000; // 30 seconds
const CLEANUP_THRESHOLD = 1000; // Clean up after this many keys
let isShuttingDown = false;

/**
 * Start the RSS monitoring loop
 * @param {Client} client - Discord client instance
 */
export default async function startRSS(client) {
  console.log('[RSS] Starting monitoring service...');
  
  while (!isShuttingDown) {
    try {
      await processRSSFeeds(client);
    } catch (error) {
      console.error('[RSS] Error in main loop:', error.message);
    }
    
    // Wait before next iteration
    await sleep(RETRY_DELAY);
  }
  
  console.log('[RSS] Monitoring service stopped');
}

/**
 * Process all configured RSS feeds
 * @param {Client} client - Discord client instance
 */
async function processRSSFeeds(client) {
  try {
    const keys = [];
    for await (const batch of scanIterator('monitor:*')) {
      // Filter out non-config keys (sent sets, lastCheck strings)
      for (const key of batch) {
        if (!key.includes(':sent') && !key.includes(':lastCheck')) {
          keys.push(key);
        }
      }
    }
    console.log(`[RSS] Processing ${keys.length} configured feeds`);
    
    for (const key of keys) {
      if (isShuttingDown) break;
      
      try {
        await processSingleFeed(client, key);
      } catch (error) {
        console.error(`[RSS] Error processing feed ${key}:`, error.message);
      }
    }
    
    // Periodic cleanup
    if (keys.length > CLEANUP_THRESHOLD) {
      await cleanupOldEntries();
    }
  } catch (error) {
    console.error('[RSS] Error fetching feed keys:', error.message);
  }
}

/**
 * Process a single RSS feed
 * @param {Client} client - Discord client instance
 * @param {string} key - Redis key for feed configuration
 */
async function processSingleFeed(client, key) {
  const guildConfig = await redisClient.hGetAll(key);
  if (!guildConfig?.url || !guildConfig?.type || !guildConfig?.channelId) {
    console.warn(`[RSS] Invalid configuration for ${key}`);
    return;
  }

  const lastCheckKey = `${key}:lastCheck`;
  const lastCheck = parseInt(await redisClient.get(lastCheckKey)) || 0;
  const now = Date.now();
  const intervalMs = Math.max((parseInt(guildConfig.interval) || 5) * 60 * 1000, 60000); // Minimum 1 minute

  if (now - lastCheck < intervalMs) {
    return; // Too soon to check again
  }

  let items;
  try {
    items = await fetchContent(guildConfig.type, guildConfig.url);
  } catch (error) {
    console.error(`[RSS] Error fetching content for ${key}:`, error.message);
    return; // Don't update timestamp on fetch failure
  }
  
  if (!items?.length) {
    console.log(`[RSS] No new items for ${key}`);
    return; // Don't update timestamp when no items
  }

  // Only update timestamp after successful fetch with items
  await redisClient.set(lastCheckKey, now);

  const sentIdsKey = `${key}:sent`;
  await ensureSetKey(sentIdsKey);

  let newItemsCount = 0;
  for (const item of items) {
    if (isShuttingDown) break;
    
    const uniqueId = item.id || item.link || item.guid;
    if (!uniqueId) continue;
    
    const alreadySent = await redisClient.sIsMember(sentIdsKey, uniqueId);
    if (alreadySent) continue;

    try {
      const channel = await client.channels.fetch(guildConfig.channelId);
      if (channel) {
        const message = `📢 **${item.title}**\n${item.link || item.url}`;
        await channel.send(message);
        
        await redisClient.sAdd(sentIdsKey, uniqueId);
        await redisClient.expire(sentIdsKey, 60 * 60 * 24 * 7); // 7 days
        incrementRSSCount();
        newItemsCount++;
      }
    } catch (error) {
      console.error(`[RSS] Error sending message for ${key}:`, error.message);
    }
  }
  
  if (newItemsCount > 0) {
    console.log(`[RSS] Sent ${newItemsCount} new items for ${key}`);
    logActivity('info', `RSS: Sent ${newItemsCount} new items`, { 
      feedKey: key, 
      feedType: guildConfig.type,
      channelId: guildConfig.channelId 
    });
  }
}

/**
 * Ensure Redis key is a set, recreate if wrong type
 * @param {string} key - Redis key to check
 */
async function ensureSetKey(key) {
  try {
    const keyType = await redisClient.type(key);
    if (keyType !== 'set' && keyType !== 'none') {
      await redisClient.del(key);
    }
  } catch (error) {
    console.error(`[RSS] Error ensuring set key ${key}:`, error.message);
  }
}

/**
 * Fetch content from RSS or Reddit
 * @param {string} type - Content type ('rss' or 'reddit')
 * @param {string} url - URL to fetch from
 * @returns {Promise<Array>} Array of content items
 */
async function fetchContent(type, url) {
  try {
    if (type === 'rss') {
      const feed = await rssParser.parseURL(url);
      return feed.items.slice(0, 10).map(item => ({
        title: item.title,
        link: item.link,
        guid: item.guid || item.link,
        id: item.id || item.guid || item.link
      }));
    }

    if (type === 'reddit') {
      const subreddit = url
        .replace(/^https:\/\/(www\.)?reddit\.com\/r\//, '')
        .replace(/\/$/, '');
      
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 10_000);
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=5`,
        {
          headers: {
            "User-Agent": "StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)",
            "Accept": "application/json"
          },
          signal: controller.signal
        }
      ).finally(() => clearTimeout(t));
      
      if (!response.ok) {
        throw new Error(`Reddit API returned ${response.status}`);
      }
      
      const data = await response.json();
      return data.data.children.map(post => ({
        title: post.data.title,
        link: `https://reddit.com${post.data.permalink}`,
        id: post.data.id
      }));
    }
    
    console.warn(`[RSS] Unknown content type: ${type}`);
    return [];
  } catch (error) {
    console.error(`[RSS] Failed to fetch ${type} content from ${url}:`, error.message);
    return [];
  }
}

/**
 * Clean up old Redis entries
 */
async function cleanupOldEntries() {
  try {
    console.log('[RSS] Performing cleanup...');
    let cleanedCount = 0;
    for await (const batch of scanIterator('monitor:*:sent')) {
      for (const key of batch) {
        const ttl = await redisClient.ttl(key);
        if (ttl === -1) { // No expiration set
          await redisClient.expire(key, 60 * 60 * 24 * 7); // Set 7 day expiration
          cleanedCount++;
        }
      }
    }
    if (cleanedCount > 0) {
      console.log(`[RSS] Set expiration on ${cleanedCount} keys`);
    }
  } catch (error) {
    console.error('[RSS] Error during cleanup:', error.message);
  }
}

/**
 * Scan Redis keys using an async iterator
 * @param {string} pattern - Key pattern to match
 */
async function* scanIterator(pattern) {
  let cursor = '0';
  do {
    const [next, keys] = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = next;
    yield keys;
  } while (cursor !== '0');
}

/**
 * Sleep for the specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Gracefully shutdown RSS monitoring
 */
export function stopRSS() {
  console.log('[RSS] Shutdown requested...');
  isShuttingDown = true;
}
