# [Streamyfin](https://github.com/streamyfin/streamyfin)-Discord Bot

A Discord bot to interact with the Streamyfin GitHub repository and streamline issue management, feature requests, and other project-related tasks directly from Discord.

---

## Features

- **Fetch latest releases** from the GitHub repository
- **Provide links** to the GitHub repository and roadmap
- **Create and close issues** directly from Discord
- **Submit feature requests** and start discussions in dedicated threads
- **Show a list of all bot commands** with `/help`
- **Share information** about joining the Testflight beta
- **Allow users to donate** to support the project
- **Display contributor statistics and leaderboard** for the Streamyfin project
- **Remind me:** Set personal reminders with `/remindme`
- **Support instructions:** Get tips on how to get support and report issues
- **Piracy policy:** Clearly state rules on piracy-related discussions
- **Feature status:** Commands like `/tv` and `/wyci` respond to specific feature questions or requests
- **Automatic unit conversion** within Discord messages
- **Multi-language detection** for messages
- **RSS monitoring** for feeds and Reddit posts
- **AI-powered support** with feedback collection
- **Content moderation** using Perspective API
- **Comprehensive error handling** and logging

## Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher) *OR* **Docker & Docker Compose**
- **Redis** (for caching and RSS monitoring) - *included in Docker setup*
- **Discord Bot Token** and application
- **GitHub Personal Access Token** (optional, for enhanced features)

### Quick Start with Docker (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/streamyfin/streamyfin-discord-bot.git
   cd streamyfin-discord-bot
   ```

2. **Configure environment:**
   ```bash
   cp .env.docker .env
   # Edit .env with your configuration
   ```

3. **Start with Docker:**
   ```bash
   ./docker-manage.sh start
   # OR using npm
   npm run docker:start
   ```

4. **View logs:**
   ```bash
   ./docker-manage.sh logs
   # OR
   npm run docker:logs
   ```

### Docker Management Commands

```bash
# Build the Docker image
./docker-manage.sh build

# Start in production mode
./docker-manage.sh start

# Start in development mode (with live reload)
./docker-manage.sh dev

# Stop the bot
./docker-manage.sh stop

# View logs
./docker-manage.sh logs

# Check status
./docker-manage.sh status

# Update the bot
./docker-manage.sh update

# Backup Redis data
./docker-manage.sh backup

# Clean up resources
./docker-manage.sh cleanup
```

### Alternative: Local Installation

1. **Clone and install:**
   ```bash
   git clone https://github.com/streamyfin/streamyfin-discord-bot.git
   cd streamyfin-discord-bot
   npm install
   ```

2. **Setup Redis:**
   ```bash
   # Install Redis locally or use Docker
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Environment setup:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Validate and start:**
   ```bash
   npm run validate
   npm start
   ```

### Development Mode

For development with auto-restart:
```bash
# Local development
npm run dev

# Docker development
./docker-manage.sh dev
```

### Environment Variables

#### Required
- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Your Discord application client ID
- `REPO_ORG` - GitHub organization (e.g., "streamyfin")
- `REPO_NAME` - Repository name (e.g., "streamyfin")

#### Optional
- `GITHUB_TOKEN` - GitHub Personal Access Token (enhances API limits)
- `REDIS_URL` - Redis connection URL (default: redis://localhost:6379)
- `AI_APIKEY` - API key for AI support features
- `AI_SUPPORT_URL` - URL for AI support service
- `PERSPECTIVE_APIKEY` - Google Perspective API key for content moderation
- `FORUM_CHANNEL_ID` - Discord forum channel for issue discussions
- `MOD_LOG_CHANNEL_ID` - Channel for moderation logs
- `CHANNELS_TO_IGNORE` - JSON array of channel IDs to ignore
- `ENABLE_RSS_MONITORING` - Enable RSS feed monitoring (true/false)
- `LOG_LEVEL` - Logging level (DEBUG, INFO, WARN, ERROR)

### Code Quality

#### Linting
```bash
npm run lint          # Check for issues
npm run lint:fix      # Auto-fix issues
```

#### Code Structure
The codebase follows ES modules and modern JavaScript patterns:
- **Proper error handling** with try-catch blocks
- **Async/await** for all asynchronous operations  
- **Modular architecture** with separated concerns
- **Environment validation** on startup
- **Comprehensive logging** with different levels
- **Rate limiting** for API calls and user interactions

## Architecture

### Project Structure
```
├── commands/           # Command implementations
│   ├── bot/           # Bot-related commands
│   └── github/        # GitHub integration commands
├── utils/             # Utility modules
│   ├── constants.js   # Application constants
│   ├── logger.js      # Logging utility
│   └── validation.js  # Environment validation
├── client.js          # Extended Discord client class
├── index.js           # Main application entry point
├── redisClient.js     # Redis connection handling
└── rss.js            # RSS monitoring service
```

### Key Improvements Made

1. **Enhanced Error Handling**: Comprehensive try-catch blocks with proper error reporting
2. **Environment Validation**: Startup validation ensures all required variables are set
3. **Modular Architecture**: Separated concerns into logical modules
4. **Rate Limiting**: Prevents API abuse and spam
5. **Logging System**: Structured logging with different levels
6. **Redis Improvements**: Better connection handling and error recovery
7. **RSS Monitoring**: Robust feed monitoring with cleanup and error handling
8. **Code Quality**: ESLint configuration and consistent coding patterns
9. **Performance**: Optimized API calls and resource management
10. **Documentation**: Comprehensive inline documentation and README

## Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the established coding patterns
4. Add proper error handling and logging
5. Test your changes thoroughly
6. Submit a pull request

## License

This project is licensed under the ISC License.
