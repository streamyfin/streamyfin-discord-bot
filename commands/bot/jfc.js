import { SlashCommandBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("jfc")
        .setDescription("Links to the JellyfinCommunity Discord server and reddit."),

    async run(interaction) {
        await interaction.reply({
            content: `**JellyfinCommunity**  
Join the [JellyfinCommunity Discord](https://discord.gg/v7P9CAvCKZ) for support, discussions, and more!

**Reddit**  
Visit the [r/Jellyfin subreddit](https://www.reddit.com/r/JellyfinCommunity/) for news, tips, and community content.`,
            allowedMentions: { users: [] }
        });
    },
};  