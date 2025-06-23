const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const io = require("socket.io-client");

module.exports = {
  name: "addmonitor",
  description: "Add a new Uptime Kuma monitor.",
  category: "Monitoring",
  cooldown: 10,

  data: new SlashCommandBuilder()
    .setName("addmonitor")
    .setDescription("Add a new Uptime Kuma monitor")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Monitor Name")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("URL to monitor")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("Type of monitor (e.g., http, ping)")
        .setRequired(true)
        .addChoices(
          { name: "HTTP", value: "http" },
          { name: "Ping", value: "ping" }
        )
    )
    .addStringOption((option) =>
      option
        .setName("interval")
        .setDescription("Monitoring interval in seconds")
        .setRequired(false)
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const configPath = path.join(__dirname, "../../Database/config.json");

    await interaction.deferReply({ flags: 64 });

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const userConfig = config.users?.[userId];

    if (!userConfig) {
      return interaction.editReply({
        content: "❌ You haven't set up Uptime Kuma. Use `/config` first.",
      });
    }

    const { username, password, url, token } = userConfig;
    if ((!username || !password) && !token || !url) {
      return interaction.editReply({ content: "❌ Incomplete configuration." });
    }

    const monitorName = interaction.options.getString("name");
    const monitorUrl = interaction.options.getString("url");
    const monitorType = interaction.options.getString("type");
    const monitorInterval = interaction.options.getString("interval") || "60";

    const socket = io(url.replace(/\/$/, ""), {
      transports: ["websocket"],
      reconnection: false,
      timeout: 8000,
      path: "/socket.io",
    });

    try {
      await new Promise((resolve, reject) => {
        socket.on("connect", () => {});

        socket.on("loginRequired", () => {
          const loginPayload = token
            ? ["loginByToken", { token }]
            : ["login", { username, password }];
          socket.emit(...loginPayload, (res) => {
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        });

        socket.on("connect_error", (err) => {
          reject(new Error(`Connection error: ${err.message}`));
        });

        setTimeout(() => {
          const loginPayload = token
            ? ["loginByToken", { token }]
            : ["login", { username, password }];
          socket.emit(...loginPayload, (res) => {
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        }, 1500);
      });

      let monitorPayload = {
        name: monitorName,
        url: monitorUrl,
        type: monitorType,
        interval: parseInt(monitorInterval, 10),
      };

      socket.emit("addMonitor", monitorPayload, (response) => {
        socket.disconnect();
        if (response.ok) {
          interaction.editReply({
            content: `✅ Monitor "${monitorName}" added successfully!`,
          });
        } else {
          interaction.editReply({
            content: `❌ Error adding monitor: ${response.msg}`,
          });
        }
      });
    } catch (err) {
      console.error(err);
      return interaction.editReply({ content: `❌ Error: ${err.message}` });
    }
  },
};
