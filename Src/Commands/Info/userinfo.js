const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "userinfo",
  description: "Get information about a user.",
  category: "Info",
  usage: "/userinfo <user>",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Get information about a user.")
    .addUserOption(option =>
      option.setName("target").setDescription("The user").setRequired(false)
    ),

  async execute(interaction, client) {
    const targetUser = interaction.options.getUser("target") || interaction.user;
    const member = interaction.guild?.members.cache.get(targetUser.id);

    const embed = new EmbedBuilder()
      .setTitle("👤 User Info")
      .setColor("Blurple")
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Username", value: targetUser.tag, inline: true },
        { name: "User ID", value: targetUser.id, inline: true },
        { name: "Created", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>` },
        ...(member ? [{ name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` }] : [])
      );

    await interaction.reply({ embeds: [embed] });
  },
};