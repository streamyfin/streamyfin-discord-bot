import { SlashCommandBuilder, StringSelectMenuBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import axios from 'axios';

export default {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Show Streamyfin repository statistics and contributor leaderboard'),
    
    async run(interaction) {
        try {
            await interaction.deferReply();

            const [leaderboard, repoData] = await Promise.all([
                interaction.client.fetchStats(),
                fetchRepoInfo()
            ]);

            if (!leaderboard?.length) {
                return interaction.editReply({
                    content: "❌ Unable to fetch contributor data",
                    flags: MessageFlags.Ephemeral
                });
            }

            if (!repoData) {
                return interaction.editReply({
                    content: "❌ Unable to fetch repository information",
                    flags: MessageFlags.Ephemeral
                });
            }

            const embed = createRepoEmbed(repoData);
            const selectMenu = createSelectMenu(interaction.user.id);

            const message = await interaction.editReply({
                embeds: [embed],
                components: [{ type: 1, components: [selectMenu] }]
            });

            // Setup collector for menu interaction
            const filter = (menuInteraction) => 
                menuInteraction.user.id === interaction.user.id && 
                menuInteraction.customId === `Menu_${interaction.user.id}`;

            const collector = message.createMessageComponentCollector({
                filter,
                max: 1,
                time: 120000
            });

            collector.on('collect', async (menuInteraction) => {
                const contributorEmbed = createContributorEmbed(leaderboard, repoData);
                await menuInteraction.update({ embeds: [contributorEmbed], components: [] });
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    // Remove components on timeout
                    interaction.editReply({ components: [] }).catch(() => {});
                }
            });

        } catch (error) {
            console.error('[STATS] Error executing stats command:', error.message);
            
            const errorResponse = {
                content: "❌ An error occurred while fetching statistics",
                flags: MessageFlags.Ephemeral
            };

            if (interaction.deferred) {
                await interaction.editReply(errorResponse);
            } else {
                await interaction.reply(errorResponse);
            }
        }
    },
};

/**
 * Fetch repository information from GitHub API
 * @returns {Promise<Object|null>} Repository data or null on error
 */
async function fetchRepoInfo() {
    try {
        const response = await axios.get("https://api.github.com/repos/streamyfin/streamyfin", {
            timeout: 30000,
            headers: {
                'User-Agent': 'StreamyfinBot/1.0 (+https://github.com/streamyfin/streamyfin-discord-bot)',
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('[STATS] Error fetching repo info:', error.message);
        return null;
    }
}

/**
 * Create repository information embed
 * @param {Object} repoData - Repository data from GitHub API
 * @returns {EmbedBuilder} Formatted embed
 */
function createRepoEmbed(repoData) {
    return new EmbedBuilder()
        .setTitle("Streamyfin Repository Info")
        .setColor(0x6A0DAD)
        .setDescription(repoData.description || "No description available")
        .setThumbnail(repoData.organization?.avatar_url || repoData.owner?.avatar_url)
        .addFields([
            {
                name: "Forks",
                value: repoData.forks_count?.toLocaleString() || "0",
                inline: true
            },
            {
                name: "Watchers",
                value: repoData.watchers?.toLocaleString() || "0",
                inline: true
            },
            {
                name: "Stars",
                value: repoData.stargazers_count?.toLocaleString() || "0",
                inline: true
            },
            {
                name: "Language",
                value: repoData.language || "Unknown",
                inline: true
            },
            {
                name: "License",
                value: repoData.license?.name || "No license",
                inline: true
            },
            {
                name: "Last Updated",
                value: repoData.updated_at ? new Date(repoData.updated_at).toLocaleDateString() : "Unknown",
                inline: true
            }
        ])
        .setTimestamp();
}

/**
 * Create contributor leaderboard embed
 * @param {Array} leaderboard - Array of contributor objects
 * @param {Object} repoData - Repository data
 * @returns {EmbedBuilder} Formatted embed
 */
function createContributorEmbed(leaderboard, repoData) {
    const contributorList = leaderboard
        .slice(0, 15) // Show top 15 contributors
        .map((contributor, index) => 
            `${index + 1}. ${contributor.username} - ${contributor.contributions} contributions`
        )
        .join("\n");

    return new EmbedBuilder()
        .setTitle("📈 Contribution Leaderboard")
        .setColor(0x6A0DAD)
        .setDescription(contributorList || "No contributors found")
        .setThumbnail(repoData.organization?.avatar_url || repoData.owner?.avatar_url)
        .addFields([
            {
                name: "⭐ Star Count",
                value: `The repository has **${repoData.stargazers_count?.toLocaleString() || 0}** stars`,
                inline: false
            },
            {
                name: "👥 Total Contributors",
                value: leaderboard.length.toString(),
                inline: true
            },
            {
                name: "🔀 Total Forks",
                value: repoData.forks_count?.toLocaleString() || "0",
                inline: true
            }
        ])
        .setTimestamp()
        .setFooter({ text: `Star Count: ${repoData.stargazers_count?.toLocaleString() || 0}` });
}

/**
 * Create selection menu for stats options
 * @param {string} userId - User ID for the menu
 * @returns {StringSelectMenuBuilder} Configured select menu
 */
function createSelectMenu(userId) {
    return new StringSelectMenuBuilder()
        .setCustomId(`Menu_${userId}`)
        .setPlaceholder("Select an option to view more details!")
        .setMinValues(1)
        .setMaxValues(1)
        .addOptions([
            {
                label: "📈 Contribution Overview",
                value: "Contribution",
                description: "View the contributor leaderboard and detailed statistics"
            }
        ]);
}
