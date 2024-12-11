require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const axios = require("axios");

// GitHub API base URL and repository data
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "fredrikburmester";
const REPO_NAME = "streamyfin";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Initialize the Discord Client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Register slash commands
const commands = [
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
];

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

// Upload slash commands to Discord
(async () => {
  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
})();

// Event: Bot is ready
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Slash Command: /roadmap
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === "roadmap") {
    await interaction.reply(
      "📌 Here is our Roadmap: https://github.com/fredrikburmester/streamyfin/projects/5"
    );
  }

  // Slash Command: /issue
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

  // Slash Command: /createissue
  if (commandName === "createissue") {
    const targetUser = interaction.user;

    const questions = [
      "What happened? Also tell us, what did you expect to happen?",
      "How do you trigger this bug? Please provide the reproduction steps step by step.",
      "Which device and operating system are you using? (e.g., iPhone 15, iOS 18.1.1)",
      "What version of Streamyfin are you running? (Options: 0.22.0, 0.21.0, older)",
      "If applicable, please add screenshots to help explain your problem (paste links or describe).",
    ];

    const answers = [];

    try {
      // Create a private thread for issue creation
      const thread = await interaction.channel.threads.create({
        name: `Issue Creation: ${targetUser.username}`,
        type: 11, // Private thread
        autoArchiveDuration: 60, // Archive duration in minutes
        reason: "GitHub issue creation",
      });

      await thread.members.add(targetUser);
      await thread.send(
        `${targetUser}, let's create a GitHub issue! I'll ask you a few questions.`
      );

      // Ask the user questions one by one
      for (const question of questions) {
        await thread.send(question);

        const collected = await thread.awaitMessages({
          filter: (response) => response.author.id === targetUser.id,
          max: 1,
          time: 60000,
        });

        if (collected.size === 0) throw new Error("You didn't respond in time.");
        answers.push(collected.first().content);
      }

      const [whatHappened, reproSteps, device, version, screenshots] = answers;

      const body = `
### What happened?
${whatHappened}

### Reproduction steps
${reproSteps}

### Device and operating system
${device}

### Version
${version}

### Screenshots
${screenshots}
`;

      // Send the collected data to GitHub to create a new issue
      const issueResponse = await axios.post(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        {
          title: `[Bug]: ${whatHappened.slice(0, 50)}`,
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
      await thread.send("This thread will automatically close shortly.");

      // Automatically archive the thread after 1 minute
      setTimeout(async () => {
        await thread.setArchived(true);
      }, 60000);
    } catch (error) {
      console.error(error);
      await interaction.reply(
        `${interaction.user}, I couldn't complete the issue creation process. Please try again.`
      );
    }
  }
});

// Start the bot
client.login(process.env.DISCORD_TOKEN);
