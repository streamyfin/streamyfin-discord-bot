import redisClient from "./redisClient.js";
import Parser from 'rss-parser';

const rssParser = new Parser();

export default async function startRSS(client) {
    while (true) {
        try {
            const keys = await redisClient.keys('monitor:*');

            for (const key of keys) {
                const guildConfig = await redisClient.hGetAll(key);
                if (!guildConfig?.url || !guildConfig?.type) continue;

                const lastCheckKey = `${key}:lastCheck`;
                const lastCheck = parseInt(await redisClient.get(lastCheckKey)) || 0;
                const now = Date.now();
                const intervalMs = (parseInt(guildConfig.interval) || 5) * 60 * 1000;
                if (now - lastCheck < intervalMs) continue;

                await redisClient.set(lastCheckKey, now);

                const items = await fetchContent(guildConfig.type, guildConfig.url);
                if (!items?.length) continue;

                const sentIdsKey = `${key}:sent`;
                let keyType = await redisClient.type(sentIdsKey);
                if (keyType !== 'set' && keyType !== 'none') {
                    await redisClient.del(sentIdsKey);
                }

                for (const item of items) {
                    keyType = await redisClient.type(sentIdsKey);
                    if (keyType !== 'set' && keyType !== 'none') {
                        await redisClient.del(sentIdsKey);
                    }

                    const uniqueId = item.id || item.link || item.guid;
                    if (!uniqueId) continue;
                    
                    const alreadySent = await redisClient.sIsMember(sentIdsKey, uniqueId);
                    if (alreadySent) continue;

                    const message = `📢 **${item.title}**\n${item.link || item.url}`;
                    const channel = await client.channels.fetch(guildConfig.channelId).catch(() => null);
                    if (channel) await channel.send(message);

                    await redisClient.sAdd(sentIdsKey, uniqueId);
                    await redisClient.expire(sentIdsKey, 60 * 60 * 24 * 7);
                }
            }
        } catch (err) {}
        await sleep(30000);
    }
}

async function fetchContent(type, url) {
    try {
        if (type === 'rss') {
            const feed = await rssParser.parseURL(url);
            return feed.items.map(item => ({
                title: item.title,
                link: item.link,
                guid: item.guid || item.link
            }));
        }

        if (type === 'reddit') {
            const subreddit = url.replace(/^https:\/\/(www\.)?reddit\.com\/r\//, '').replace(/\/$/, '');
            const res = await fetch(`https://www.reddit.com/r/${subreddit}/new.json?limit=5`);
            const data = await res.json();
            return data.data.children.map(post => ({
                title: post.data.title,
                link: `https://reddit.com${post.data.permalink}`,
                id: post.data.id
            }));
        }
        return [];
    } catch (err) {
        console.error(`Failed to fetch ${type} content from ${url}:`, err.message);
        return [];
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
