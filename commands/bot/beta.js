import { SlashCommandBuilder } from 'discord.js';


export default {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Join the Streamyfin Beta program.'),
    async run(interaction) {
        await interaction.reply(
            `To access the Streamyfin beta, you need to subscribe to the Member tier (or higher) on [Patreon](https://www.patreon.com/streamyfin). This will give you immediate access to the ⁠#🧪-beta-releases and typing permissions in #⁠💬-beta-chat channels on Discord and we´ll know that you have subscribed. This is where we will post APKs and IPAs. This won't give automatic access to the TestFlight however, so you need to send <@${interaction.client.userId}> a DM with the email you use for Apple so that he can manually add you.\n\n**People who contribute to the project on an ongoing basis (code, etc.) receive free access to the beta. Contact <@${interaction.client.userId}> for that as well.**`
        )
    },
};
