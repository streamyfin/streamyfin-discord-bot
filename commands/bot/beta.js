import { SlashCommandBuilder } from 'discord.js';


export default {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Join the Streamyfin Beta program.'),
    async run(interaction) {
        await interaction.reply({
            content: `To access the Streamyfin beta, you need to subscribe to the Member tier (or higher) on [Patreon](https://www.patreon.com/streamyfin). **People who contribute to the project on an ongoing basis (code, etc.) receive free access to the beta. Contact <@398161771476549654> for that.**

**Make sure to connect your Discord account to your Patreon account** to automatically get access to the ⁠#🧪-beta-releases and typing permissions in #⁠💬-beta-chat channels on Discord. This is where we will post APKs and IPAs. This won't give automatic access to the TestFlight however, so you need to send <@398161771476549654> a DM with the email you use for Apple so that he can manually add you.`,
            allowedMentions: { users: [] }
        })
    },
};
