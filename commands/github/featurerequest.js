import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonStyle,
  ButtonBuilder,
  ActionRowBuilder,
  MessageFlags
} from 'discord.js';
import axios from 'axios';

const FEATURE_REQUEST_CHANNEL_ID = process.env.FEATURE_REQUEST_CHANNEL_ID || '1273278866105831424';

export default {
  data: new SlashCommandBuilder()
    .setName('featurerequest')
    .setDescription('Request a new feature.')
    .addStringOption(option =>
      option.setName('description')
        .setDescription('The description of the feature you want to request.')
        .setRequired(true)),
  async run(interaction) {
    const description = interaction.options.getString('description');
    const targetChannel = interaction.client.channels.cache.get(FEATURE_REQUEST_CHANNEL_ID);
    const memberRoles = interaction.member.roles.cache.map((role) => role.name);
    const allowedRoles = ['Developer', 'Administrator'];

    if (!targetChannel) {
      await interaction.reply({ content: '❌ Target channel not found.', flags: MessageFlags.Ephemeral });
      return;
    }

    const thread = await targetChannel.threads.create({
      name: `Feature: ${description} requested by ${interaction.user.username}`,
      reason: 'User requested a feature',
    });

    const button = new ButtonBuilder().setCustomId('submit_to_github').setLabel('Submit to Github').setStyle(ButtonStyle.Success);
    const row = new ActionRowBuilder().addComponents(button);

    await thread.send({ content: '🎉 Thank you for your feature request! Feel free to discuss this feature here!', components: [row] });
    await interaction.reply({ content: `✅ Your feature request has been submitted and a discussion thread has been created: [${thread.name}](https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${thread.id})`, flags: MessageFlags.Ephemeral });

    const filter = (i) => i.user.id === interaction.user.id && i.customId === 'submit_to_github';
    const collector = thread.createMessageComponentCollector({ filter, time: 300000 }); // 5 minutes

    collector.on('collect', async (buttonInteraction) => {
      if (!memberRoles.some((role) => allowedRoles.includes(role))) {
        await buttonInteraction.reply({ content: '❌ You do not have permission to submit this to GitHub.', flags: MessageFlags.Ephemeral });
        return;
      }

      const modalId = `githubModal_${Date.now()}`;
      const modal = new ModalBuilder().setCustomId(modalId).setTitle('Github Username');
      const usernameInput = new TextInputBuilder()
        .setCustomId('username')
        .setLabel('Please enter your Github username')
        .setPlaceholder('Github Username')
        .setStyle(TextInputStyle.Short);
      modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));

      await buttonInteraction.showModal(modal);

      try {
        const modalInteraction = await buttonInteraction.awaitModalSubmit({
          filter: (i) => i.customId === modalId && i.user.id === interaction.user.id,
          time: 60000,
        });

        const githubUsername = modalInteraction.fields.getTextInputValue('username');

        // Validate GitHub username
        try {
          const userResponse = await axios.get(`https://api.github.com/users/${githubUsername}`);
          if (userResponse.data.login !== githubUsername) {
            await modalInteraction.reply({ content: `❌ Github username ${githubUsername} is not valid.`, flags: MessageFlags.Ephemeral });
            return;
          }
        } catch {
          await modalInteraction.reply({ content: `❌ Github username ${githubUsername} not found.`, flags: MessageFlags.Ephemeral });
          return;
        }

        // Create GitHub issue
        const response = await axios.post(
          'https://api.github.com/repos/streamyfin/streamyfin/issues',
          {
            title: `Feature request from Discord user ${interaction.user.username}`,
            body: description,
            labels: ['✨ enhancement'],
            assignees: [githubUsername],
          },
          {
            headers: {
              Authorization: `token ${interaction.client.githubToken}`,
            },
          }
        );

        await modalInteraction.reply({ content: `✅ Feature request created successfully: ${response.data.html_url}` });
        await thread.send('🔒 This thread has been locked as details have been collected and sent to GitHub.');
        collector.stop();
      } catch (error) {
        if (error.code === 'InteractionCollectorError') {
          // Modal timed out, ignore
          return;
        }
        console.error('[FEATUREREQUEST] Error submitting feature request:', error.message);
        await thread.send('❌ Failed to submit the feature request. Please try again.');
      }
    });
  },
};