const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('piracy')
        .setDescription('How we handle piracy related messages on this discord server.'),

    async run(interaction) {
        await interaction.reply("🏴‍☠️ Discussions related to piracy or content acquisition are strictly prohibited on this server. This rule exists to ensure we avoid legal trouble and protect the future of this project, as well as its reputation.");
    },
};