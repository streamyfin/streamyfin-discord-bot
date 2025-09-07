# Copilot Instructions for Streamyfin Discord Bot

## Project Overview

This repository contains a Discord bot designed to interact with the [Streamyfin](https://github.com/streamyfin/streamyfin) community.  
The bot provides step-by-step instructions, support resources, and GitHub integration for issue tracking and feature requests.

## Main Technologies

- Node.js
- Discord.js (v14)
- JavaScript (ES Modules)
- GitHub Actions (CI/CD)

## Code Structure

- `index.js` – Main bot entry point
- `commands/` – Directory containing individual command files
- `README.md` – Project documentation
- `.github/` – GitHub workflows and issue templates
- `package.json` – Project dependencies and scripts

## Coding Conventions

- Use ES Modules (`import`/`export`) for all code.
- Each command exports an object with `data` (SlashCommandBuilder) and an async `run` function.
- Use Discord.js interaction replies for user-facing messages.

## Command Usage

- All commands are registered and handled in `index.js`.

## Commit Messages

- Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) (e.g., `feat:`, `fix:`, `chore:`).
- Example: `feat(logs): add Docker instructions to log upload guide`

## Special Instructions

- When suggesting code, follow the existing command structure and reply formatting.
- When adding new commands, ensure they´re organized in the `commands/` directory. `commands/bot/`for bot-related commands, `commands/github/` for commands that interact with the [Streamyfin GitHub repo](https://github.com/streamyfin/streamyfin).
- Prefer concise, markdown-formatted replies for Discord interactions.

---

**Copilot: Please use these instructions to provide context-aware suggestions and code completions for this repository.**
