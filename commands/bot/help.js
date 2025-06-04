import { SlashCommandBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List of commands.'),
    async run(interaction) {
        const commandList = interaction.client.commands
            .map((cmd) => `**/${cmd.data.name}**: ${cmd.data.description}`)
            .join("\n");

        await interaction.reply({
            content: `
            Hi there! I'm Finn, your friendly Discord bot for all kinds of things related to Streamyfin! Here's a list of all the commands you can use:  
            \n${commandList}
            \nI can also help you convert units like km or celsius to miles and fahrenheit, and I can translate your messages into English at any time, if you prefer to explain something in your native language.`,
            flags: MessageFlags.Ephemeral,
        });
    },
};