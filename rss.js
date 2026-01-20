import redisClient from "./redisClient.js";
import Parser from 'rss-parser';
import { EmbedBuilder } from 'discord.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const parser = new Parser({
    headers: { "User-Agent": "StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)" }
});

const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Load sources from JSON file
function loadSources() {
    try {
        const feedsPath = join(__dirname, 'feeds.json');
        const data = readFileSync(feedsPath, 'utf-8');
        return JSON.parse(data).sources || [];
    } catch (err) {
        console.error('Error loading feeds.json:', err.message);
        return [];
    }
}

/**
 * Initialize the RSS feed monitor
 * @param {Client} client - Discord.js client instance
 */
export default async function startRSS(client) {
    console.log('Starting RSS feed monitor...');

    // Initial check
    await checkAllFeeds(client);

    // Set up interval for periodic checks
    setInterval(async () => {
        await checkAllFeeds(client);
    }, CHECK_INTERVAL);

    console.log(`RSS feed monitor active. Checking every ${CHECK_INTERVAL / 1000 / 60} minutes.`);
}

/**
 * Check all configured sources
 * @param {Client} client - Discord.js client instance
 */
async function checkAllFeeds(client) {
    try {
        const sources = loadSources();

        if (!sources.length) return;

        for (const source of sources) {
            if (!source.url || !source.channelId) continue;

            const channel = await client.channels.fetch(source.channelId).catch(() => null);
            if (!channel) continue;

            await checkFeed(channel, source);
        }
    } catch (err) {
        console.error('Error checking feeds:', err.message);
    }
}

/**
 * Check a single feed for new posts
 * @param {TextChannel} channel - Discord channel to post to
 * @param {Object} source - Source configuration { type, url, channelId, color, icon }
 */
async function checkFeed(channel, source) {
    const { type, url } = source;
    const sentKey = `rss:sent:${channel.id}:${Buffer.from(url).toString('base64')}`;

    try {
        const feedData = await parser.parseURL(url);
        const newItems = [];

        for (const item of feedData.items) {
            const itemId = item.guid || item.link || item.id;
            if (!itemId) continue;

            const alreadySent = await redisClient.sIsMember(sentKey, itemId);
            if (!alreadySent) {
                newItems.push(item);
            }
        }

        // Reverse to post oldest first
        newItems.reverse();

        if (newItems.length > 0) {
            console.log(`Found ${newItems.length} new post(s) from ${type}`);
        }

        for (const item of newItems) {
            const itemId = item.guid || item.link || item.id;
            await postItem(channel, item, source);
            await redisClient.sAdd(sentKey, itemId);
            await redisClient.expire(sentKey, 60 * 60 * 24 * 30); // Keep for 30 days
            // Small delay between posts to avoid rate limiting
            await sleep(1000);
        }
    } catch (err) {
        console.error(`Error fetching feed ${type} (${url}):`, err.message);
    }
}

/**
 * Post a single RSS item to Discord as an embed
 * @param {TextChannel} channel - Discord channel to post to
 * @param {Object} item - RSS feed item
 * @param {Object} source - Source configuration { type, url, channelId, color, icon }
 */
async function postItem(channel, item, source) {
    const { type, url: feedUrl, color, icon } = source;
    const { imageUrl, textContent } = extractContent(item.content || item.contentSnippet || item.description || '');

    // Handle Reddit-style author names
    const authorName = item.author
        ? item.author.replace(/^\/?u\//, '').replace(/\/u\//, '')
        : item.creator || null;

    // Handle categories/tags
    const categories = item.categories || [];
    const flair = categories.length > 0 ? categories[0] : null;
    const title = flair ? `[${flair}] ${item.title}` : item.title;

    // Determine embed color
    let embedColor = color ? parseInt(color.replace('#', ''), 16) : 0x7289da;

    // Use Reddit orange for Reddit feeds
    if (feedUrl.includes('reddit.com')) {
        embedColor = 0xFF5700;
    }

    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(truncate(title, 256))
        .setURL(item.link)
        .setTimestamp(item.pubDate ? new Date(item.pubDate) : new Date());

    if (authorName) {
        const authorUrl = feedUrl.includes('reddit.com')
            ? `https://www.reddit.com/user/${authorName}`
            : null;

        embed.setAuthor({
            name: feedUrl.includes('reddit.com') ? `u/${authorName}` : authorName,
            url: authorUrl,
            iconURL: feedUrl.includes('reddit.com')
                ? 'https://www.redditstatic.com/avatars/defaults/v2/avatar_default_1.png'
                : undefined
        });
    }

    if (textContent) {
        embed.setDescription(truncate(textContent, 300));
    }

    if (imageUrl) {
        embed.setImage(imageUrl);
    }

    // Set footer with source type
    embed.setFooter({
        text: type,
        iconURL: icon || undefined
    });

    await channel.send({ embeds: [embed] });
}

/**
 * Extract image URL and text content from HTML content
 * @param {string} html - Raw HTML content
 * @returns {Object} Object with imageUrl and textContent
 */
function extractContent(html) {
    if (!html) return { imageUrl: null, textContent: '' };

    let imageUrl = null;
    let textContent = '';

    // Try to find an image in the content
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (imgMatch) {
        imageUrl = decodeHtmlEntities(imgMatch[1]);
    }

    // Try Reddit-specific image links
    if (!imageUrl) {
        const linkMatch = html.match(/href=["'](https?:\/\/(?:preview|i)\.redd\.it\/[^"']+)["']/i);
        if (linkMatch) {
            imageUrl = decodeHtmlEntities(linkMatch[1]);
        }
    }

    // Try to find direct image URLs in the text
    if (!imageUrl) {
        const directImgMatch = html.match(/(https?:\/\/[^\s<>"]+\.(?:png|jpg|jpeg|gif|webp))/i);
        if (directImgMatch) {
            imageUrl = decodeHtmlEntities(directImgMatch[1]);
        }
    }

    // Extract text content by removing HTML tags
    textContent = html
        .replace(/<a[^>]*>.*?<\/a>/gi, '') // Remove links
        .replace(/<[^>]*>/g, '') // Remove all HTML tags
        .trim();

    textContent = decodeHtmlEntities(textContent);

    // Clean up Reddit-specific artifacts
    textContent = textContent
        .replace(/\[link\]/gi, '')
        .replace(/\[comments\]/gi, '')
        .replace(/submitted by.*$/i, '')
        .trim();

    return { imageUrl, textContent };
}

/**
 * Decode HTML entities
 * @param {string} text - Text with HTML entities
 * @returns {string} Decoded text
 */
function decodeHtmlEntities(text) {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sleep for a given number of milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
