const {SlashCommandBuilder} = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('how to get support with problems related to Streamyfin services'),

    async run(interaction) {
        await interaction.reply({
            content: `
📢 **Before posting a new issue, please read these guidelines:**

🔎 **1. Search Before Posting** 

Check if your issue has already been reported:  
👉 [GitHub Issues](https://github.com/streamyfin/streamyfin/issues)

📝 **2. Share Essential Details**

Include:
- Streamyfin version
- Jellyfin version
- Platform (Android, iOS, etc.)
- Relevant logs or screenshots
- Clear steps to reproduce

🧵 **3. Keep Threads Focused**  

Use descriptive titles and stay on-topic.  
Each thread should focus on a single issue.

⏳ **4. Respect Response Time**  

Developers are volunteers.  
Please be patient and avoid reposting or excessive pinging.
`.trim(),
        });
    }
}