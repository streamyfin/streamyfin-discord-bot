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

## Overview

This bot integrates Streamyfin development workflows directly into the official community server at https://discord.streamyfin.app.  
It assists with issue creation, feature discussions, contributor metrics, repository browsing, project notifications and user guidance.

---

## Commands

| Command | Purpose |
|--------|---------|
| `/help` | Display available commands |
| `/beta` | Information about joining the beta program |
| `/donate` | Support the project financially |
| `/logs` | Instructions for providing Jellyfin logs |
| `/paste` | Link to paste.streamyfin.app for log sharing |
| `/piracy` | Show piracy policy boundaries |
| `/remindme` | Create a personal reminder |
| `/support` | Guidance on how to request support effectively |
| `/tv` | Status of Android TV and Apple TV clients |
| `/wyci` | Response when a requested feature is not planned |
| `/monitor add` | Add a Reddit or RSS feed to monitoring |
| `/monitor remove` | Remove a monitored feed |
| `/monitor list` | List monitored feeds |
| `/monitor edit` | Modify monitored feed settings |
| `Report Message` (context) | Report a message for moderator review |

### GitHub related commands

| Command | Purpose |
|--------|---------|
| `/createissue` | Create a GitHub issue via guided private thread |
| `/closeissue` | Close and lock the related GitHub issue from discussion thread |
| `/featurerequest` | Submit a feature request and create a discussion thread |
| `/issue` | Retrieve or browse issues from GitHub |
| `/repo` | Show repository information or list organization repos |
| `/roadmap` | Show project roadmap |
| `/stats` | Display contributor leaderboard and project metrics |

---

## Installation

```bash
git clone https://github.com/streamyfin/streamyfin-discord-bot
cd streamyfin-discord-bot
npm install

Create a .env file in the project root:
DISCORD_TOKEN=your_discord_bot_token
GITHUB_TOKEN=your_github_personal_access_token
REPO_ORG=streamyfin
REPO_NAME=streamyfin
CLIENT_ID=your_discord_application_id

Start the bot:
npm start
