import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Report a message to the moderators')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Paste the message link or message ID you want to report')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for reporting this message')
        .setRequired(false)
    ),

  async run(interaction) {
    const reason = interaction.options.getString('reason') || '*No reason provided*';
    const messageInput = interaction.options.getString('message');

    // Try to extract messageId and channelId from link or ID
    let messageId, channelId;
    const linkMatch = messageInput.match(/channels\/\d+\/(\d+)\/(\d+)/);
    if (linkMatch) {
      channelId = linkMatch[1];
      messageId = linkMatch[2];
    } else if (/^\d+$/.test(messageInput)) {
      // Only messageId provided, try to use current channel
      messageId = messageInput;
      channelId = interaction.channel.id;
    }

    let reportedMessage = null;
    if (channelId && messageId) {
      try {
        const channel = await interaction.guild.channels.fetch(channelId);
        if (channel && channel.isTextBased()) {
          reportedMessage = await channel.messages.fetch(messageId);
        }
      } catch (e) {
        // ignore
      }
    }

    if (!reportedMessage) {
      return interaction.reply({
        content: 'Could not find the message. Please provide a valid message link or ID.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const logChannelId = process.env.MOD_LOG_CHANNEL_ID;
    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (!logChannel) {
      return interaction.reply({
        content: 'Moderation log channel not found.',
        flags: MessageFlags.Ephemeral,
      });
    }

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
      content: '✅ Your report has been sent to the moderators.',
      flags: MessageFlags.Ephemeral,
    });
  },
};