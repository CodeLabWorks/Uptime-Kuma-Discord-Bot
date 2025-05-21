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

  async execute(client, interaction) {
    const user = interaction.options.getUser("target") || interaction.user;
    const member = interaction.guild?.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setTitle("👤 User Info")
      .setColor("Blurple")
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "Username", value: user.tag, inline: true },
        { name: "User ID", value: user.id, inline: true },
        { name: "Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>` },
        ...(member ? [{ name: "Joined Server", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` }] : [])
      );

    await interaction.reply({ embeds: [embed] });
  },
};
