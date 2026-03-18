import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Link to the Jellyfin documentation'),

    async run(interaction) {
        await interaction.reply('📖 Jellyfin Documentation: https://jellyfin.org/docs/');
    },
};
