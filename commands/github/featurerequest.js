const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('featurerequest')
        .setDescription('Request a new feature for Streamyfin.'),
    async run(interaction) {
        const description = options.getString("description");
        const targetChannel = client.channels.cache.get('1273278866105831424');
        if (!targetChannel) {
            await interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });
            return;
        }

        const thread = await targetChannel.threads.create({
            name: `Feature: ${description} requested by ${interaction.user.username}`,
            reason: 'User requested a feature',
        });

        await thread.send({ content: `🎉 Thank you for your feature request! Feel free to discuss this feature here!` });
        await interaction.reply({ content: `✅ Your feature request has been submitted and a discussion thread has been created: [${thread.name}](https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${thread.id})`, ephemeral: true });
    },
};