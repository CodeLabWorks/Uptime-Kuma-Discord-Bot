const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const {
  getUptimeKumaConfigs,
  deleteUptimeKumaConfig,
  saveUserConfig,
  getUserConfigs,
} = require("../../Functions/function");

module.exports = {
  name: "kuma-delete",
  description: "Delete a specific or all Uptime Kuma instances",
  category: "UptimeKuma",
  usage: "/kuma-delete",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("kuma-delete")
    .setDescription("Delete a specific or all Uptime Kuma instances")
    .addStringOption(opt =>
      opt.setName("type")
        .setDescription("Choose whether to delete a specific instance or all")
        .setRequired(true)
        .addChoices(
          { name: "specific", value: "specific" },
          { name: "all", value: "all" }
        )
    )
    .addStringOption(opt =>
      opt.setName("name")
        .setDescription("Name of the instance to delete")
        .setAutocomplete(true)
        .setRequired(false)
    ),

  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const userId = interaction.user.id;
    const kumas = getUptimeKumaConfigs(userId);

    const filtered = kumas.filter(kuma =>
      kuma.name.toLowerCase().includes(focusedValue.toLowerCase())
    );

    await interaction.respond(
      filtered.slice(0, 25).map(kuma => ({ name: kuma.name, value: kuma.name }))
    );
  },

  async execute(interaction) {
    const userId = interaction.user.id;
    const type = interaction.options.getString("type");
    const name = interaction.options.getString("name");
    const existing = getUptimeKumaConfigs(userId);

    if (existing.length === 0) {
      return interaction.reply({
        content: "❌ You have no Uptime Kuma instances saved.",
        flags: MessageFlags.Ephemeral
      });
    }

    if (type === "all") {
      const userData = getUserConfigs(userId);
      userData.uptimeKuma = [];
      saveUserConfig(userId, userData);

      return interaction.reply({
        content: "✅ All Uptime Kuma instances have been deleted.",
        flags: MessageFlags.Ephemeral
      });
    }

    // specific
    if (!name) {
      return interaction.reply({
        content: "❌ You must provide a name when deleting a specific instance.",
        flags: MessageFlags.Ephemeral
      });
    }

    const deleted = deleteUptimeKumaConfig(userId, name);
    if (!deleted) {
      return interaction.reply({
        content: `❌ No Uptime Kuma instance found with the name "${name}".`,
        flags: MessageFlags.Ephemeral
      });
    }

    return interaction.reply({
      content: `✅ Uptime Kuma instance "${name}" has been deleted.`,
      flags: MessageFlags.Ephemeral
    });
  },
};
