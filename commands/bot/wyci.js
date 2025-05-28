const {SlashCommandBuilder} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wyci')
        .setDescription('When we will add feature xy to Streamyfin?'),
    async run(interaction) {
        await interaction.reply("We appreciate your input, but we have no plans for this feature yet. Feel free to code it yourself and open a pull request on our GitHub repository!",); 
    },
};
