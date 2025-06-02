import { SlashCommandBuilder, StringSelectMenuBuilder, MessageFlags } from 'discord.js';
import axios from 'axios';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Contributor leaderboar'),
    async run(interaction) {

        const leaderboard = await interaction.client.fetchStats();
        if (!leaderboard || leaderboard.length === 0) {
            await interaction.reply({ content: "❌ No data available", flags: MessageFlags.Ephemeral });
            return;
        }
        const mapped = leaderboard.map((x, index) => `${index + 1}. ${x.username} - ${x.contributions}`).join("\n");

        const repoResponse = await axios.get("https://api.github.com/repos/streamyfin/streamyfin");
        const starCount = repoResponse.data.stargazers_count;
        let embed =  {
            title: "Streamyfin's info",
            color: 0x6A0DAD,
            description: repoResponse.data.description,
            thumbnail: {
                url: repoResponse.data.organization.avatar_url
            },
            fields: [
                {
                    name: "Forks",
                    value: repoResponse.data.forks_count.toLocaleString(),
                    inline: true
                },
                {
                    name: "Watchers",
                    value: repoResponse.data.watchers.toLocaleString(),
                    inline: true,
                },
                {
                    name: "Stars",
                    value: starCount,
                    inline: true,
                },
                {
                    name: "Language",
                    value: repoResponse.data.language,
                    inline: true,
                },
                {
                    name: "License",
                    value: repoResponse.data.license.name,
                    inline: true,
                }
            ]
        }
        let options = [
            {
                label: "📈 Contribution Overview",
                value: "Contribution",
                description: "Get information about the repo!"
            }
        ]
        let menu = new StringSelectMenuBuilder()
            .setCustomId(`Menu_${interaction.user.id}`)
            .setPlaceholder("Select a choice!")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options);
        let msg = await interaction.reply({ embeds: [embed], ephemeral: false, components: [{ type: 1, components: [menu] }] });
        let filter = (msg) => interaction.user.id === msg.user.id;
        let collector = msg.createMessageComponentCollector({ filter, max: 1, errors: ["time"], time: 120000 });
        collector.on("collect", (interaction) => {
            embed = {
                color: 0x6A0DAD,
                title: "📈 Contribution Overview",
                description: mapped,
                thumbnail: {
                    url: repoResponse.data.organization.avatar_url
                },
                fields: [
                    {
                        name: "⭐ Star Count",
                        value: `The repository has **${starCount}** stars.`,
                        inline: true,
                    }
                ],
                timestamp: new Date(),
                footer: {
                    text: `Star Count: ${starCount}`,
                },
            };
            interaction.update({ embeds: [embed] });
        })
    },
};
