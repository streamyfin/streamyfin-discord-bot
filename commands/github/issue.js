const { SlashCommandBuilder, StringSelectMenuBuilder } = require('discord.js');
const axios = require("axios");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('issue')
        .setDescription('Get details about a specific issue from GitHub.')
        .addIntegerOption(option =>
            option.setName('number')
                .setDescription('The issue number')
                .setRequired(false)
        ),
    async run(interaction) {
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const issueNumber = interaction.options.getInteger("number");

        if (issueNumber) {
            try {
                const response = await axios.get(
                    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
                    {
                        headers: {
                            Authorization: `token ${GITHUB_TOKEN}`,
                        },
                    }
                );

                const issue = response.data;
                await interaction.reply(
                    `🔗 **Issue #${issue.number}: ${issue.title}**\n${issue.html_url}`
                );
            } catch (error) {
                await interaction.reply("❌ Issue not found or an error occurred.");
            }
            return;
        }

        const response = await axios.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/issues`);
        if (!response.data) return interaction.reply("Please provide an issue number");

        let options = [];
        for (const [, value] of Object.entries(response.data.slice(0, 20))) {
            options.push({ label: `${value.title} - ${value.number}`, value: value.node_id, description: value.body.slice(0, 97) + '...' });
        }
        let menu = new StringSelectMenuBuilder()
            .setCustomId(`IssueList_${interaction.user.id}`)
            .setPlaceholder("Select a choice!")
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(options);
        let msg = await interaction.reply({ content: "Please select an issue!", ephemeral: false, components: [{ type: 1, components: [menu] }] });
        let filter = (msg) => interaction.user.id === msg.user.id;
        let collector = msg.createMessageComponentCollector({ filter, errors: ["time"], time: 120000 });

        collector.on("collect", (interaction) => {
            let issue = response.data.find(issue => issue.node_id === interaction.values[0]);
            if (issue) {
                interaction.update({ content: `🔗 **Issue #${issue.number}: ${issue.title}**\n${issue.html_url}` });
            } else {
                interaction.update({ content: "An error occurred. The issue was not found." })
            }
        })
    }
}