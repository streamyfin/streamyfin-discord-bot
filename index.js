require("dotenv").config();
const Streamyfin = require('./client');
const { GatewayIntentBits, REST, Routes } = require ("discord.js");
const fs = require("fs");

// GitHub API base URL and repo data
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const tempCommands = []

// Initialize Discord client
const client = new Streamyfin({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});
  
fs.readdirSync("./commands/").forEach(dir => {
    const files = fs.readdirSync(`./commands/${dir}/`).filter(file => file.endsWith(".js"));
    for (let file of files) {
        let props = require(`./commands/${dir}/${file}`);
        client.commands.set(props.data.name, props);
        tempCommands.push(props.data)
        console.log(`[COMMAND] => Loaded ${file} `);
    }
});

client.on("ready", () => {
    client.user.setActivity("over Streamyfin's issues 👀", { type: 3 });
})
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
    
	const command = client.commands.get(interaction.commandName);
    if (!command) return;

	try {
		await command.run(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: 'There was an error while executing this command!',
			ephemeral: true,
		});
	}
})
const registerCommands = async () => {
  if (GITHUB_TOKEN) await client.fetchReleases();

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
