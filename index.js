require("dotenv").config();
const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
const axios = require("axios");

// GitHub API base URL and repo data
const GITHUB_API_BASE = "https://api.github.com";
const REPO_OWNER = "fredrikburmester";
const REPO_NAME = "streamyfin";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

let commands = []; // Globale Variable für die Commands

// Funktion zum Abrufen von Releases von GitHub
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
      .slice(0, 2) // Hol die letzten 2 Releases
      .map((release) => ({ name: release.name, value: release.name }));

    releases.push({ name: "Older", value: "Older" }); // Füge "Older" als Option hinzu

    return releases;
  } catch (error) {
    console.error("Fehler beim Abrufen von Releases:", error);
    return [
      { name: "0.22.0", value: "0.22.0" }, // Fallback-Daten
      { name: "0.21.0", value: "0.21.0" },
      { name: "Older", value: "Older" },
    ];
  }
};

// Discord-Client initialisieren
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

// Slash-Commands registrieren
const registerCommands = async () => {
  const releaseChoices = await fetchReleases();

  commands = [ // Globale Variable hier befüllen
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
      options: [
        {
          name: "title",
          type: 3, // String
          description: "Short title describing the issue",
          required: true,
        },
        {
          name: "description",
          type: 3, // String
          description: "What happened? What did you expect to happen?",
          required: true,
        },
        {
          name: "steps",
          type: 3, // String
          description: "How can this issue be reproduced? (Step-by-step)",
          required: true,
        },
        {
          name: "device",
          type: 3, // String
          description: "Device and operating system (e.g., iPhone 15, iOS 18.1.1)",
          required: true,
        },
        {
          name: "version",
          type: 3, // String
          description: "Streamyfin version",
          required: true,
          choices: releaseChoices,
        },
        {
          name: "screenshots",
          type: 3, // String
          description: "Links to screenshots (if applicable)",
          required: false,
        },
      ],
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
    console.log("Slash commands registered erfolgreich!");
  } catch (error) {
    console.error("Fehler beim Registrieren der Slash-Commands:", error);
  }
};

// Event, wenn der Bot bereit ist
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Slash-Command-Interaktionen verarbeiten
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
    const title = options.getString("title");
    const description = options.getString("description");
    const steps = options.getString("steps");
    const device = options.getString("device");
    const version = options.getString("version");
    const screenshots = options.getString("screenshots") || "No screenshots provided";

    const username = interaction.user.username;

    const body = `
### What happened?
${description}

### Reproduction steps
${steps}

### Device and operating system
${device}

### Version
${version}

### Screenshots
${screenshots}
`;

    try {
      const issueResponse = await axios.post(
        `${GITHUB_API_BASE}/repos/${REPO_OWNER}/${REPO_NAME}/issues`,
        {
          title: `[Bug][${username}]: ${title}`,
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

      await interaction.reply(
        `✅ Issue created successfully: ${issueResponse.data.html_url}`
      );
    } catch (error) {
      console.error("Error creating issue:", error);
      await interaction.reply("❌ Failed to create the issue. Please try again.");
    }
  }
});

// Commands registrieren und Bot starten
registerCommands();
client.login(process.env.DISCORD_TOKEN);
