const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "userroles",
  description: "Lists your roles or another user's roles.",
  category: "Info",
  usage: "/userroles [user]",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("roles")
    .setDescription("List roles for a user.")
    .addUserOption(option =>
      option.setName("user").setDescription("The user").setRequired(false)
    ),

  async execute(client, interaction) {
    const member = interaction.options.getMember("user") || interaction.member;

    if (!member) {
      return interaction.reply({
        content: "❌ Couldn't find that user in this server.",
        flags: 64, // Ephemeral
      });
    }

    const roles = member.roles.cache
      .filter(role => role.id !== interaction.guild.id)
      .map(role => role.toString())
      .join(", ") || "No roles";

    const embed = new EmbedBuilder()
      .setTitle(`${member.user.username}'s Roles`)
      .setColor("Blurple")
      .setDescription(roles)
      .setFooter({ text: `Total Roles: ${member.roles.cache.size - 1}` });

    await interaction.reply({ embeds: [embed] });
  },
};