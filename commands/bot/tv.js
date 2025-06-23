import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tv')
        .setDescription('We´re working on it!'),  
        
    async run(interaction) {
        await interaction.reply("The TV version of Streamyfin is still under development, but we're pleased to report that recent progress has been steady and promising. While it's too soon to commit to a release date, development is moving forward, and we'll keep you updated along the way.",      
        ); 
    },
};

