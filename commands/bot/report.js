const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a message to the moderators')
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for reporting this message')
        .setRequired(false)
    ),

  async execute(interaction) {
    const reason = interaction.options.getString('reason') || '*No reason provided*';
    const referencedMessage = interaction.options.getMessage('message', false) || interaction.message?.reference;

    const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (!logChannel) {
      return interaction.reply({
        content: 'Moderation log channel not found.',
        flags: MessageFlags.Ephemeral,
      });
    }

    
    if (!interaction.channel || !interaction.options || !interaction.options.resolved?.messages?.first()) {
      return interaction.reply({
        content: 'Please reply to the message you want to report using this command.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const reportedMessage = interaction.options.resolved.messages.first();

    const embed = new EmbedBuilder()
      .setTitle('🚨 Message Reported')
      .setDescription(`A message was reported by **${interaction.user.tag}**.`)
      .addFields(
        { name: 'Reported User', value: reportedMessage.author.tag, inline: true },
        { name: 'Channel', value: `<#${reportedMessage.channel.id}>`, inline: true },
        { name: 'Reason', value: reason },
        { name: 'Message Content', value: reportedMessage.content || '*[No content]*' },
        {
          name: 'Link',
          value: `https://discord.com/channels/${interaction.guild.id}/${reportedMessage.channel.id}/${reportedMessage.id}`
        }
      )
      .setColor(0xff0000)
      .setTimestamp();

    await logChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: '✅ Your report has been sent to the moderators.',flags: MessageFlags.Ephemeral,
    });
  },
};