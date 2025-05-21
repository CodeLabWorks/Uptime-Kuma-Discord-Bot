const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");
const io = require("socket.io-client");

module.exports = {
  name: "listmonitors",
  description: "List all your Uptime Kuma monitors with pagination.",
  category: "Monitoring",
  cooldown: 10,


  data: new SlashCommandBuilder()
    .setName("listmonitors")
    .setDescription("List all your Uptime Kuma monitors"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const configPath = path.join(__dirname, "../../Database/config.json");

    await interaction.deferReply({ flags: 64 });

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const userConfig = config.users?.[userId];

    if (!userConfig) {
      return interaction.editReply({ content: "❌ You haven't set up Uptime Kuma. Use `/config` first." });
    }

    const { username, password, url, token } = userConfig;
    if ((!username || !password) && !token || !url) {
      return interaction.editReply({ content: "❌ Incomplete configuration." });
    }

    const socket = io(url.replace(/\/$/, ""), {
      transports: ["websocket"],
      reconnection: false,
      timeout: 8000,
      path: "/socket.io",
    });

    try {
      await new Promise((resolve, reject) => {
        socket.on("connect", () => {
        });

        socket.on("loginRequired", () => {
          const loginPayload = token ? ["loginByToken", { token }] : ["login", { username, password }];
          socket.emit(...loginPayload, (res) => {
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        });

        socket.on("connect_error", (err) => {
          reject(new Error(`Connection error: ${err.message}`));
        });

        // Fallback in case loginRequired doesn't emit
        setTimeout(() => {
          const loginPayload = token ? ["loginByToken", { token }] : ["login", { username, password }];
          socket.emit(...loginPayload, (res) => {
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        }, 1500);
      });

      const monitors = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Timeout waiting for monitorList")), 8000);
        socket.once("monitorList", (data) => {
          clearTimeout(timeout);
          socket.disconnect();
          resolve(Object.values(data));
        });
      });

      if (monitors.length === 0) {
        return interaction.editReply({ content: "ℹ️ No monitors found." });
      }

      // Pagination logic
      const pageSize = 5;
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * pageSize;
        const end = start + pageSize;
        const items = monitors.slice(start, end);

        const embed = new EmbedBuilder()
          .setTitle("📊 Uptime Kuma Monitors")
          .setColor(0x00bfff)
          .setFooter({ text: `Page ${page + 1} of ${Math.ceil(monitors.length / pageSize)}` });

        items.forEach((m, i) => {
          embed.addFields({
            name: `${start + i + 1}. ${m.name}`,
            value: [
              `🔗 **URL**: [Link](${m.url})`,
              `⚙️ **Type**: \`${m.type.toUpperCase()} ${m.method}\``,
              `✅ **Active**: \`${m.active ? "Yes" : "No"}\``,
              `⏱ **Interval**: \`${m.interval}s\`, Timeout: \`${m.timeout}s\``,
              `🔄 **Retries**: \`${m.maxretries}\`, Ignore TLS: \`${m.ignoreTls}\``
            ].join("\n"),
            inline: false,
          });
        });

        return embed;
      };

      const getActionRow = (page, totalPages) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("⬅️ Previous")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next ➡️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page >= totalPages - 1)
        );
      };

      const totalPages = Math.ceil(monitors.length / pageSize);
      const initialEmbed = generateEmbed(currentPage);
      const initialRow = getActionRow(currentPage, totalPages);

      const message = await interaction.editReply({ embeds: [initialEmbed], components: [initialRow], fetchReply: true });

      const collector = message.createMessageComponentCollector({
        time: 60000,
        filter: (i) => i.user.id === userId,
      });

      collector.on("collect", async (i) => {
        await i.deferUpdate();
        if (i.customId === "prev" && currentPage > 0) currentPage--;
        if (i.customId === "next" && currentPage < totalPages - 1) currentPage++;

        const embed = generateEmbed(currentPage);
        const row = getActionRow(currentPage, totalPages);
        await interaction.editReply({ embeds: [embed], components: [row] });
      });

      collector.on("end", () => {
        interaction.editReply({ components: [] }).catch(() => {});
      });

    } catch (err) {
      console.error(err);
      return interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
