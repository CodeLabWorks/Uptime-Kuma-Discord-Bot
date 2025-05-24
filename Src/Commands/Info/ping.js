
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  name: "ping",
  description: "Check the bot's latency.",
  category: "Info",
  usage: "/ping",
  cooldown: 15,
  devOnly: false,
  guildOnly: false,
  requiredRole: false,
  voiceOnly: false,
  nsfwOnly: false,
  toggleOffCmd: false,
  maintenanceCmd: false,

  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check the bot's latency."),

  async execute(interaction, client) {
    await interaction.reply({ content: "Pinging..." });
    const sent = await interaction.fetchReply();

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiPing = Math.round(client.ws.ping);

    await interaction.editReply(`🏓 Pong! Latency is **${latency}ms**, API ping is **${apiPing}ms**.`);
  },
};