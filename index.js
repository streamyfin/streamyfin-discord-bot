require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, ChannelType, MessageCollector } = require ("discord.js");
const axios = require ("axios");

// GitHub API base URL and repo data
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const userId = '398161771476549654';

let commands = []; // Global commands array

// Function to fetch releases from GitHub
const fetchReleases = async () => {
  try {
    const response = await axios.get(
      `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
        },
      }
    );

    const releases = response.data
      .slice(0, 2) // Fetch the latest 2 releases
      .map((release) => ({ name: release.name, value: release.name }));

    releases.push({ name: "Older", value: "Older" }); // Add "Older" as an option

    return releases;
  } catch (error) {
    console.error("Error fetching releases:", error);
    return [
      { name: "0.22.0", value: "0.22.0" }, // Fallback data
      { name: "0.21.0", value: "0.21.0" },
      { name: "Older", value: "Older" },
    ];
  }
};

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// Register slash commands
const registerCommands = async () => {
  await fetchReleases();

  commands = [
    {
      name: "roadmap",
      description: "Get the link to the GitHub roadmap.",
    },
    {
      name: "issue",
      description: "Get details about a specific issue from GitHub.",
      options: [
        {
          name: "number",
          type: 4, // Integer
          description: "The issue number",
          required: true,
        },
      ],
    },
    {
      name: "createissue",
      description: "Create a new issue on GitHub.",
    },
    {
      name: "help",
      description: "Get a list of available commands.",
    },
    {
      name: "testflight",
      description: "Explains how to join the Streamyfin Testflight.",
    },
    {
      name: "repo",
      description: "Get the link to the GitHub repository."
    },
    {
      name: "closeissue",
      description: "Close an issue on GitHub and lock the thread.",
      options: [
        {
          name: "state",
          type: 3, // String
          description: "The state to set for the GitHub issue (e.g., open, closed).",
          required: true,
          choices: [
            { name: "Open", value: "open" },
            { name: "Closed", value: "closed" },
          ],
        },
        {
          name: "state_reason",
          type: 3, // String
          description: "The reason for closing the GitHub issue.",
          required: true,
          choices: [
            { name: "Completed", value: "completed" },
            { name: "Not Planned", value: "not_planned" },
          ],
        },
      ],
    },
    {
      name: "featurerequest",
      description: "Request a new feature for Streamyfin.",
      options: [
        {
          name: "description",
          type: 3, // String
          description: "A short description of the feature request.",
          required: true,
        },
      ],
    },
    {
      name:"donate", 
      description: "Shows how to support the Streamyfin project."
    }
  ];

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
};

// Event when the bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Handle slash command interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "repo") {
    await interaction.reply(
      "📡 Here is our GitHub repository: https://github.com/fredrikburmester/streamyfin"
    );
  }

  if (commandName === "roadmap") {
    await interaction.reply(
      "📌 Here is our Roadmap: https://github.com/users/fredrikburmester/projects/5/views/8"
    );
  }

  if (commandName === "help") {
    const commandList = commands
      .map((cmd) => `**/${cmd.name}**: ${cmd.description}`)
      .join("\n");

    await interaction.reply({
      content: `Available commands:\n${commandList}`,
      ephemeral: false,
    });
  }

  if (commandName === "issue") {
    const issueNumber = options.getInteger("number");

    try {
      const response = await axios.get(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
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
  }

  if (commandName === "testflight") {
    await interaction.reply(
      `Currently, Streamyfin Testflight is full. However, you can send a private message to <@${userId}> with your email address and he will add you to the Testflight beta group manually.`
    );
  }

  if (commandName === "createissue") {
    // Start by creating a private thread in forum
    const forumChannelId= process.env.FORUM_CHANNEL_ID;
    const forumChannel = interaction.guild.channels.cache.get(forumChannelId);

    if (!forumChannel || forumChannel.type !== ChannelType.GuildForum) {
      await interaction.reply({
        content: "❌ Forum channel not found or is not a forum channel.",
        ephemeral: true,
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
    ephemeral: false,
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
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
            {
              title: `[Bug]: ${collectedData.title} reported via Discord by [${interaction.user.username}]`,
              body: body,
              labels: ["❌ bug"],
              assignees: ["fredrikburmester"],
            },
            {
              headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
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

          if (question.key ==="title") {
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
  }

  if (commandName === "closeissue") {
    const allowedRoles = ["Developer", "Administrator"];
    const state = options.getString("state");
    const stateReason = options.getString("state_reason");
    const thread = interaction.channel;

    // Check if the user has the required role
    const memberRoles = interaction.member.roles.cache.map((role) => role.name);
    if (!memberRoles.some((role) => allowedRoles.includes(role))) {
      await interaction.reply({ content: "❌ You do not have permission to use this command.", ephemeral: true });
      return;
    }

    // Check if the command is executed in a forum thread
    if (thread.type !== ChannelType.PublicThread && thread.type !== ChannelType.PrivateThread) {
      await interaction.reply({ content: "❌ This command can only be used in a forum thread.", ephemeral: true });
      return;
    }
  
    try {
      const messages = await thread.messages.fetch({ limit: 100 });
      const githubLinkMessage = messages.find(
        (msg) => msg.content.includes("https://github.com") && msg.content.includes("/issues/")
      );
  
      if (!githubLinkMessage) {
        await interaction.reply({ content: "❌ No GitHub link found in the thread.", ephemeral: true });
        return;
      }
  
      const issueUrlMatch = githubLinkMessage.content.match(/\/issues\/(\d+)/);
      if (!issueUrlMatch) {
        await interaction.reply({ content: "❌ Invalid GitHub link in the thread.", ephemeral: true });
        return;
      }
  
      const issueNumber = issueUrlMatch[1];
  
      await axios.patch(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues/${issueNumber}`,
        { state, state_reason: stateReason },
        { headers: { Authorization: `token ${GITHUB_TOKEN}` } }
      );
  
      await thread.setLocked(true, "Thread closed by developer.");
      await thread.send(`✅ This issue has been resolved and the GitHub issue is now "${state}" with reason "${stateReason}".`);
      await interaction.reply({ content: "✅ Issue closed successfully.", ephemeral: true });
    } catch (error) {
      console.error("Error closing issue:", error);
      await interaction.reply({ content: "❌ Failed to close the issue. Please try again.", ephemeral: true });
    }
  }
  


  if (commandName === "donate") {
    await interaction.reply({
      content: `🎁 Thank you for supporting our work and sharing your experiences! While many contributors are involved, the majority of the work is done by <@${userId}>. The best way to show your support is by buying him a coffee: https://buymeacoffee.com/fredrikbur3`,
    });
  }
  
  if (commandName ==="featurerequest") {
    const description = options.getString("description");
    const targetChannel = client.channels.cache.get('1273278866105831424');
    if (!targetChannel) {
      await interaction.reply({ content:'❌ Target channel not found.', ephemeral: true});
      return;
    }

    const thread = await targetChannel.threads.create({
      name: `Feature: ${description} requested by ${interaction.user.username},`,
      reason: 'User requested a feature',
    });

    await thread.send({content: `🎉 Thank you for your feature request! Feel free to discuss this feature here!`});
    await interaction.reply({content: `✅ Your feature request has been submitted and a discussion thread has been created: [${thread.name}](https://discord.com/channels/${interaction.guild.id}/${targetChannel.id}/${thread.id})`, ephemeral: true});
  }
});

// Register commands and start the bot
registerCommands();
client.login(process.env.DISCORD_TOKEN);