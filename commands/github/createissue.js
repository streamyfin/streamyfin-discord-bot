import { SlashCommandBuilder, ChannelType, MessageCollector, MessageFlags } from 'discord.js';
import axios from 'axios';

export default {
	data: new SlashCommandBuilder()
		.setName('createissue')
		.setDescription('Create a new GitHub issue.'),
	async run(interaction) {
		const GITHUB_API_BASE = "https://api.github.com";
	
		// Start by creating a private thread in forum
		const forumChannelId = process.env.FORUM_CHANNEL_ID;
		const forumChannel = interaction.guild.channels.cache.get(forumChannelId);

		if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
			await interaction.reply({
				content: "❌ Forum channel not found or is not a forum channel.",
				flags: MessageFlags.Ephemeral
			});
			return;
		}

		const thread = await forumChannel.threads.create({
			name: `Issue Report by ${interaction.user.username}`,
			message: {
				content: `Hello ${interaction.user.username}, let's collect the details for your issue report!`,
			},
			autoArchiveDuration: 60, // Auto-archive after 1 hour
			type: ChannelType.PrivateThread,
			reason: "Collecting issue details",
		});

		await interaction.reply({
			content: `✅ Forum thread created, please fill out the issue report: [${thread.name}](https://discord.com/channels/${interaction.guild.id}/${forumChannelId}/${thread.id})`,
			flags: MessageFlags.Ephemeral
		});

		// Define the questions to ask the user
		const questions = [
			{ key: "title", question: "Describe your issue in a few words." },
			{ key: "description", question: "What happened? What did you expect to happen?" },
			{ key: "steps", question: "How can this issue be reproduced? (step-by-step)" },
			{ key: "device", question: "What device and operating system are you using?" },
			{ key: "version", question: "What is the affected Streamyfin version?" },
			{ key: "screenshots", question: "Please provide any screenshots that might help us reproduce the issue (optional), or type 'none'.", allowUploads: true },
		];

		const collectedData = {}; // Store user responses here
		const uploadedFiles = []; // Store uploaded files here
		// Helper function to ask questions
		const askQuestion = async (questionIndex = 0) => {
			if (questionIndex >= questions.length) {
				// All questions have been asked
				const screenshotsText = uploadedFiles.length
					? uploadedFiles.map((file) => file.url).join("\n")
					: "No screenshots provided";

				const body = `
### What happened?
${collectedData.description}

### Reproduction steps
${collectedData.steps}

### Device and operating system
${collectedData.device}

### Version
${collectedData.version}

### Screenshots
${screenshotsText}
`;

				try {
					const issueResponse = await axios.post(
						`${GITHUB_API_BASE}/repos/${interaction.client.repoOrg}/${interaction.client.repoName}/issues`,
						{
							title: `[Bug]: ${collectedData.title} reported via Discord by [${interaction.user.username}]`,
							body: body,
							labels: ["❌ bug"],
						},
						{
							headers: {
								Authorization: `token ${interaction.client.githubToken}`,
							},
						}
					);

					await thread.send(`✅ Issue created successfully: ${issueResponse.data.html_url}`);
					await thread.setLocked(true, "Issue details collected and sent to GitHub.");
				} catch (error) {
					console.error("Error creating issue:", error);
					await thread.send("❌ Failed to create the issue. Please try again.");
				}
				return;
			}

			// Ask the next question
			const question = questions[questionIndex];
			await thread.send(question.question);

			// Set up a message collector to get the user's response
			const collector = new MessageCollector(thread, {
				filter: (msg) => msg.author.id === interaction.user.id,
				max: 1, // Collect only one message
				time: 300000, // Timeout after 5 minutes
			});

			collector.on("collect", async (msg) => {
				if (question.allowUploads && msg.attachments.size > 0) {
					msg.attachments.forEach((attachment) => {
						uploadedFiles.push({
							name: attachment.filename,
							url: attachment.url,
						});
					});
					collectedData[question.key] = "Screenshots uploaded";
				} else {
					collectedData[question.key] = msg.content;

					if (question.key === "title") {
						try {
							await thread.setName(`Issue ${collectedData.title} reported by ${interaction.user.username}`);
						} catch (error) {
							console.error("Error setting thread name:", error);
							await thread.send("❌ Failed to set the thread name. Please try again.");
						}
					}
				}
				askQuestion(questionIndex + 1);
			});

			collector.on("end", (collected, reason) => {
				if (reason === "time") {
					thread.send("❌ You did not respond in time. Please run the command again if you'd like to create an issue.");
				}
			});
		};

		// Start asking questions
		askQuestion();
	},
};