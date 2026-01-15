import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { fileURLToPath } from 'url';
import Streamyfin from './client.js';
import { GatewayIntentBits, REST, Routes, MessageFlags, EmbedBuilder } from 'discord.js';
import fs from 'fs';
import redisClient from './redisClient.js';
import startRSS from './rss.js';
import { validateEnvironment, setEnvironmentDefaults, logValidationResults } from './utils/validation.js';
import { createErrorResponse } from './utils/errorHandler.js';
import monitor from './utils/monitor.js';
import { applyProductionDefaults, validateProductionEnvironment } from './utils/production.js';
import Logger from './utils/logger.js';

// Initialize logger
const logger = new Logger('MAIN');

// Apply production defaults and validate environment
applyProductionDefaults();
const validation = validateEnvironment();
logValidationResults(validation);

// Additional production environment validation
if (process.env.NODE_ENV === 'production') {
  const prodValidation = validateProductionEnvironment();
  if (!prodValidation.isValid) {
    logger.error('Production environment validation failed');
    prodValidation.errors.forEach(error => logger.error(error));
    process.exit(1);
  }
  if (prodValidation.warnings.length > 0) {
    prodValidation.warnings.forEach(warning => logger.warn(warning));
  }
}

setEnvironmentDefaults();

const tempCommands = [];

/**
 * Parse and validate channels to ignore from environment
 * @returns {string[]|null} Array of channel IDs or null if none configured or on error
 */
function parseChannelsToIgnore() {
  try {
    if (!process.env.CHANNELS_TO_IGNORE) return null;
    const channels = JSON.parse(process.env.CHANNELS_TO_IGNORE);
    return Array.isArray(channels) ? channels.map(String) : null;
  } catch (error) {
    console.warn(`Invalid CHANNELS_TO_IGNORE format (${error.message}), ignoring setting`);
    return null;
  }
}

const channelsToIgnore = parseChannelsToIgnore();
// Initialize Discord client
const client = new Streamyfin({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure client.commands is initialized
if (!client.commands) client.commands = new Map();

/**
 * Load commands from directory structure
 * @returns {Promise<void>}
 */
async function loadCommands() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandImportPromises = [];
  
  try {
    const dirs = fs.readdirSync(commandsPath);
    
    for (const dir of dirs) {
      const fullPath = path.join(commandsPath, dir);
      if (!fs.statSync(fullPath).isDirectory()) continue;
      
      const files = fs.readdirSync(fullPath).filter(file => file.endsWith('.js'));
      
      for (const file of files) {
        const filePath = path.join(fullPath, file);
        const importPromise = import(filePath)
          .then(props => {
            if (!props.default?.data?.name) {
              console.warn(`[COMMAND] Invalid command structure in ${file}`);
              return;
            }
            client.commands.set(props.default.data.name, props.default);
            tempCommands.push(props.default.data);
            console.log(`[COMMAND] => Loaded ${file}`);
          })
          .catch(error => {
            console.error(`[COMMAND] Failed to load ${file}:`, error.message);
          });
        
        commandImportPromises.push(importPromise);
      }
    }
    
    await Promise.all(commandImportPromises);
  } catch (error) {
    console.error('[COMMAND] Error loading commands:', error.message);
  }
}

client.on('ready', async () => {
  console.log(`[BOT] ${client.user.tag} is ready!`);
  client.user.setActivity('over Streamyfin\'s issues 👀', { type: 3 });
  
  // Store bot start time in Redis
  try {
    await redisClient.set('bot:startTime', Date.now().toString());
    await redisClient.set('bot:status', 'online');
  } catch (redisError) {
    console.warn('[BOT] Failed to store start time in Redis:', redisError.message);
  }
  
  // Load commands and register them
  await loadCommands();
  console.log(`[COMMAND] Loaded ${tempCommands.length} commands`);
  
  // Only register commands if we have them and proper environment
  if (tempCommands.length > 0 && process.env.DISCORD_TOKEN && process.env.CLIENT_ID) {
    await registerCommands();
  } else {
    logger.warn('Skipping command registration - missing token or client ID');
  }
  
  // Start RSS monitoring if configured
  if (process.env.ENABLE_RSS_MONITORING === 'true') {
    logger.info('Starting RSS monitoring...');
    startRSS(client).catch(error => {
      logger.error('RSS monitoring error:', error);
      monitor.recordError('rss_monitoring');
    });
  }
});

client.on('interactionCreate', async (interaction) => {
  // Ignore interactions from ignored channels, but send an ephemeral reply
  if (channelsToIgnore?.includes(interaction.channelId)) {
    if (interaction.isRepliable()) {
      try {
        await interaction.reply({
          content: 'This channel is ignored by the bot.',
          flags: MessageFlags.Ephemeral,
        });
      } catch {
        // Ignore reply errors for ignored channels
      }
    }
    return;
  }

  try {
    if (interaction.isCommand()) {
      await handleCommandInteraction(interaction);
    } else if (interaction.isButton()) {
      await handleButtonInteraction(interaction);
    } else if (interaction.isModalSubmit()) {
      await handleModalSubmit(interaction);
    }
  } catch (error) {
    console.error('[INTERACTION] Unhandled interaction error:', error.message);
  }
});

/**
 * Handle command interactions
 * @param {Interaction} interaction 
 */
async function handleCommandInteraction(interaction) {
  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.warn(`[INTERACTION] Unknown command: ${interaction.commandName}`);
    if (interaction.isRepliable() && !interaction.replied) {
      await interaction.reply({
        content: 'Unknown interaction',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
    return;
  }

  try {
    await command.run(interaction);
    monitor.recordCommand(interaction.commandName);
  } catch (error) {
    const errorResponse = createErrorResponse(error, `Command: ${interaction.commandName}`);
    monitor.recordError('command_execution');
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorResponse).catch(() => {});
    } else {
      await interaction.reply(errorResponse).catch(() => {});
    }
  }
}

/**
 * Handle button interactions
 * @param {Interaction} interaction 
 */
async function handleButtonInteraction(interaction) {
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
      console.error('[INTERACTION] Error resolving report:', error.message);
      await interaction.reply({
        content: 'There was an error while resolving this report!',
        flags: MessageFlags.Ephemeral,
      }).catch(() => {});
    }
  }
}

