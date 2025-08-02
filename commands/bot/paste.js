import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('paste')
        .setDescription('Link to our paste tool'),

    async run(interaction) {
        await interaction.reply('Use https://paste.streamyfin.app for large logs or text. Be careful sharing private information.');
    },
};
