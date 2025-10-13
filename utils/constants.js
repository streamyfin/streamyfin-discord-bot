/**
 * Application constants and configuration
 */

export const CONFIG = {
  // Bot configuration
  BOT: {
    USER_ID: '398161771476549654',
    ACTIVITY: "over Streamyfin's issues 👀",
    ACTIVITY_TYPE: 3, // Watching
  },

  // Rate limiting
  RATE_LIMIT: {
    AI_SUPPORT_COOLDOWN: 1000, // 1 second
    AI_SUPPORT_CLEANUP_SIZE: 1000, // Clean up after this many entries
    AI_SUPPORT_CLEANUP_AGE: 60000, // 1 minute
  },

  // API timeouts
  TIMEOUTS: {
    GITHUB_API: 10000,
    PERSPECTIVE_API: 10000,
    AI_SUPPORT: 30000,
    RSS_FETCH: 10000,
  },

  // RSS monitoring
  RSS: {
    CHECK_INTERVAL: 30000, // 30 seconds
    MIN_FEED_INTERVAL: 60000, // 1 minute minimum
    DEFAULT_FEED_INTERVAL: 300000, // 5 minutes default
    CLEANUP_THRESHOLD: 1000,
    ITEM_EXPIRY: 60 * 60 * 24 * 7, // 7 days
  },

  // Message filtering
  MODERATION: {
    TOXICITY_THRESHOLD: 0.2,
    FLIRTATION_THRESHOLD: 0.2,
    COMMENT_PREFIXES: ["^", "//", "-"],
    MIN_QUERY_LENGTH: 5,
  },

  // Colors
  COLORS: {
    PRIMARY: 0x6A0DAD,
    SUCCESS: 0x00ff00,
    ERROR: 0xff0000,
    WARNING: 0xffaa00,
    INFO: 0x0099ff,
  },

  // GitHub
  GITHUB: {
    USER_AGENT: 'StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)',
    RELEASES_LIMIT: 2,
    CONTRIBUTORS_LIMIT: 15,
  },

  // Interaction timeouts
  INTERACTION: {
    COLLECTOR_TIMEOUT: 120000, // 2 minutes
    FEEDBACK_TIMEOUT: 180000, // 3 minutes
    TYPING_INTERVAL: 10000, // 10 seconds
  }
};

export const MESSAGES = {
  ERRORS: {
    GENERIC: 'There was an error while executing this command!',
    PERMISSION_DENIED: 'You do not have permission to perform this action.',
    CHANNEL_IGNORED: 'This channel is ignored by the bot.',
    INVALID_INPUT: 'Invalid input provided.',
    API_ERROR: 'Unable to connect to external services. Please try again later.',
    NOT_CONFIGURED: 'This feature is not configured.',
  },
  
  SUCCESS: {
    OPERATION_COMPLETED: 'Operation completed successfully!',
    DATA_FETCHED: 'Data retrieved successfully.',
  },

  FEEDBACK: {
    POSITIVE: "Thanks for the feedback! I'm glad you found the answer helpful.",
    NEGATIVE: "Sorry for the dissatisfaction. I'll work on improving the answer.",
    AI_SUPPORT_PROMPT: "Please provide a question or query for support.",
    AI_TECHNICAL_DIFFICULTY: "Sorry, I'm experiencing technical difficulties. Please try again later.",
  }
};

export default { CONFIG, MESSAGES };