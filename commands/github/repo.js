const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repo')
        .setDescription('Link to the GitHub repository.'),
    async run(interaction) {
        await interaction.reply(
            "📡 Here is our GitHub repository: <https://github.com/streamyfin/streamyfin>"
        );
    },
};