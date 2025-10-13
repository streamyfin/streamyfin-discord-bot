import { Client, Collection } from 'discord.js';
import axios from 'axios';

export default class Streamyfin extends Client {
  constructor(...options) {
    super(...options);

    this.commands = new Collection();
    this.userId = '398161771476549654';
    this.repoOrg = process.env.REPO_ORG;
    this.repoName = process.env.REPO_NAME;
    this.githubToken = process.env.GITHUB_TOKEN;
    this.userAIRateLimit = new Map();

    // Unit conversion mappings
    this.unitConversions = {
      temperature: {
        'c': (v) => ({ unit: '°C', result: `${((v * 9 / 5) + 32).toFixed(2)}°F` }),
        '°c': (v) => ({ unit: '°C', result: `${((v * 9 / 5) + 32).toFixed(2)}°F` }),
        'celsius': (v) => ({ unit: '°C', result: `${((v * 9 / 5) + 32).toFixed(2)}°F` }),
        'f': (v) => ({ unit: '°F', result: `${((v - 32) * 5 / 9).toFixed(2)}°C` }),
        '°f': (v) => ({ unit: '°F', result: `${((v - 32) * 5 / 9).toFixed(2)}°C` }),
        'fahrenheit': (v) => ({ unit: '°F', result: `${((v - 32) * 5 / 9).toFixed(2)}°C` }),
      },
      distance: {
        'km': (v) => ({ unit: 'km', result: `${(v * 0.621371).toFixed(2)} miles` }),
        'kilometer': (v) => ({ unit: 'km', result: `${(v * 0.621371).toFixed(2)} miles` }),
        'kilometers': (v) => ({ unit: 'km', result: `${(v * 0.621371).toFixed(2)} miles` }),
        'mi': (v) => ({ unit: 'miles', result: `${(v * 1.609344).toFixed(3)} km` }),
        'mile': (v) => ({ unit: 'miles', result: `${(v * 1.609344).toFixed(3)} km` }),
        'miles': (v) => ({ unit: 'miles', result: `${(v * 1.609344).toFixed(3)} km` }),
        'm': (v) => ({ unit: 'm', result: `${(v * 3.28084).toFixed(2)} ft` }),
        'meter': (v) => ({ unit: 'm', result: `${(v * 3.28084).toFixed(2)} ft` }),
        'meters': (v) => ({ unit: 'm', result: `${(v * 3.28084).toFixed(2)} ft` }),
        'ft': (v) => ({ unit: 'ft', result: `${(v * 0.3048).toFixed(2)} m` }),
        'feet': (v) => ({ unit: 'ft', result: `${(v * 0.3048).toFixed(2)} m` }),
        'in': (v) => ({ unit: 'in', result: `${(v * 2.54).toFixed(2)} cm` }),
        'inch': (v) => ({ unit: 'in', result: `${(v * 2.54).toFixed(2)} cm` }),
        'inches': (v) => ({ unit: 'in', result: `${(v * 2.54).toFixed(2)} cm` }),
      },
      weight: {
        'kg': (v) => ({ unit: 'kg', result: `${(v * 2.20462).toFixed(2)} lbs` }),
        'kilogram': (v) => ({ unit: 'kg', result: `${(v * 2.20462).toFixed(2)} lbs` }),
        'kilograms': (v) => ({ unit: 'kg', result: `${(v * 2.20462).toFixed(2)} lbs` }),
        'lb': (v) => ({ unit: 'lbs', result: `${(v * 0.453592).toFixed(2)} kg` }),
        'lbs': (v) => ({ unit: 'lbs', result: `${(v * 0.453592).toFixed(2)} kg` }),
        'pound': (v) => ({ unit: 'lbs', result: `${(v * 0.453592).toFixed(2)} kg` }),
        'pounds': (v) => ({ unit: 'lbs', result: `${(v * 0.453592).toFixed(2)} kg` }),
        'g': (v) => ({ unit: 'g', result: `${(v * 0.00220462).toFixed(4)} lbs` }),
        'gram': (v) => ({ unit: 'g', result: `${(v * 0.00220462).toFixed(4)} lbs` }),
        'grams': (v) => ({ unit: 'g', result: `${(v * 0.00220462).toFixed(4)} lbs` }),
      }
    };
  }
  /**
   * Convert units found in text
   * @param {string} text - Text to search for units
   * @returns {string|null} Formatted conversion result or null
   */
  convertUnits(text) {
    const unitConversionRegex = /(-?\d+(?:\.\d+)?)\s?(°?[FC]|celsius|fahrenheit|km|kilometers?|mi\b|miles?|kg|kilograms?|lbs?|pounds?|g|grams?|m\b|meters?|ft|feet|in|inches?)\b/gi;
    const results = [];
    let match;
    
    while ((match = unitConversionRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      
      // Find conversion function
      const conversion = this.findConversion(unit);
      if (conversion) {
        const converted = conversion(value);
        results.push(`- ${value} ${converted.unit} ≈ ${converted.result}`);
      }
    }
    
    return results.length > 0 ? "Unit conversion:\n" + results.join("\n") : null;
  }

  /**
   * Find appropriate conversion function for a unit
   * @param {string} unit - Unit to convert
   * @returns {Function|null} Conversion function or null
   */
  findConversion(unit) {
    for (const category of Object.values(this.unitConversions)) {
      if (category[unit]) {
        return category[unit];
      }
    }
    return null;
  }
  /**
   * Fetch repository statistics and contributors
   * @returns {Promise<Array>} Array of contributor objects
   */
  async fetchStats() {
    try {
      const url = `https://api.github.com/repos/streamyfin/streamyfin/contributors?anon=1`;
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)'
        }
      });

      return response.data.map((contributor) => ({
        username: contributor.login || contributor.name,
        contributions: contributor.contributions,
      }));
    } catch (error) {
      console.error('[CLIENT] Error fetching stats:', error.message);
      return [];
    }
  }

  /**
   * Fetch repository releases
   * @returns {Promise<Array>} Array of release objects
   */
  async fetchReleases() {
    try {
      const response = await axios.get(
        `${process.env.GITHUB_API_BASE || 'https://api.github.com'}/repos/${this.repoOrg}/${this.repoName}/releases`,
        {
          headers: {
            Authorization: `token ${this.githubToken}`,
            'User-Agent': 'StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)'
          },
          timeout: 10000,
        }
      );

      const releases = response.data
        .slice(0, 2)
        .map((release) => ({ name: release.name, value: release.name }));

      releases.push({ name: "Older", value: "Older" });
      return releases;
    } catch (error) {
      console.error('[CLIENT] Error fetching releases:', error.message);
      return [{ name: "unknown", value: "unknown" }];
    }
  }

  /**
   * Check if a repository exists
   * @param {string} repoName - Repository name to check
   * @returns {Promise<Object>} Repository check result
   */
  async repoCheck(repoName) {
    const sanitizedRepoName = repoName.replace(/\s+/g, '-');
    
    try {
      const response = await axios.get(
        `https://api.github.com/repos/${this.repoOrg}/${sanitizedRepoName}`,
        {
          timeout: 10000,
          headers: {
            'User-Agent': 'StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)'
          }
        }
      );
      
      return { exists: true, data: response.data };
    } catch (error) {
      console.error('[CLIENT] Error checking repository:', error.message);
      return { exists: false, error: error.message };
    }
  }

  /**
   * Check message toxicity using Perspective API
   * @param {string} message - Message to analyze
   * @returns {Promise<boolean>} True if message is considered toxic
   */
  async checkMessage(message) {
    if (!process.env.PERSPECTIVE_APIKEY) {
      console.warn('[CLIENT] Perspective API key not configured');
      return false;
    }

    try {
      const response = await axios.post(
        `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${process.env.PERSPECTIVE_APIKEY}`,
        {
          comment: { text: message },
          requestedAttributes: { TOXICITY: {}, FLIRTATION: {} },
        },
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.attributeScores) {
        const toxicityScore = response.data.attributeScores.TOXICITY?.summaryScore?.value || 0;
        const flirtationScore = response.data.attributeScores.FLIRTATION?.summaryScore?.value || 0;
        return toxicityScore >= 0.2 || flirtationScore >= 0.2;
      }
      
      return false;
    } catch (error) {
      console.error('[CLIENT] Error analyzing message:', error.message);
      return false;
    }
  }

  /**
   * Handle AI support messages
   * @param {Message} message - Discord message to process
   */
  async handleSupport(message) {
    const userID = message.author.id;
    const query = message.content.trim();
    const now = Date.now();
    
    // Rate limiting
    if (this.userAIRateLimit.has(userID)) {
      const lastRequest = this.userAIRateLimit.get(userID);
      if (now - lastRequest < 1000) return;
    }
    
    // Basic validation
    const messageComments = ["^", "//", "-"];
    if (messageComments.some(prefix => query.startsWith(prefix))) return;
    if (!query || query.length < 5) {
      return message.reply("Please provide a question or query for support.").catch(() => {});
    }
    
    this.userAIRateLimit.set(userID, now);

    // Clean up old rate limit entries
    if (this.userAIRateLimit.size > 1000) {
      const cutoff = now - 60000; // 1 minute ago
      for (const [id, timestamp] of this.userAIRateLimit.entries()) {
        if (timestamp < cutoff) this.userAIRateLimit.delete(id);
      }
    }

    const typingInterval = setInterval(() => {
      message.channel.sendTyping().catch(() => clearInterval(typingInterval));
    }, 10000);

    try {
      if (!process.env.AI_SUPPRT_URL || !process.env.AI_APIKEY) {
        throw new Error('AI support not configured');
      }

      await message.channel.sendTyping();

      const request = await axios.post(
        `${process.env.AI_SUPPRT_URL}/query`,
        { user_id: userID, query },
        {
          headers: { 'X-API-Key': process.env.AI_APIKEY },
          timeout: 30000,
        }
      );

      const response = request.data?.response;

      if (response?.length > 0) {
        const sentMessage = await message.reply(response);
        await this.setupFeedbackCollector(sentMessage, userID, query, response);
      } else {
        await message.reply("Sorry, I couldn't find an answer to your question.");
      }
    } catch (error) {
      console.error('[CLIENT] AI Support error:', error.message);
      await message.reply("Sorry, I'm experiencing technical difficulties. Please try again later.").catch(() => {});
    } finally {
      clearInterval(typingInterval);
    }
  }

  /**
   * Setup feedback collector for AI responses
   * @param {Message} sentMessage - The bot's response message
   * @param {string} userID - User ID who asked the question
   * @param {string} query - Original query
   * @param {string} response - Bot's response
   */
  async setupFeedbackCollector(sentMessage, userID, query, response) {
    try {
      await sentMessage.react("👍");
      await sentMessage.react("👎");

      const filter = (reaction, user) => 
        ["👍", "👎"].includes(reaction.emoji.name) && user.id === userID;

      const collector = sentMessage.createReactionCollector({ 
        filter, 
        max: 1, 
        time: 180000 
      });

      collector.on("collect", async (reaction) => {
        const feedbackType = reaction.emoji.name === "👍" ? "positive" : "negative";

        try {
          await axios.post(
            `${process.env.AI_SUPPRT_URL}/feedback`,
            {
              user_id: userID,
              query,
              answer: response,
              feedback_type: feedbackType,
            },
            {
              headers: { 'X-API-Key': process.env.AI_APIKEY },
              timeout: 10000,
            }
          );

          const feedbackMessage = feedbackType === "positive" 
            ? "Thanks for the feedback! I'm glad you found the answer helpful."
            : "Sorry for the dissatisfaction. I'll work on improving the answer.";
          
          await sentMessage.reply(feedbackMessage);
        } catch (err) {
          console.error('[CLIENT] Feedback error:', err.message);
        }
      });
    } catch (error) {
      console.error('[CLIENT] Error setting up feedback collector:', error.message);
    }
  }
}
