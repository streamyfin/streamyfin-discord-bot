import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import redisClient from '../../redisClient.js';

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

    let messageId, channelId;
    const linkMatch = messageInput.match(/channels\/\d+\/(\d+)\/(\d+)/);
    if (linkMatch) {
      channelId = linkMatch[1];
      messageId = linkMatch[2];
    } else if (/^\d+$/.test(messageInput)) {
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
      } catch (e) {}
    }

    if (!reportedMessage) {
      return interaction.reply({
        content: 'Could not find the message. Please provide a valid message link or ID.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const reportData = {
      messageId: reportedMessage.id,
      authorId: reportedMessage.author.id,
      authorTag: reportedMessage.author.tag,
      content: reportedMessage.content,
      channelId: reportedMessage.channel.id,
      guildId: interaction.guild.id,
      reporterId: interaction.user.id,
      reporterTag: interaction.user.tag,
      reason,
      createdTimestamp: reportedMessage.createdTimestamp,
      reportedAt: Date.now(),
    };
    
    await redisClient.set(
      `reported_message_${reportedMessage.id}`, 
      JSON.stringify(reportData),
      { EX: 60 * 60 * 24 * 90 }
    );

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
        { name: 'Message ID', value: reportedMessage.id, inline: true },
        { 
          name: 'Original Timestamp', 
          value: `<t:${Math.floor(reportedMessage.createdTimestamp / 1000)}:F>`, 
          inline: true 
        },
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