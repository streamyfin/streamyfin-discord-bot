import { SlashCommandBuilder, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('issue')
    .setDescription('Get GitHub issue details.')
    .addStringOption(option => 
      option.setName('repo')
        .setDescription('Repo name of your choice defaults to streamyfin')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('number')
        .setDescription('The issue number')
        .setRequired(false)
    ),
  async run(interaction) {
    const issueNumber = interaction.options.getInteger('number');
    let repoName = interaction.options.getString('repo');

    if (repoName) {
      if (!issueNumber) return interaction.reply({ content: 'Please provide an issue number.', flags: MessageFlags.Ephemeral});
    }

    if (!repoName) repoName = interaction.client.repoName;
    const repoCheck = await interaction.client.repoCheck(repoName);
    if (!repoCheck.exists) {
      return interaction.reply({content: `${repoName} does not exist.`, flags: MessageFlags.Ephemeral});
    }
    if (issueNumber) {
      try {
        const response = await axios.get(
          `https://api.github.com/repos/${interaction.client.repoOrg}/${repoName}/issues/${issueNumber}`,
          {
            headers: {
              Authorization: `token ${interaction.client.githubToken}`,
            },
          }
        );

        const issue = response.data;
        await interaction.reply(
          `🔗 **Issue #${issue.number}: ${issue.title}**\n${issue.html_url}`
        );
      } catch (error) {
        await interaction.reply(`❌ Issue not found for ${repoName} or an error occurred.`);
      }
      return;
    }

    const response = await axios.get(`https://api.github.com/repos/${interaction.client.repoOrg}/${interaction.client.repoName}/issues`);
    if (!response.data) return interaction.reply('Please provide an issue number');

    const options = [];
    for (const [, value] of Object.entries(response.data.slice(0, 20))) {
      options.push({ label: `${value.title} - ${value.number}`, value: value.node_id, description: `${value.body.slice(0, 97)  }...` });
    }
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`IssueList_${interaction.user.id}`)
      .setPlaceholder('Select a choice!')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options);
    const msg = await interaction.reply({ content: 'Please select an issue!', ephemeral: false, components: [{ type: 1, components: [menu] }] });
    const filter = (msg) => interaction.user.id === msg.user.id;
    const collector = msg.createMessageComponentCollector({ filter, errors: ['time'], time: 120000 });

    collector.on('collect', (interaction) => {
      const issue = response.data.find(issue => issue.node_id === interaction.values[0]);
      if (issue) {
        interaction.update({ content: `🔗 **Issue #${issue.number}: ${issue.title}**\n${issue.html_url}` });
      } else {
        interaction.update({ content: 'An error occurred. The issue was not found.' });
      }
    });
  }
};