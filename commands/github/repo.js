import { SlashCommandBuilder, StringSelectMenuBuilder } from 'discord.js';
import axios from 'axios';


export default {
  data: new SlashCommandBuilder()
    .setName('repo')
    .setDescription('Link to the GitHub repository.')
    .addStringOption(option =>
      option.setName('repo')
        .setDescription('A streamyfin\'s repo name')
        .setRequired(false)
    ),
  async run(interaction) {
    const repoName = interaction.options.getString('repo');

    if (repoName) {
      try {
        const repo = await interaction.client.repoCheck(repoName);
        if (!repo.exists) return interaction.reply('Repo does not exist under Streamyfin');
        const embed = {
          title: `Repository: ${repo.data.name}`,
          color: 0x6A0DAD,
          description: repo.data.description || 'No description.',
          thumbnail: {
            url: repo.data.owner.avatar_url
          },
          fields: [
            {
              name: 'Forks',
              value: repo.data.forks_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Open Issues',
              value: repo.data.open_issues_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Stars',
              value: repo.data.stargazers_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Language',
              value: repo.data.language || 'Not specified',
              inline: true
            },
          ],
          url: repo.data.html_url
        };
        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.log(error);
        await interaction.reply('❌ Repo not found or an error occurred.');
      }
      return;
    }
    const repos = await axios.get(`https://api.github.com/orgs/${interaction.client.repoOrg}/repos`).then(r => r.data);
    const options = [];
    for (const [, value] of Object.entries(repos.slice(0, 20))) {
      options.push({ label: `${value.name}`, value: value.node_id, description: `${value?.description?.slice(0, 97)  }...` });
    }
    const menu = new StringSelectMenuBuilder()
      .setCustomId(`RepoList_${interaction.user.id}`)
      .setPlaceholder('Select a repo!')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options);

    const list = `**Repositories:**\n\n${  repos.map(r => `- [${r.name}](${r.html_url}): ${r.description || ''}`).join('\n')}`;
    const msg = await interaction.reply({ content: list, ephemeral: false, components: [{ type: 1, components: [menu] }] });
    const filter = (msg) => interaction.user.id === msg.user.id;
    const collector = msg.createMessageComponentCollector({ filter, errors: ['time'], time: 120000 });

    collector.on('collect', (interaction) => {
      const repo = repos.find(r => r.node_id === interaction.values[0]);
      if (repo) {
        const embed = {
          title: `Repository: ${repo.name}`,
          color: 0x6A0DAD,
          description: repo.description || 'No description.',
          thumbnail: {
            url: repo.owner.avatar_url
          },
          fields: [
            {
              name: 'Forks',
              value: repo.forks_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Open Issues',
              value: repo.open_issues_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Stars',
              value: repo.stargazers_count.toLocaleString(),
              inline: true
            },
            {
              name: 'Language',
              value: repo.language || 'Not specified',
              inline: true
            },
          ],
          url: repo.html_url
        };
        interaction.update({ content: '', embeds: [embed] });
      } else {
        interaction.update({ content: 'An error occurred. The repo was not found.' });
      }
    });
  }
};