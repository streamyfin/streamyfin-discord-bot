import dotenv from 'dotenv';
dotenv.config();

import Streamyfin from './client.js';
import { GatewayIntentBits, REST, Routes, MessageFlags, EmbedBuilder } from 'discord.js';
import { eldr } from 'eldr';
import fs from 'fs';
import redisClient from './redisClient.js';

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
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.run(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      });
    }
  } else if (interaction.isButton()) {
    const { customId, user, guild } = interaction;

    if (customId.startsWith('resolve_report_')) {
      const messageId = customId.replace('resolve_report_', '');

      try {
        const member = await guild.members.fetch(user.id);
        if (!member.permissions.has('ManageMessages')) {
          return interaction.reply({
            content: 'You do not have permission to resolve this report.',
            flags: MessageFlags.Ephemeral,
          });
        }

        await redisClient.del(`reported_message_${messageId}`);

        const originalEmbed = interaction.message.embeds[0];
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
          .setFooter({ text: `Report resolved by ${user.tag}` })
          .setColor(0x00ff00);

        await interaction.update({
          embeds: [updatedEmbed],
          components: [],
        });
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'There was an error while resolving this report!',
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  }
  else if (interaction.isModalSubmit && interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('report_modal_')) {
      const command = client.commands.get('Report Message');
      if (command) {
        try {
          await command.run(interaction);
        } catch (error) {
          console.error(error);
          await interaction.reply({
            content: 'There was an error while submitting your report!',
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    }
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (message.channelId == process.env.AI_SUPORTCHANNEL_ID) client.handleSupport(message);

  let unitConversion = client.convertUnits(message.content);
  if (unitConversion !== null) message.reply(unitConversion)

  if (!(channelsToSkip && channelsToSkip.includes(message.channelId))) {
    const LangDetected = eldr.detect(message.content);
    const isEnglish = (LangDetected.isReliable() && LangDetected.iso639_1 === "en") || (!LangDetected.isReliable() && LangDetected.iso639_1 == "")
    const cjkRegex = /[\u4e00-\u9faf\u3400-\u4dbf\uac00-\ud7af]/;

    if (!isEnglish && ((cjkRegex.test(message.content) || message.content.length >= 27))) {
      const translatedJSON = await client.ollamaTranslate(message.content)
      console.log("translatedJSON")
      console.log(translatedJSON)
      if (translatedJSON && translatedJSON.wasTranslated) {
        const translation = translatedJSON.translation;
        const confidence = translatedJSON.confidence;
        const language = translatedJSON.language;
        const isAccurate = translatedJSON.isAccurate;

        const reply = `
Language: ${language} Confidence: ${confidence} ${isAccurate} -> English,
Translation: "${translation}"
        `
        message.reply(`${reply}`);
      }
      else if (nonEnglishTrolls && nonEnglishTrolls.includes(message.author.id)) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const messageWithoutUrls = message.content.replace(urlRegex, '').trim();

        if (messageWithoutUrls.length > 0) {
          message.reply('https://tenor.com/view/speak-english-pulp-fiction-do-you-speak-it-gif-16440534')
        }
      }
    }
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
// trigger release again
