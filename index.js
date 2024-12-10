const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const GITHUB_REPO = 'https://github.com/fredrikburmester/streamyfin';

// Command Handler
const commands = {
    roadmap: {
        description: 'Sends the GitHub roadmap link.',
        execute: (message) => {
            message.reply(`Here is the roadmap: ${GITHUB_REPO}/projects/5`);
        },
    },
    issue: {
        description: 'Sends a link to a specific GitHub issue.',
        execute: (message, args) => {
            if (!args[0]) {
                message.reply('Please provide an issue number, e.g., `!issue #123`.');
                return;
            }

            const issueNumber = args[0].replace('#', '');
            if (isNaN(issueNumber)) {
                message.reply('Invalid issue number. Use the format `!issue #123`.');
            } else {
                message.reply(`Here is the link to Issue #${issueNumber}: ${GITHUB_REPO}/issues/${issueNumber}`);
            }
        },
    },
    testflight: {
        description: 'Explains how to join the Streamyfin testflight.',
        execute: (message) => {
            const userId = '398161771476549654';
            message.reply('Currently the only way to join our Beta is to reach out to <@${userId}}> via DM and send him your email address.');
        },
    },
};

client.once('ready', () => {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot || !message.content.startsWith('/')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = commands[commandName];
    if (!command) {
        message.reply(`Unknown command: \`${commandName}\``);
        return;
    }

    try {
        command.execute(message, args);
    } catch (error) {
        console.error(error);
        message.reply('There was an error executing that command.');
    }
});

client.login(process.env.DISCORD_TOKEN);
