import { 
  ContextMenuCommandBuilder, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags
} from 'discord.js';
import redisClient from '../../redisClient.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('Report Message')
    .setType(ApplicationCommandType.Message),

  async run(interaction) {
    
    if (interaction.isModalSubmit && interaction.isModalSubmit()) {
      try {
        const [_, messageId] = interaction.customId.split('report_modal_');
        const reportedMessage = await interaction.channel.messages.fetch(messageId);
        const reason = interaction.fields.getTextInputValue('report_reason');

        const reportData = {
          messageId: reportedMessage.id,
          authorId: reportedMessage.author.id,
          authorTag: reportedMessage.author.tag,
          content: reportedMessage.content,
          channelId: reportedMessage.channel.id,
          guildId: interaction.guild.id,
          reporterId: interaction.user.id,
          reporterTag: interaction.user.tag,
          createdTimestamp: reportedMessage.createdTimestamp,
          reportedAt: Date.now(),
          reason 
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
            MessageFlags: MessageFlags.Ephemeral,
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🚨 Message Reported')
          .setDescription(`A message was reported by **${interaction.user.tag}**.`)
          .addFields(
            { name: 'Reported User', value: `<@${reportedMessage.author.id}>`, inline: true },
            { name: 'Channel', value: `<#${reportedMessage.channel.id}>`, inline: true },
            { name: 'Message Content', value: reportedMessage.content || '*[No content]*' },
            { name: 'Reason', value: reason }, 
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

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`resolve_report_${reportedMessage.id}`)
            .setLabel('mark as solved')
            .setStyle(ButtonStyle.Success)
        );

        await logChannel.send({ 
          embeds: [embed],
          components: [actionRow]
        });

        await interaction.reply({
          content: '✅ Your report has been sent to the moderators.',
          flags: MessageFlags.Ephemeral ,
        });
      } catch (error) {
        console.error('Error reporting message:', error);
        await interaction.reply({
          content: '❌ An error occurred while reporting the message.',
          MessageFlags: MessageFlags.Ephemeral,
        });
      }
      return;
    }

    
    const modal = new ModalBuilder()
      .setCustomId(`report_modal_${interaction.targetId}`)
      .setTitle('Nachricht melden');

    const reasonInput = new TextInputBuilder()
      .setCustomId('report_reason')
      .setLabel('Reason for the report ')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder('please describe the reason for your report...');

    const actionRow = new ActionRowBuilder().addComponents(reasonInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  }
};