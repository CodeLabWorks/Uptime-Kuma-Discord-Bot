const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "avatar",
  description: "View a user's avatar.",
  category: "Info",
  usage: "/avatar [user]",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("View a user's avatar.")
    .addUserOption(option =>
      option.setName("user").setDescription("The user").setRequired(false)
    ),

  async execute(client, interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Avatar`)
      .setImage(avatarUrl)
      .setColor("Random");

    await interaction.reply({ embeds: [embed] });
  },
};