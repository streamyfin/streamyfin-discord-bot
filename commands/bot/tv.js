import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tv')
        .setDescription('We´re working on it!'),  
        
    async run(interaction) {
        await interaction.reply("We're working on it, but don't think it will arrive soon :).",      
        ); 
    },
};

