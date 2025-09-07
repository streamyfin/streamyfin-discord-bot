import { SlashCommandBuilder} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName('logs')
        .setDescription('Instructions for uploading your Jellyfin server logs.'),

    async run(interaction) {
        await interaction.reply(
            `**Step 1:** Reproduce the issue so it appears in the logs.

**Step 2:** Locate your latest server log:

- **Linux:** /var/lib/jellyfin/logs
- **Windows:** %programdata%/jellyfin/logs
- **Docker:** check the mounted config directory, inside the /logs folder

Logs are in the same location as ffmpeg logs and can also be accessed via the Jellyfin dashboard.

**Step 3:** If the log is large or you only want to highlight a specific problem, include that entry plus ~100 lines before and after.

**Step 4:** Upload the log to [paste.streamyfin.app](https://paste.streamyfin.app) and share the link here.`
        )
    },
}