/**
 * Handle modal submit interactions
 * @param {Interaction} interaction 
 */
async function handleModalSubmit(interaction) {
  if (interaction.customId.startsWith('report_modal_')) {
    const command = client.commands.get('Report Message');
    if (command) {
      try {
        await command.run(interaction);
      } catch (error) {
        console.error('[INTERACTION] Error handling modal submit:', error.message);
        await interaction.reply({
          content: 'There was an error while submitting your report!',
          flags: MessageFlags.Ephemeral,
        }).catch(() => {});
      }
    }
  }
}

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;
  if (channelsToIgnore?.includes(message.channelId)) return;

  // Handle AI support channel
  if (message.channelId === process.env.AI_SUPPORTCHANNEL_ID) {
    return client.handleSupport(message);
  }

  // Toxicity detection (log only)
  if (process.env.PERSPECTIVE_APIKEY && message.content.length >= 10) {
    checkToxicity(message).catch(error => {
      console.error('[MODERATION] Error checking toxicity:', error.message);
    });
  }

  // Handle unit conversions
  const unitConversion = client.convertUnits(message.content);
  if (unitConversion) {
    await message.reply(unitConversion).catch(error => {
      console.error('[MESSAGE] Error sending unit conversion:', error.message);
    });
  }
});

/**
 * Check message for toxicity and log to mod channel if detected
 * @param {Message} message - Discord message to check
 */
async function checkToxicity(message) {
  const isToxic = await client.checkMessage(message.content);
  if (!isToxic) return;

  const modChannelId = process.env.MOD_LOG_CHANNEL_ID;
  if (!modChannelId) {
    console.warn('[MODERATION] Toxic message detected but MOD_LOG_CHANNEL_ID not set');
    return;
  }

  try {
    const modChannel = await client.channels.fetch(modChannelId);
    if (!modChannel) return;

    const embed = new EmbedBuilder()
      .setTitle('Potentially Toxic Message Detected')
      .setColor(0xff6b6b)
      .addFields(
        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channelId}>`, inline: true },
        { name: 'Content', value: message.content.slice(0, 1024) || 'N/A' },
        { name: 'Link', value: `[Jump to message](${message.url})` }
      )
      .setTimestamp();

    await modChannel.send({ embeds: [embed] });
    console.log(`[MODERATION] Logged toxic message from ${message.author.tag}`);
  } catch (error) {
    console.error('[MODERATION] Failed to log toxic message:', error.message);
  }
}

/**
 * Register slash commands with Discord
 * @returns {Promise<void>}
 */
const registerCommands = async () => {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    console.error('[COMMAND] Missing required environment variables for command registration');
    return;
  }

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log(`[COMMAND] Registering ${tempCommands.length} slash commands...`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: tempCommands,
    });
    console.log('[COMMAND] Slash commands registered successfully!');
  } catch (error) {
    console.error('[COMMAND] Error registering slash commands:', error.message);
  }
};

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  try {
    monitor.destroy();
    await redisClient.quit();
    client.destroy();
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason: reason?.message || reason });
  monitor.recordError('unhandled_rejection');
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  monitor.recordError('uncaught_exception');
  process.exit(1);
});

// Start Discord bot
if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('[BOT] Failed to login:', error.message);
  });
} else {
  console.error('[BOT] No Discord token provided');
  process.exit(1);
}
