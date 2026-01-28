import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Join the Streamyfin beta program.'),
    async run(interaction) {
        await interaction.reply({
            content: `**Streamyfin Beta Access**  
Requires a Member tier (or higher) on [Patreon](https://www.patreon.com/c/streamyfin/membership) + linked Discord account

Includes:
- Typing access: https://discord.com/channels/1273259347689869413/1324488556567072920
- Beta releases: https://discord.com/channels/1273259347689869413/1275046992690675752

**TestFlight**  
Message [Cagemaster on Patreon](https://www.patreon.com/messages/13366769-198048805?mode=user&tab=direct-messages) with your Apple ID to be added

**Contributors**  
Active Streamyfin contributors are eligible for free beta access.`,
            allowedMentions: { users: [] }
        });
    },
};
