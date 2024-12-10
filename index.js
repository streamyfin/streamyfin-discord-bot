const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
require('dotenv').config();

const GITHUB_REPO = 'https://github.com/fredrikburmester/streamyfin';

// Command Definitions
const commands = [
    {
        name: 'roadmap',
        description: 'Sends the GitHub roadmap link.',
    },
    {
        name: 'issue',
        description: 'Links to a specific GitHub issue. Usage: /issue <number>',
        options: [
            {
                name: 'number',
                description: 'The issue number to link to.',
                type: 4, // Integer type
                required: true,
            },
        ],
    },
    {
        name: 'testflight',
        description: 'Explains how to join the Streamyfin testflight.',
    },
];

// Register Commands via Discord API
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');

        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );

        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
})();

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

// Handle Command Execution
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'roadmap') {
        await interaction.reply(`Here is the roadmap: ${GITHUB_REPO}/projects/5`);
    } else if (commandName === 'issue') {
        const issueNumber = options.getInteger('number');
        await interaction.reply(
            `Here is the link to Issue #${issueNumber}: ${GITHUB_REPO}/issues/${issueNumber}`
        );
    } else if (commandName === 'testflight') {
        const userId = '398161771476549654';
        await interaction.reply(
            'Currently the only way to join our Beta is to reach out to <@${userId}> via DM and send him your email address.'
        );
    }
});

// Event: Bot Ready
client.once('ready', () => {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);
});

// Login the Bot
client.login(process.env.DISCORD_TOKEN);
