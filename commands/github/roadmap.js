const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roadmap')
        .setDescription('Link to the GitHub roadmap.'),
    async run(interaction) {
        await interaction.reply(
            "📌 Here is our Roadmap: <https://github.com/orgs/streamyfin/projects/3>"
        );
    },
};