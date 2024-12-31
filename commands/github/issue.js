const { SlashCommandBuilder } = require('discord.js');
const axios = require ("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Get details about a specific issue from GitHub.')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('The issue number')
                .setRequired(true)
        ),
    async run(interaction) {
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const issueNumber = interaction.options.getInteger("number");

        try {
            const response = await axios.get(
                `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
                {
                    headers: {
                        Authorization: `token ${GITHUB_TOKEN}`,
                    },
                }
            );

            const issue = response.data;
            await interaction.reply(
                `🔗 **Issue #${issue.number}: ${issue.title}**\n${issue.html_url}`
            );
        } catch (error) {
            await interaction.reply("❌ Issue not found or an error occurred.");
        }
    },
};