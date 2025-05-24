
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "serverinfo",
  description: "Get information about this server.",
  category: "Info",
  usage: "/serverinfo",

  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Displays info about the server."),

  async execute(interaction) {
    const { guild } = interaction;

    if (!guild) {
      return interaction.reply({
        content: "This command can only be used in a server!",
        flags: 1 << 6
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("📊 Server Info")
      .setColor("Green")
      .setThumbnail(guild.iconURL({ dynamic: true }) || null)
      .addFields(
        { name: "Name", value: guild.name, inline: true },
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Members", value: `${guild.memberCount}`, inline: true },
        { name: "Channels", value: `${guild.channels.cache.size}`, inline: true },
        { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>` }
      )
      .setFooter({ text: `ID: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });
  },
};