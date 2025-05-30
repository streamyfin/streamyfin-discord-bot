import { SlashCommandBuilder, ChannelType, MessageFlags } from 'discord.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('closeissue')
    .setDescription('Close and lock a GitHub issue.')
    .addStringOption(option =>
      option.setName('state')
        .setDescription('The state to set for the GitHub issue (e.g., open, closed).')
        .setRequired(true)
        .addChoices(
          { name: 'Open', value: 'open' },
          { name: 'Closed', value: 'closed' }
        )
    )
    .addStringOption(option =>
      option.setName('state_reason')
        .setDescription('The reason for closing the GitHub issue.')
        .setRequired(true)
        .addChoices(
          { name: 'Completed', value: 'completed' },
          { name: 'Not Planned', value: 'not_planned' }
        )
    ),
  async run(interaction) {
    const GITHUB_API_BASE = "https://api.github.com";
    const allowedRoles = ["Developer", "Administrator"];
    const state = interaction.options.getString("state");
    const stateReason = interaction.options.getString("state_reason");
    const thread = interaction.channel;

    // Check if the user has the required role
    const memberRoles = interaction.member.roles.cache.map((role) => role.name);
    if (!memberRoles.some((role) => allowedRoles.includes(role))) {
      await interaction.reply({ content: "❌ You do not have permission to use this command.", flags: MessageFlags.Ephemeral });
      return;
    }

    // Check if the command is executed in a forum thread
    if (thread.type !== ChannelType.PublicThread && thread.type !== ChannelType.PrivateThread) {
      await interaction.reply({ content: "❌ This command can only be used in a forum thread.", flags: MessageFlags.Ephemeral });
      return;
    }

    try {
      const messages = await thread.messages.fetch({ limit: 100 });
      const githubLinkMessage = messages.find(
        (msg) => msg.content.includes("https://github.com") && msg.content.includes("/issues/")
      );

      if (!githubLinkMessage) {
        await interaction.reply({ content: "❌ No GitHub link found in the thread.", flags: MessageFlags.Ephemeral });
        return;
      }

      const issueUrlMatch = githubLinkMessage.content.match(/\/issues\/(\d+)/);
      if (!issueUrlMatch) {
        await interaction.reply({ content: "❌ Invalid GitHub link in the thread.", flags: MessageFlags.Ephemeral });
        return;
      }

      const issueNumber = issueUrlMatch[1];

      await axios.patch(
        `${GITHUB_API_BASE}/repos/${interaction.client.repoOrg}/${interaction.client.repoName}/issues/${issueNumber}`,
        { state, state_reason: stateReason },
        { headers: { Authorization: `token ${interaction.client.githubToken}` } }
      );

      await thread.setLocked(true, "Thread closed by developer.");
      await thread.send(`✅ This issue has been resolved and the GitHub issue is now "${state}" with reason "${stateReason}".`);
      await interaction.reply({ content: "✅ Issue closed successfully.", flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error("Error closing issue:", error);
      await interaction.reply({ content: "❌ Failed to close the issue. Please try again.", flags: MessageFlags.Ephemeral });
    }
  },
};