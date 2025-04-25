require("dotenv").config();
const Streamyfin = require('./client');
const { GatewayIntentBits, REST, Routes } = require("discord.js");
const fs = require("fs");


const tempCommands = []

// Initialize Discord client
const client = new Streamyfin({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const path = require("path");
fs.readdirSync("./commands").forEach(dir => {
  const fullPath = path.join(__dirname, "commands", dir);
  if (!fs.statSync(fullPath).isDirectory()) return; // 👈 Skip if not a folder

  const files = fs.readdirSync(fullPath).filter(file => file.endsWith(".js"));
  for (let file of files) {
    const filePath = path.join(fullPath, file);
    const props = require(filePath);
    client.commands.set(props.data.name, props);
    tempCommands.push(props.data);
    console.log(`[COMMAND] => Loaded ${file}`);
  }
});

client.on("ready", () => {
  client.user.setActivity("over Streamyfin's issues 👀", { type: 3 });
})
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.run(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
})


function hasPiracyKeywords(message) {
  const lowerText = message.toLowerCase();
  const piracyKeywords = [
    "pirate", "torrent", "crack", "crackme", "leak", "p2p", "illegal content",
    "illegal download", "downloading", "warez", "camrip", "keygen",
    "cracked", "leeching", "magnet link", "ddl", "seed", "tracker", "cyberlocker",
    "ripping", "streaming site", "torrent site", "DHT", "soulseek", "fake release",
    "subscene", "DMCA takedown"
  ];  
  return piracyKeywords.some((keyword) => lowerText.includes(keyword));
}

client.on('messageCreate', async (message) => {
  const hasPiracy = hasPiracyKeywords(message.content);
  console.log(hasPiracy, isToxic)
  if (hasPiracy) {
    const isToxic = await client.checkMessage(message.content);
    if (isToxic) {
      const command = client.commands.get("piracy");
      if (command) {
        command.run(message);
      }
    }
  }
  if (message.mentions.has(client.user) && !message.author.bot) {
    message.reply("Hi there, I'm Finn! I'm a bot written for streamyfin! To find out what I can do, use `/help`!");
  }
});
const registerCommands = async () => {
  if (client.githubToken) await client.fetchReleases();

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: tempCommands,
    });
    console.log("Slash commands registered successfully!");
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
};

registerCommands();
client.login(process.env.DISCORD_TOKEN);
