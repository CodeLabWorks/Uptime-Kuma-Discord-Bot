const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");
const { io } = require("socket.io-client");
const {
  getUptimeKumaConfigs,
} = require("../../Functions/function"); 

module.exports = {
  name: "kuma-monitor",
  description: "List your Uptime Kuma monitors via WebSocket",
  category: "UptimeKuma",
  usage: "/kuma-monitor [kumaName]",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("kuma-monitor")
    .setDescription("View your Uptime Kuma monitors")
    .addStringOption(option =>
      option
        .setName("kuma")
        .setDescription("Select your Uptime Kuma config")
        .setRequired(true)
        .setAutocomplete(true)
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
    const kumaName = interaction.options.getString("kuma");

    await interaction.deferReply({ ephemeral: true });

    // Load the user uptimeKuma configs
    const configs = getUptimeKumaConfigs(userId);
    if (!configs.length) {
      return interaction.editReply(
        "❌ No Uptime Kuma configurations found. Use `/kuma-setup` to add one."
      );
    }

    // Find selected config
    const config = configs.find(
      c => c.name.toLowerCase() === kumaName.toLowerCase()
    );
    if (!config) {
      return interaction.editReply(
        `❌ Configuration "${kumaName}" not found.`
      );
    }

    const { wsURL, username, password, token } = config;
    if (!wsURL || ((!username || !password) && !token)) {
      return interaction.editReply(
        "❌ Incomplete configuration. Ensure wsURL and credentials or token are provided."
      );
    }

    try {
      // Fetch monitors via WebSocket
      const monitors = await fetchMonitorsSocket({ wsURL, username, password, token });
      if (!monitors || monitors.length === 0) {
        return interaction.editReply("ℹ️ No monitors found.");
      }

      // Pagination setup
      const pageSize = 5;
      let currentPage = 0;
      const totalPages = Math.ceil(monitors.length / pageSize);

      const generateEmbed = (page) => {
        const start = page * pageSize;
        const slice = monitors.slice(start, start + pageSize);
        const embed = new EmbedBuilder()
          .setTitle(`📊 Uptime Kuma Monitors - ${config.name}`)
          .setColor(0x00bfff)
          .setFooter({ text: `Page ${page + 1} of ${totalPages}` });

        slice.forEach((m, i) => {
          embed.addFields({
            name: `${start + i + 1}. ${m.name}`,
            value: [
              `🔗 **URL**: [Link](${m.url || m.hostname || "N/A"})`,
              `⚙️ **Type**: \`${(m.type || "?").toUpperCase()} ${m.method || ""}\``,
              `✅ **Active**: \`${m.active ? "Yes" : "No"}\``,
              `⏱ **Interval**: \`${m.interval}s\`, Timeout: \`${m.timeout}s\``,
              `🔄 **Retries**: \`${m.maxretries}\`, Ignore TLS: \`${m.ignoreTls}\``,
            ].join("\n"),
            inline: false,
          });
        });

        return embed;
      };

      const getActionRow = (page) =>
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next ➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page + 1 >= totalPages)
        );

      // Send initial message
      const message = await interaction.editReply({
        embeds: [generateEmbed(0)],
        components: [getActionRow(0)],
        fetchReply: true,
      });

      // Collector for button interactions
      const collector = message.createMessageComponentCollector({
        time: 60000,
        filter: i => i.user.id === userId,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        if (i.customId === "prev" && currentPage > 0) currentPage--;
        if (i.customId === "next" && currentPage < totalPages - 1) currentPage++;

        await interaction.editReply({
          embeds: [generateEmbed(currentPage)],
          components: [getActionRow(currentPage)],
        });
      });

      collector.on("end", () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });
    } catch (err) {
      console.error(err);
      return interaction.editReply(`❌ Error: ${err.message}`);
    }
  },
};

/**
 * Fetch monitors via Uptime Kuma Socket.io API
 * Uses 'login'/'loginByToken' events and emits 'monitors/getAll'
 */
function fetchMonitorsSocket({ wsURL, username, password, token }) {
  return new Promise((resolve, reject) => {
    const socket = io(wsURL, { transports: ["websocket"] });

    socket.on("connect", () => {
      const handleResponse = (res) => {
        if (Array.isArray(res)) {
          resolve(res);
        } else {
          reject(new Error("Failed to fetch monitors"));
        }
        socket.disconnect();
      };

      if (token) {
        socket.emit("loginByToken", token, (status) => {
          if (status === "ok") {
            socket.emit("monitors/getAll", handleResponse);
          } else {
            reject(new Error("Token authentication failed"));
          }
        });
      } else {
        socket.emit("login", { username, password }, (status) => {
          if (status === "ok") {
            socket.emit("monitors/getAll", handleResponse);
          } else {
            reject(new Error("Login failed"));
          }
        });
      }
    });

    socket.on("error", (err) => {
      reject(err);
    });
  });
}
