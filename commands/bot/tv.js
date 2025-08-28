import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tv')
        .setDescription('We´re working on it!'),  
        
    async run(interaction) {
        await interaction.reply("The Android TV version of Streamyfin is now available in an early alpha stage on GitHub as a separate APK. It must be sideloaded manually for now, and we strongly encourage early testers to share their feedback. Apple TV isn’t available yet, but once it’s released, you’ll hear about it.",      
        ); 
    },
};

