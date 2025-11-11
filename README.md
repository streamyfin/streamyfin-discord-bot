<p align="center">
  <img src="https://raw.githubusercontent.com/streamyfin/.github/main/streamyfin-github-banner.png" width="100%" alt="Streamyfin" />
</p>

<h1 align="center">Streamyfin Discord Bot</h1>

<p align="center">
  Project workflow and community coordination bot for the Streamyfin ecosystem.
</p>

<p align="center">
  <img src="https://img.shields.io/github/stars/streamyfin/streamyfin-discord-bot?style=flat" />
  <img src="https://img.shields.io/github/last-commit/streamyfin/streamyfin-discord-bot" />
</p>
---

## Overview & Features

The Streamyfin Discord Bot integrates project management, community engagement, and GitHub integration directly into the official Discord server. Key features include:

- **Fetch the latest releases** from the GitHub repository
- **Direct links** to the repository and project roadmap
- **Create and close issues** and feature requests directly from Discord
- **Start discussion threads** for feature requests
- **List all bot commands** with `/help`
- **Information about the beta/Testflight program**
- **Support the project financially** via `/donate`
- **Display contributor statistics and leaderboard**
- **Set personal reminders** via `/remindme`
- **Instructions for submitting support requests and logs**
- **Piracy policy** explicitly clarified
- **Status checks for Android TV and Apple TV clients** (`/tv`)
- **Feedback for non-planned features** via `/wyci`
- **Monitor RSS and Reddit feeds** (add/remove/list/edit)
- **Automatic unit conversion & language detection** on messages
- **AI-powered support feedback**
- **Content moderation via Perspective API**
- **Comprehensive error handling and logging**
---

## Command Reference

| Command                 | Description                                                   |
|-------------------------|---------------------------------------------------------------|
| `/help`                 | List all available commands                                   |
| `/beta`                 | Information about the beta/Testflight program                 |
| `/donate`               | Donate to support the project                                 |
| `/logs`                 | Instructions for submitting Jellyfin logs                     |
| `/paste`                | Link to paste.streamyfin.app for log sharing                  |
| `/piracy`               | Show piracy policy boundaries                                 |
| `/remindme`             | Set a personal reminder                                       |
| `/support`              | Guide for requesting support                                  |
| `/tv`                   | Show status of Android TV and Apple TV clients                |
| `/wyci`                 | Feedback when a requested feature is not planned              |
| `/monitor add`          | Add an RSS/Reddit feed to monitor                             |
| `/monitor remove`       | Remove a monitored feed                                       |
| `/monitor list`         | List currently monitored feeds                                |
| `/monitor edit`         | Edit settings of a monitored feed                             |
| `Report Message`        | Report a message for moderator review                         |
| `/createissue`          | Open a GitHub issue                                           |
| `/closeissue`           | Close and lock a linked GitHub issue                          |
| `/featurerequest`       | Submit a feature request and start a thread                   |
| `/issue`                | Retrieve or browse GitHub issues                              |
| `/repo`                 | Show repository or organization info                          |
| `/roadmap`              | Display the project roadmap                                   |
| `/stats`                | Contributor leaderboard and metrics                           |
---

## Installation & Setup

### Prerequisites

- **Node.js** (v18 or higher) *OR* **Docker & Docker Compose**
- **Redis** (for caching and RSS monitoring; included with Docker setup)
- **Discord Bot Token** and application (required)
- **GitHub Personal Access Token** (optional; enhances API limits)

### Quick Start with Docker (Recommended)

```bash
git clone https://github.com/streamyfin/streamyfin-discord-bot.git
cd streamyfin-discord-bot
cp .env.docker .env   # Edit this file for your configuration
./docker-manage.sh start
```

Additional Docker management commands:

```bash
./docker-manage.sh build          # Build the Docker image
./docker-manage.sh start          # Start in production mode
./docker-manage.sh dev            # Development mode (live reload)
./docker-manage.sh stop           # Stop the bot
./docker-manage.sh logs           # View logs
./docker-manage.sh status         # Check status
./docker-manage.sh update         # Update the bot
./docker-manage.sh backup         # Backup Redis data
./docker-manage.sh cleanup        # Clean up resources
```

### Local Installation Alternative

```bash
git clone https://github.com/streamyfin/streamyfin-discord-bot.git
cd streamyfin-discord-bot
npm install
docker run -d -p 6379:6379 redis:7-alpine   # Or install Redis locally
cp .env.example .env    # Edit this file with your config
npm run validate
npm start
```

### Development Mode

```bash
npm run dev
./docker-manage.sh dev
```
---

## Environment Variables

**Required**
- `DISCORD_TOKEN` - Your Discord bot token
- `CLIENT_ID` - Discord application client ID
- `REPO_ORG` - GitHub organization (e.g. "streamyfin")
- `REPO_NAME` - Repository name (e.g. "streamyfin")

**Optional**
- `GITHUB_TOKEN` (for enhanced API limits)
- `REDIS_URL` (default: redis://localhost:6379)
- `AI_APIKEY` and `AI_SUPPORT_URL`
- `PERSPECTIVE_APIKEY` (for moderation)
- `FORUM_CHANNEL_ID`, `MOD_LOG_CHANNEL_ID`, `CHANNELS_TO_IGNORE`, `ENABLE_RSS_MONITORING`, `LOG_LEVEL`
---

## Architecture & Project Structure

```
├── commands/           # Bot and GitHub command implementations
├── utils/              # Constants, logger, validation
├── client.js           # Extended Discord client
├── index.js            # Main entry point
├── redisClient.js      # Redis connection handling
└── rss.js              # RSS monitoring service
```

## Code Quality & Contribution

- Linting: `npm run lint` and `npm run lint:fix`
- Follow coding patterns, error handling, and logging best practices
- Fork, branch, test, and submit pull requests after thorough testing

