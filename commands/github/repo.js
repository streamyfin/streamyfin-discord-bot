const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repo')
        .setDescription('Get the link to the GitHub repository.'),
    async run(interaction) {
        await interaction.reply(
            "📡 Here is our GitHub repository: <https://github.com/fredrikburmester/streamyfin>"
        );
    },
};