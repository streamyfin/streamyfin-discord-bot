const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testflight')
        .setDescription('Explains how to join the Streamyfin Testflight.'),
    async run(interaction) {
        await interaction.reply(
            `Currently, Streamyfin Testflight is full. However, you can send a private message to <@${interaction.client.userId}> with your email address and he will add you to the Testflight beta group manually.`
        );
    },
};