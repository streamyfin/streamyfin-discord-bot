const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonStyle, ButtonBuilder, ActionRowBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('featurerequest')
        .setDescription('Request a new feature.')
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the feature you want to request.')
                .setRequired(true)),
    async run(interaction) {
        const description = interaction.options.getString("description");
        const targetChannel = interaction.client.channels.cache.get('1273278866105831424');
        const memberRoles = interaction.member.roles.cache.map((role) => role.name);
        const allowedRoles = ["Developer", "Administrator"];

        const modal = new ModalBuilder().setCustomId('githubModal').setTitle('Github Username');
        const usernameInput = new TextInputBuilder().setCustomId('username').setLabel('Please enter your Github username').setPlaceholder('Github Username').setStyle(TextInputStyle.Short);
        const button = new ButtonBuilder().setCustomId('submit').setLabel('Submit to Github').setStyle(ButtonStyle.Success);
        const row = new ActionRowBuilder().addComponents(button);

        modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));

        if (!targetChannel) {
            await interaction.reply({ content: '❌ Target channel not found.', ephemeral: true });
            return;
        }

        const thread = await targetChannel.threads.create({
            name: `Feature: ${description} requested by ${interaction.user.username}`,
            reason: 'User requested a feature',
        });

        await thread.send({ content: `🎉 Thank you for your feature request! Feel free to discuss this feature here!`, components: [row] });
        await interaction.reply({ content: `✅ Your feature request has been submitted and a discussion thread has been created: [${thread.name}](https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${thread.id})`, ephemeral: true });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = thread.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'submit') {
                if (!memberRoles.some((role) => allowedRoles.includes(role))) {
                    await i.reply({ content: `❌ <#${interaction.user.id}>, You do not have permission to submit this to github.`, ephemeral: true });
                } else {
                    await i.showModal(modal);
                }
            }
        });

        interaction.client.on('interactionCreate', async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit()) return;
            if (modalInteraction.customId === 'githubModal') {
                const githubUsername = modalInteraction.fields.getTextInputValue('username');
                const r = await axios.get(`https://api.github.com/users/${githubUsername}`);
                if (!(r.data.login === githubUsername)) await modalInteraction.reply({ content: `❌ Github username ${githubUsername} is not valid.`, ephemeral: true });

                try {
                    const response = await axios.post(
                        `https://api.github.com/repos/streamyfin/streamyfin/issues`,
                        {
                            title: `Feature request from Discord user ${interaction.user.username}`,
                            body: description,
                            labels: ["✨ enhancement"],
                            assignees: [githubUsername],
                        },
                        {
                            headers: {
                                Authorization: `token ${interaction.client.githubToken}`,
                            },
                        }
                    );

                    await interaction.reply(`✅ Feature request created successfully: ${response.data.html_url}`);
                    await interaction.channel.send("🔒 This channel has been locked as details have been collected and sent to GitHub.");
                } catch (error) {
                    console.error("Error submitting feature request:", error);
                    await interaction.channel.send("❌ Failed to submit the feature request. Please try again.");
                }

            }
        });
    },
};