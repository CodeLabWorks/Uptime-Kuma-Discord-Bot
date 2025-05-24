
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "uptime",
  description: "Check how long the bot has been running.",
  category: "Info",
  usage: "/uptime",
  cooldown: 10,

  data: new SlashCommandBuilder()
    .setName("uptime")
    .setDescription("Check how long the bot has been running."),

  async execute(interaction) {
    const totalSeconds = Math.floor(process.uptime());
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    await interaction.reply({
      content: `🕒 Uptime: **${days}d ${hours}h ${minutes}m ${seconds}s**`,
      flags: 1 << 6
    });
  },
};