import { SlashCommandBuilder, MessageFlags, ApplicationCommandType } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('List of commands.'),
    async run(interaction) {

        const contextMenuDescriptions = {
            'Report Message': 'Report a suspicious message to the moderators.',
        };

        const commandList = interaction.client.commands
            .map((cmd) => {
                if (
                    cmd.data.type === ApplicationCommandType.Message ||
                    cmd.data.type === ApplicationCommandType.User
                ) {
                    const desc = contextMenuDescriptions[cmd.data.name] || '**No description**';
                    return `**${cmd.data.name}** (context menu): ${desc}`; 
                } 
                return `**/${cmd.data.name}**: ${cmd.data.description}`;
            })
            .join("\n");

        await interaction.reply({
            content: `Hi there! I'm Finn, your friendly Discord bot for Streamyfin!\n\n${commandList}`,
            flags: MessageFlags.Ephemeral,
        });
    },
};