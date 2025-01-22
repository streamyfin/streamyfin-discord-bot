const { SlashCommandBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('repo')
        .setDescription('Link to the GitHub repository.')
        .addStringOption(option =>
            option.setName("repo")
                .setDescription("A streamyfin's repo name")
                .setRequired(false)
        ),
    async run(interaction) {
        let repoName = interaction.options.getString("repo");

        if (repoName) {
            try {
                repoName = repoName.replace(/\s+/g, '-');
                const repo = await axios.get(`https://api.github.com/repos/${interaction.client.repoOrg}/${repoName}`).then(r => r.data)
                if (!repo) return interaction.reply("Repo does not exist under Streamyfin")
                const embed = {
                    title: `Repository: ${repo.name}`,
                    color: 0x6A0DAD,
                    description: repo.description || "No description.",
                    thumbnail: {
                        url: repo.owner.avatar_url
                    },
                    fields: [
                        {
                            name: "Forks",
                            value: repo.forks_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Open Issues",
                            value: repo.open_issues_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Stars",
                            value: repo.stargazers_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Language",
                            value: repo.language || "Not specified",
                            inline: true
                        },
                    ],
                    url: repo.html_url
                };
                await interaction.reply({ embeds: [embed] });
            } catch (error) {
                await interaction.reply("❌ Repo not found or an error occurred.");
            }
            return;
        }
        const repos = await axios.get(`https://api.github.com/orgs/${interaction.client.repoOrg}/repos`).then(r => r.data)
        let options = [];
        for (const [, value] of Object.entries(repos.slice(0, 20))) {
            options.push({ label: `${value.name}`, value: value.node_id, description: value?.description?.slice(0, 97) + '...' });
        }
        let menu = new StringSelectMenuBuilder()
            .setCustomId(`RepoList_${interaction.user.id}`)
            .setPlaceholder("Select a repo!")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options);

        let list = "**Repositories:**\n\n" + repos.map(r => `- [${r.name}](${r.html_url}): ${r.description || ""}`).join('\n');
        let msg = await interaction.reply({ content: list, ephemeral: false, components: [{ type: 1, components: [menu] }] });
        let filter = (msg) => interaction.user.id === msg.user.id;
        let collector = msg.createMessageComponentCollector({ filter, errors: ["time"], time: 120000 });

        collector.on("collect", (interaction) => {
            let repo = repos.find(r => r.node_id === interaction.values[0]);
            if (repo) {
                const embed = {
                    title: `Repository: ${repo.name}`,
                    color: 0x6A0DAD,
                    description: repo.description || "No description.",
                    thumbnail: {
                        url: repo.owner.avatar_url
                    },
                    fields: [
                        {
                            name: "Forks",
                            value: repo.forks_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Open Issues",
                            value: repo.open_issues_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Stars",
                            value: repo.stargazers_count.toLocaleString(),
                            inline: true
                        },
                        {
                            name: "Language",
                            value: repo.language || "Not specified",
                            inline: true
                        },
                    ],
                    url: repo.html_url
                };
                interaction.update({ content: '', embeds: [embed] });
            } else {
                interaction.update({ content: "An error occurred. The repo was not found." })
            }
        })
    }
};