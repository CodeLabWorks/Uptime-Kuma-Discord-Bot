const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "botinfo",
  description: "Shows information about the bot.",
  category: "Info",
  usage: "/botinfo",

  data: new SlashCommandBuilder()
    .setName("botinfo")
    .setDescription("Displays info about the bot."),

  async execute(interaction, client) {
    if (!client?.user) {
      return interaction.reply({
        content: "Bot information is not available right now.",
        flags: 1 << 6
      });
    }

    const embed = new EmbedBuilder()
      .setTitle("🤖 Bot Info")
      .setColor("Blue")
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "Name", value: client.user.tag, inline: true },
        { name: "Servers", value: `${client.guilds?.cache?.size || 0}`, inline: true },
        { name: "Users", value: `${client.users?.cache?.size || 0}`, inline: true },
        { name: "Ping", value: `${client.ws.ping}ms`, inline: true },
        { name: "Created At", value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>` }
      )
      .setFooter({ text: `ID: ${client.user.id}` });

    await interaction.reply({ embeds: [embed] });
  },
};