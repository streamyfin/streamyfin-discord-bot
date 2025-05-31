import dotenv from 'dotenv';
dotenv.config();

import Streamyfin from './client.js';
import { GatewayIntentBits, REST, Routes } from 'discord.js';
import { eldr } from 'eldr';
import fs from 'fs';

const tempCommands = []
function importNonEnglishTrolls() {
  try {
    return JSON.parse(process.env.PEOPLE_TO_TROLL).map(String);
  } catch (error) {
    console.log("no trolling")
  }
}
const nonEnglishTrolls = importNonEnglishTrolls()
function importChannelsToSkip() {
  try {
    return JSON.parse(process.env.CHANNELS_TO_SKIP).map(String);
  } catch (error) {
    console.log("no channels will be skipped")
  }

}
const channelsToSkip = importChannelsToSkip();
// Initialize Discord client
const client = new Streamyfin({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

fs.readdirSync("./commands").forEach(async dir => {
  const fullPath = path.join(__dirname, "commands", dir);
  if (!fs.statSync(fullPath).isDirectory()) return; // 👈 Skip if not a folder

  const files = fs.readdirSync(fullPath).filter(file => file.endsWith(".js"));
  for (let file of files) {
    const filePath = path.join(fullPath, file);
    const props = await import(filePath);
    client.commands.set(props.default.data.name, props.default);
    tempCommands.push(props.default.data);
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
  const lowerText = message.trim().toLowerCase();
  const piracyKeywords = [
    "1fichier", "123movies", "1337x",
    "all-debrid", "alldebrid", "anonfiles", "aria2",
    "bd-rip", "bdrip", "bittorrent", "bluray rip",
    "camrip", "camrips", "crack", "crackme", "cracked", "cracks", "crackle", "cyberlocker",
    "cyberlockers", "debrid", "deluge", "direct download", "ddl", "ddls",
    "downloading", "dvdrip", "DHT", "fake release", "fake releases", "fmovies",
    "free movies online", "gofile", "gogoanime", "gomovies", "HD cam",
    "indexer", "indexers", "irc release", "jdownloader",
    "keygen", "keygens", "kimcartoon",
    "leech", "leeching", "leak", "leaks", "leaked", "mediafire",
    "mega link", "no ads streaming", "no sign up streaming",
    "nzb", "nzb indexer", "opensubtitles",
    "p2p", "pirate", "pirates", "pirating", "popcorn time", "pre release",
    "putlocker", "qbittorrent",
    "rarbg", "real debrid", "real-debrid", "repack",
    "scene group", "scene release", "seed", "seeder", "seedbox", "seeds", "soulseek", "soap2day", "solarmovie",
    "stremio", "stremio add-on", "stremio addon", "streaming site", "streaming sites", "streamtape",
    "subscene", "telecine", "telesync", "torrent", "torrent site", "torrent sites",
    "torrents", "tpb", "the pirate bay", "transmission", "utorrent",
    "videobin", "watch free", "warez", "yesmovies", "yify"
  ];
  return piracyKeywords.some((keyword) => lowerText.includes(keyword));
}

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  //console.log(LangDetected.getScores(), isEnglish, cjkRegex.test(message.content), message.content.length);
  let unitConversion = client.convertUnits(message.content);
  if (unitConversion !== null) message.reply(unitConversion)
    
  if (!(channelsToSkip && channelsToSkip.includes(message.channelId))) {

    const LangDetected = eldr.detect(message.content);
    const isEnglish = (LangDetected.isReliable() && LangDetected.iso639_1 === "en") || (!LangDetected.isReliable() && LangDetected.iso639_1 == "")
    const cjkRegex = /[\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7af]/;

    if (!isEnglish && ((cjkRegex.test(message.content) || message.content.length >= 27) && nonEnglishTrolls.includes(message.author.id))) {
      const translatedJSON = await client.ollamaTranslate(message.content)
      if (translatedJSON && translatedJSON.translated) {
        message.reply(`${translatedJSON.text}`);
      }
    }
    else if (!isEnglish && nonEnglishTrolls.includes(message.author.id)) {
      message.reply('https://tenor.com/view/speak-english-pulp-fiction-do-you-speak-it-gif-16440534')
    }
  }

  const hasPiracy = hasPiracyKeywords(message.content);
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
