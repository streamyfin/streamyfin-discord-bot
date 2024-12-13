require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes, ChannelType, MessageCollector } = require("discord.js");
const axios = require("axios");

// GitHub API base URL and repo data
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "fredrikburmester";
const REPO_NAME = "streamyfin";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Register slash commands
const registerCommands = async () => {
  const releaseChoices = await fetchReleases();

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

  if (commandName === "roadmap") {
    await interaction.reply(
      "📌 Here is our Roadmap: https://github.com/fredrikburmester/streamyfin/projects/5"
    );
  }

  if (commandName === "help") {
    const commandList = commands
      .map((cmd) => `**/${cmd.name}**: ${cmd.description}`)
      .join("\n");

    await interaction.reply({
      content: `Available commands:\n${commandList}`,
      ephemeral: true,
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

  if (commandName === "createissue") {
    // Start by creating a private thread
    const thread = await interaction.channel.threads.create({
      name: `Issue Report by ${interaction.user.username}`,
      autoArchiveDuration: 60, // Auto-archive after 1 hour
      type: ChannelType.PrivateThread,
      reason: "Collecting issue details",
    });

    await thread.members.add(interaction.user.id); // Add the user to the thread
    await interaction.reply({ content: `✅ Private thread created: ${thread.name}`, ephemeral: true });

    // Define the questions to ask the user
    const questions = [
      { key: "title", question: "What is the title of the issue?" },
      { key: "description", question: "What happened? What did you expect to happen?" },
      { key: "steps", question: "How can this issue be reproduced? (step-by-step)" },
      { key: "device", question: "What device and operating system are you using?" },
      { key: "version", question: "What is the affected Streamyfin version?" },
      { key: "screenshots", question: "Provide links to screenshots (if any), or type 'none'." },
    ];

    const collectedData = {}; // Store user responses here

    // Helper function to ask questions
    const askQuestion = async (questionIndex = 0) => {
      if (questionIndex >= questions.length) {
        // All questions answered, proceed to create the issue
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
${collectedData.screenshots || "No screenshots provided"}
`;

        try {
          const issueResponse = await axios.post(
            `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
            {
              title: `[Bug][${interaction.user.username}]: ${collectedData.title}`,
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

      collector.on("collect", (msg) => {
        collectedData[question.key] = msg.content;
        askQuestion(questionIndex + 1); // Ask the next question
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
});

// Register commands and start the bot
registerCommands();
client.login(process.env.DISCORD_TOKEN);
