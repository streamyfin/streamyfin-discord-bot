import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Join the Streamyfin Beta program.'),
    async run(interaction) {
        await interaction.reply({
            content: `**Beta access requires a Member tier (or higher) subscription on [Patreon](https://www.patreon.com/c/streamyfin/membership)**

Active, ongoing code contributors receive free beta access. Contact <@398161771476549654> if this applies to you.

**Setup Required**
Link your Patreon account to Discord.

Once linked, you will recieve:
* Typing permissions in https://discord.com/channels/1273259347689869413/1324488556567072920
* Access to https://discord.com/channels/1273259347689869413/1275046992690675752

Beta builds (APKs and IPAs) are posted there.

**TestFlight for iOS and tvOS**
Patreon access does not automatically grant TestFlight access.
DM <@398161771476549654> with your Apple ID email to be added.`,
            allowedMentions: { users: [] }
        });
    },
};
