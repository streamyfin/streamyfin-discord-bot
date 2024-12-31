const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Get a list of available commands.'),
    async run(interaction) {
        const commandList = commands
            .map((cmd) => `**/${cmd.name}**: ${cmd.description}`)
            .join("\n");

        await interaction.reply({
            content: `Available commands:\n${commandList}`,
            ephemeral: false,
        });
    },
};