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

  async execute(client, interaction) {
    const iconURL = interaction.guild.iconURL({ dynamic: true, size: 1024 });

    if (!iconURL) {
      return interaction.reply({
        content: "❌ This server does not have an icon.",
        flags: 64,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name}'s Icon`)
      .setImage(iconURL)
      .setColor("Green");

    await interaction.reply({ embeds: [embed] });
  },
};
