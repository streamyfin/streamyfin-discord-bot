const { SlashCommandBuilder } = require('discord.js');
const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.connect().catch(console.error);


const TIME_LIMITS = {
    minutes: 1440,
    hours: 168,
    days: 365,
    weeks: 52
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remindme')
        .setDescription('Set a reminder.')
        .addStringOption(option =>
            option.setName('text')
                .setDescription('What should I remind you about?')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('time')
                .setDescription('Amount of time')
                .setRequired(true)
                .setMinValue(1))
        .addStringOption(option =>
            option.setName('unit')
                .setDescription('Minutes, hours, days, or weeks?')
                .setRequired(true)
                .addChoices(
                    { name: 'Minutes', value: 'minutes' },
                    { name: 'Hours', value: 'hours' },
                    { name: 'Days', value: 'days' },
                    { name: 'Weeks', value: 'weeks' }
                )),
    async run(interaction) {
        try {
            const timeAmount = interaction.options.getInteger('time');
            const timeUnit = interaction.options.getString('unit');
            const userId = interaction.user.id;
            const channel = interaction.channel;
            const text = interaction.options.getString('text');

            if (!channel.permissionsFor(channel.guild.members.me).has('ViewChannel') || !channel.permissionsFor(channel.guild.members.me).has('SendMessages')) {
                return await interaction.reply({
                    content: '❌ I cannot send messages in this channel. Please check my permissions.',
                    ephemeral: true
                });
            }
            if (timeAmount > TIME_LIMITS[timeUnit]) {
                return await interaction.reply({
                    content: `❌ You cannot set a reminder for more than ${TIME_LIMITS[timeUnit]} ${timeUnit}!`,
                    ephemeral: true
                });
            }

            const msMultiplier = {
                minutes: 60 * 1000,
                hours: 60 * 60 * 1000,
                days: 24 * 60 * 60 * 1000,
                weeks: 7 * 24 * 60 * 60 * 1000
            };

            const ms = timeAmount * msMultiplier[timeUnit];
            const reminderTime = Date.now() + ms;

            const reminder = {
                text,
                userId,
                reminderTime,
                channelId: interaction.channelId
            };

            await redisClient.hSet(
                `reminder:${userId}:${reminderTime}`,
                reminder
            );

            const timeString = `${timeAmount} ${timeUnit}`;
            await interaction.reply({
                content: `✅ I will remind you about ${text} in ${timeString}`,
                ephemeral: true
            });

            setTimeout(async () => {
                try {
                    const channel = await interaction.client.channels.fetch(reminder.channelId);
                    await channel.send({
                        content: `<@${userId}> Reminder: ${text}`,
                        allowedMentions: { parse: [] },
                    });
                    await redisClient.del(`reminder:${userId}:${reminderTime}`);
                } catch (error) {
                    console.error('Error sending reminder:', error);
                }
            }, ms);
        } catch (error) {
            console.error('Error setting reminder:', error);
            await interaction.reply({
                content: '❌ An error occurred while setting the reminder.',
                ephemeral: true
            });
        }
    }
};