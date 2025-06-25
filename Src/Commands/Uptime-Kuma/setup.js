const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const { io } = require("socket.io-client");
const { addUptimeKumaConfig, getUptimeKumaConfigs } = require("../../Functions/function");

module.exports = {
  name: "kuma-setup",
  description: "Add an Uptime Kuma instance to your account",
  category: "UptimeKuma",
  usage: "/kuma-setup",
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName("kuma-setup")
    .setDescription("Add an Uptime Kuma instance to your account")
    .addStringOption(opt => opt.setName("ws_url").setDescription("Host, e.g., uptime.domain.com").setRequired(true))
    .addStringOption(opt => opt.setName("username").setDescription("Your Uptime Kuma username").setRequired(true))
    .addStringOption(opt => opt.setName("password").setDescription("Your Uptime Kuma password").setRequired(true))
    .addStringOption(opt => opt.setName("name").setDescription("Name for this Uptime Kuma instance").setRequired(true)),

  async execute(interaction) {
    const userId = interaction.user.id;
    const rawUrl = interaction.options.getString("ws_url")
      .replace(/^https?:\/\//, "")
      .replace(/^wss?:\/\//, "")
      .replace(/\/+$/, "");
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");
    const name = interaction.options.getString("name");

    const existing = getUptimeKumaConfigs(userId);
    if (existing.some(cfg => cfg.wsURL === rawUrl)) {
      return interaction.reply({ content: "❌ You already have an Uptime Kuma instance saved with that host.", flags: MessageFlags.Ephemeral });
    }
    if (existing.some(cfg => cfg.name.toLowerCase() === name.toLowerCase())) {
      return interaction.reply({ content: `❌ You already have an instance named "${name}".`, flags: MessageFlags.Ephemeral });
    }

    await interaction.deferReply({ ephemeral: true });

    // helper to try connecting via Socket.IO
    const tryConnect = (url) => {
      return new Promise((resolve, reject) => {
        const socket = io(url, {
          path: "/socket.io",
          transports: ["websocket"],
          timeout: 5000,
          reconnection: false,
        });

        const cleanup = () => {
          socket.off();
          socket.disconnect();
        };

        socket.on("connect", () => {
          socket.emit("login", { username, password });
        });

        socket.on("login", (res) => {
          cleanup();
          if (res.ok) resolve(true);
          else reject(new Error("Login failed: invalid credentials."));
        });

        socket.on("connect_error", err => {
          cleanup();
          reject(new Error(`Connection error: ${err.message}`));
        });

        setTimeout(() => {
          cleanup();
          reject(new Error("Connection timed out."));
        }, 7000);
      });
    };

    const wsCandidates = [`ws://${rawUrl}`, `wss://${rawUrl}`];
    let successfulUrl = null;

    for (const candidate of wsCandidates) {
      try {
        await tryConnect(candidate);
        successfulUrl = candidate;
        break;
      } catch {
        // ignore and try next
      }
    }

    if (!successfulUrl) {
      return interaction.editReply({ content: "❌ Could not connect over WS or WSS. Please check the host and credentials." });
    }

    addUptimeKumaConfig(userId, { name, wsURL: successfulUrl, username, password });
    return interaction.editReply({ content: `✅ Saved **${name}** with URL \`${successfulUrl}\`.` });
  },
};
