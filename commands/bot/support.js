const {SlashCommandBuilder} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('how to get support with problems related to Streamyfin services'),

    async run(interaction) {
        await interaction.reply({
            content: `
        **📢 Please read these guidelines before posting regarding a new issue:**
        
        1. **Search Before Posting**  
        Check if your issue has already been reported on GitHub. If it has, feel free to add any additional details to assist us in resolving it: https://github.com/streamyfin/streamyfin/issues
        
        2. **Share Essential Details**  
        Include your Streamyfin and Jellyfin versions, platform (e.g., Android, iOS), and any relevant logs or screenshots. Be clear about the issue, how to reproduce it, and the expected outcome.
        
        3. **Keep Threads Focused**  
        Use clear, descriptive titles and focus each thread on one issue. Keep discussions relevant and on-topic.
        
        4. **Respect Response Time** 

        Response times may vary based on priority and availability. Since all developers are volunteers, be patient, avoid reposting and pinging.
        `.trim(),
        });
    }
}