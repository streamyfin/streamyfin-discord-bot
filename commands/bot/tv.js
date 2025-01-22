const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tv')
        .setDescription('We´re working on it!'),  
        
    async run(interaction) {
        await interaction.reply("We're working on it! :sweat_smile: <https://github.com/streamyfin/streamyfin/pull/374>"      
        ); 
    },
};

