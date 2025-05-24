const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "servericon",
  description: "Displays this server's icon.",
  category: "Info", 
  usage: "/servericon",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("servericon")
    .setDescription("Shows the server's icon."),

  async execute(interaction) {
    const { guild } = interaction;

    if (!guild) {
      return interaction.reply({
        content: "❌ This command can only be used in a server!",
        ephemeral: true
      });
    }

    const iconURL = guild.iconURL({ dynamic: true, size: 1024 });

    if (!iconURL) {
      return interaction.reply({
        content: "❌ This server does not have an icon.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${guild.name}'s Icon`)
      .setImage(iconURL)
      .setColor("Green");

    await interaction.reply({ embeds: [embed] });
  },
};