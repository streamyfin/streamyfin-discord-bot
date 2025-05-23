const {SlashCommandBuilder} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('set a reminder'),
}
