import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('How to get support with problems related to Streamyfin services'),
    
    async run(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🆘 Getting Support for Streamyfin')
                .setColor(0x6A0DAD)
                .setDescription('Before posting a new issue, please read these guidelines:')
                .addFields([
                    {
                        name: '🔎 1. Search Before Posting',
                        value: 'Check if your issue has already been reported:\n👉 [GitHub Issues](https://github.com/streamyfin/streamyfin/issues)',
                        inline: false
                    },
                    {
                        name: '📝 2. Share Essential Details',
                        value: 'Include:\n• Streamyfin version\n• Jellyfin version\n• Platform (Android, iOS, etc.)\n• Relevant logs or screenshots\n• Clear steps to reproduce',
                        inline: false
                    },
                    {
                        name: '🧵 3. Keep Threads Focused',
                        value: 'Use descriptive titles and stay on-topic.\nEach thread should focus on a single issue.',
                        inline: false
                    },
                    {
                        name: '⏳ 4. Respect Response Time',
                        value: 'Developers are volunteers.\nPlease be patient and avoid reposting or excessive pinging.',
                        inline: false
                    },
                    {
                        name: '🛠️ Useful Commands',
                        value: '• `/createissue` - Report a bug\n• `/featurerequest` - Suggest features\n• `/logs` - Get log upload instructions',
                        inline: false
                    }
                ])
                .setFooter({ text: 'Thank you for helping improve Streamyfin!' })
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral
            });

        } catch (error) {
            console.error('[SUPPORT] Error executing support command:', error.message);
            
            await interaction.reply({
                content: '❌ An error occurred while displaying support information.',
                flags: MessageFlags.Ephemeral
            }).catch(() => {});
        }
    },
};