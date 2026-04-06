import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tv')
        .setDescription('We´re working on it!'),  
        
    async run(interaction) {
        await interaction.reply("TV development is currently on hold due to limited time.\n\n**Apple TV:** In beta — still needs bug fixes and HDR support.\n**Android TV:** In progress — still needs UI work.",
        );
    },
};

