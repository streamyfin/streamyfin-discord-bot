<p align="center">
  <img src="https://raw.githubusercontent.com/streamyfin/.github/refs/heads/main/streamyfin-github-banner.png" width="100%" alt="Streamyfin" />
</p>

<h1 align="center">Streamyfin Discord Bot</h1>
<p align="center">
  Project workflow and community coordination bot for the Streamyfin ecosystem.
</p>

---

## Overview

This Discord bot integrates Streamyfin development workflows directly into the Streamyfin Discord server and assists with issue creation, feature discussions, contributor metrics, repository browsing, project notifications, and user guidance.

---

## Setup

The bot runs on Node.js and ships with a Dockerfile for containerized deployment.

### Requirements
- Node.js (see `package.json` for version)
- Redis (used for caching)
- A Discord bot token with the required intents/permissions
- A GitHub token for the GitHub-related commands

### Run with Docker

1. Copy `.env.example` to `.env` and fill in your Discord bot token, GitHub token, and Redis connection details.
2. Copy `example.docker-compose.yml` to `docker-compose.yml` and adjust as needed.
3. Start the stack:
   ```bash
   docker compose up -d
   ```

### Run locally

1. Copy `.env.example` to `.env` and fill in the required values.
2. Install dependencies and start the bot:
   ```bash
   npm install
   npm start
   ```

---

## Commands

| Command                    | Purpose                                          |
| --------------------------- | -------------------------------------------------- |
| `/help`                    | Display available commands                       |
| `/beta`                    | Information about joining the beta program        |
| `/donate`                  | Support the project financially                   |
| `/logs`                    | Instructions for providing Jellyfin logs          |
| `/paste`                   | Link to paste.streamyfin.app for log sharing       |
| `/piracy`                  | Show piracy policy boundaries                      |
| `/remindme`                | Create a personal reminder                         |
| `/support`                 | Guidance on how to request support effectively     |
| `/tv`                      | Status of Android TV and Apple TV clients          |
| `/wyci`                    | Response when a requested feature is not planned   |
| `Report Message` (context) | Report a message for moderator review              |

### GitHub-related commands

| Command            | Purpose                                                         |
| -------------------- | ------------------------------------------------------------------ |
| `/createissue`     | Create a GitHub issue via guided private thread                  |
| `/closeissue`      | Close and lock the related GitHub issue from discussion thread   |
| `/featurerequest`  | Submit a feature request and create a discussion thread          |
| `/issue`           | Retrieve or browse issues from GitHub                            |
| `/repo`            | Show repository information or list organization repos           |
| `/roadmap`         | Show project roadmap                                             |
| `/stats`           | Display contributor leaderboard and project metrics              |

> `/closeissue` and `Report Message` require moderator/maintainer permissions in the server.

---

## 🐛 Issues & Support

Found a bug or have a feature request?
- **[Open an issue](https://github.com/streamyfin/streamyfin-discord-bot/issues)**
