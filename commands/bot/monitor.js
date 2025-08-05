import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import redisClient from '../../redisClient.js';

const serverRoles = ["Developer", "Administrator"];
const isValidUrl = (url) => /^https?:\/\/\S+$/i.test(url);

const buildMonitorCommand = () =>
    new SlashCommandBuilder()
        .setName('monitor')
        .setDescription('Manage external content monitoring')
        .addSubcommand(sub =>
            sub.setName('add')
                .setDescription('Add a source to monitor')
                .addStringOption(option =>
                    option.setName('type')
                        .setDescription('Type of source')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Reddit', value: 'reddit' },
                            { name: 'RSS', value: 'rss' },
                        ))
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL of the source')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('interval')
                        .setDescription('interval in minutes')
                        .setRequired(false)))
        .addSubcommand(sub =>
            sub.setName('remove')
                .setDescription('Remove a monitored source')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL of the source to remove')
                        .setRequired(true)))
        .addSubcommand(sub =>
            sub.setName('list')
                .setDescription('List all monitored sources'))
        .addSubcommand(sub =>
            sub.setName('edit')
                .setDescription('Edit a monitored source')
                .addStringOption(option =>
                    option.setName('url')
                        .setDescription('URL of the source to edit')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('new_channel')
                        .setDescription('New channel ID to send updates')
                        .setRequired(false))
                .addIntegerOption(option =>
                    option.setName('interval')
                        .setDescription('New interval in minutes')
                        .setRequired(false)));

const hasPermission = (member) => {
    if (!member?.roles?.cache) return false;
    const roles = member.roles.cache.map(role => role.name);
    return roles.some(role => serverRoles.includes(role));
};

export default {
    data: buildMonitorCommand(),
    async run(interaction) {
        if (!hasPermission(interaction.member)) return interaction.reply("You do not have permission to use this command.");

        const subcommand = interaction.options.getSubcommand();
        const channelId = interaction.channelId;
        const userId = interaction.user.id;
        const guildId = interaction.guildId;

        try {
            if (subcommand === 'add') {
                const type = interaction.options.getString('type');
                const url = interaction.options.getString('url');
                const interval = interaction.options.getInteger('interval') || 5;
                const key = `monitor:${guildId}:${url}`;
                if (!['reddit', 'rss'].includes(type)) return interaction.reply("Invalid source type.");
                if (!isValidUrl(url)) return interaction.reply("Please provide a valid URL.");
                if (interval < 1 || interval > 1440) return interaction.reply("Interval must be between 1 and 1440 minutes.");
                if (await redisClient.exists(key)) return interaction.reply(`This source is already being monitored.`);

                await redisClient.hSet(key, {
                    type,
                    url,
                    interval,
                    channelId,
                    userId,
                    guildId,
                    createdAt: Date.now()
                });

                return interaction.reply(`✅ Now monitoring ${type.toUpperCase()} source: ${url} (every ${interval}m)`);
            }

            if (subcommand === 'remove') {
                const url = interaction.options.getString('url');
                if (!isValidUrl(url)) return interaction.reply("Please provide a valid URL.");
                const key = `monitor:${guildId}:${url}`;
                const deleted = await redisClient.del(key);

                return interaction.reply(deleted ? `Monitoring for ${url} removed.` : `No such monitored source found.`);
            }

            if (subcommand === 'list') {
                const keys = await redisClient.keys(`monitor:${guildId}:*`);
                if (!keys.length) return interaction.reply(`No sources are currently being monitored in this server.`);

                const hashKeys = [];
                for (const key of keys) {
                    const type = await redisClient.type(key);
                    if (type === 'hash') hashKeys.push(key);
                }
                if (!hashKeys.length) return interaction.reply(`No sources are currently being monitored in this server.`);

                const monitors = await Promise.all(hashKeys.map(key => redisClient.hGetAll(key)));
                const formatted = monitors.map(m =>
                    `• **${(m.type || 'unknown').toUpperCase()}**: ${m.url || 'N/A'} (every ${m.interval || '?'}m in <#${m.channelId || '?'}>)`
                ).join('\n');

                return interaction.reply({
                    embeds: [{
                        title: "📡 Currently Monitored Sources",
                        description: formatted,
                        color: 0x6A0DAD
                    }],
                });
            }
            if (subcommand === 'edit') {
                const url = interaction.options.getString('url');
                if (!isValidUrl(url)) return interaction.reply("Please provide a valid URL.");
                const key = `monitor:${guildId}:${url}`;
                if (!(await redisClient.exists(key))) return interaction.reply(`No monitored source found.`);

                const newChannel = interaction.options.getString('new_channel');
                const newInterval = interaction.options.getInteger('interval');

                if (!newChannel && !newInterval) return interaction.reply("Please provide at least a channel ID or a new interval to update.");
                if (newChannel && !interaction.guild.channels.cache.has(newChannel)) return interaction.reply("Invalid channel ID provided.");
                if (newInterval && (newInterval < 1 || newInterval > 1440)) return interaction.reply("Interval must be between 1 and 1440 minutes.");

                if (newChannel) {
                    await redisClient.hSet(key, 'channelId', newChannel);
                }
                if (newInterval) {
                    await redisClient.hSet(key, 'interval', newInterval);
                }
                return interaction.reply(`Updated monitoring for ${url}. New channel: ${newChannel || 'unchanged'}, new interval: ${newInterval || 'unchanged'}m.`);

            }
        } catch (error) {
            console.error('Error handling monitor command:', error);
            return interaction.reply('Something went wrong while processing your command.');
        }
    }
}
