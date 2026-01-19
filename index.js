import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GatewayIntentBits, REST, Routes, MessageFlags, EmbedBuilder } from 'discord.js';
import Streamyfin from './client.js';
import redisClient from './redisClient.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const channelsToIgnore = parseChannelsToIgnore();
const commandsData = [];
const commandImportPromises = [];

const client = new Streamyfin({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

function parseChannelsToIgnore() {
  try {
    return JSON.parse(process.env.CHANNELS_TO_IGNORE || '[]').map(String);
  } catch {
    return [];
  }
}

function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');

  for (const dir of fs.readdirSync(commandsPath)) {
    const dirPath = path.join(commandsPath, dir);
    if (!fs.statSync(dirPath).isDirectory()) continue;

    const files = fs.readdirSync(dirPath).filter(file => file.endsWith('.js'));

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const importPromise = import(filePath).then(module => {
        client.commands.set(module.default.data.name, module.default);
        commandsData.push(module.default.data);
        console.log(`[COMMAND] Loaded ${file}`);
      });
      commandImportPromises.push(importPromise);
    }
  }
}

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log('Registering slash commands...');
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commandsData,
    });
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering slash commands:', error);
  }
}

async function handleCommand(interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.run(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    } else {
      await interaction.reply({
        content: 'There was an error while executing this command!',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
}

async function handleReportButton(interaction) {
  const { customId, user, guild } = interaction;
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

async function handleReportModal(interaction) {
  const command = client.commands.get('Report Message');
  if (!command) return;

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

client.on('ready', async () => {
  client.user.setActivity("over Streamyfin's issues 👀", { type: 3 });
  await Promise.all(commandImportPromises);
  await registerCommands();
});

client.on('interactionCreate', async (interaction) => {
  if (channelsToIgnore.includes(interaction.channelId)) {
    if (interaction.isRepliable?.()) {
      await interaction.reply({
        content: 'This channel is ignored by the bot.',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
    return;
  }

  if (interaction.isCommand()) {
    await handleCommand(interaction);
  } else if (interaction.isButton() && interaction.customId.startsWith('resolve_report_')) {
    await handleReportButton(interaction);
  } else if (interaction.isModalSubmit?.() && interaction.customId.startsWith('report_modal_')) {
    await handleReportModal(interaction);
  }
});

loadCommands();
client.login(process.env.DISCORD_TOKEN);
