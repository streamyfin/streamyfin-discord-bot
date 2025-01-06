const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roadmap')
        .setDescription('Get the link to the GitHub roadmap.'),
    async run(interaction) {
        await interaction.reply(
            "📌 Here is our Roadmap: <https://github.com/users/fredrikburmester/projects/5/views/8>"
        );
    },
};