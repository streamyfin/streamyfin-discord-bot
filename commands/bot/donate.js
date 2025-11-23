import { SlashCommandBuilder } from 'discord.js';


export default {
  data: new SlashCommandBuilder()
    .setName('donate')
    .setDescription('Support the Streamyfin project.'),
  async run(interaction) {
    await interaction.reply({
      content: `🎁 Thank you for supporting our work and sharing your experiences! While many contributors are involved, the majority of the work is done by <@${interaction.client.userId}>. The best way to show your support is by buying him a coffee: https://buymeacoffee.com/fredrikbur3`,
    });
  },
};