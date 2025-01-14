const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('beta')
        .setDescription('Join the Streamyfin Beta program.'),
    async run(interaction) {
        await interaction.reply(
            `To access the Streamyfin beta, you need to subscribe to the Member tier (or higher) on [Patreon](https://www.patreon.com/streamyfin). This will give you immediate access to the ⁠#🧪-public-beta channel on Discord and we´ll know that you have subscribed. This is where we will post APKs and IPAs. This won't give automatic access to the TestFlight however, so you need to send <@${interaction.client.userId}> a DM with the email you use for Apple so that he can manually add you.`
        )
    },
};