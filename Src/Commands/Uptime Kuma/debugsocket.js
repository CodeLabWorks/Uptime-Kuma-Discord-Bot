const {
  SlashCommandBuilder,
  EmbedBuilder
} = require("discord.js");
const fs = require("fs");
const path = require("path");
const io = require("socket.io-client");

module.exports = {
  name: "debugsocket",
  description: "Debug Uptime Kuma socket connection with full logs.",
  category: "Monitoring",
  cooldown: 10,

  data: new SlashCommandBuilder()
    .setName("debugsocket")
    .setDescription("Run a full debug test of your Uptime Kuma socket connection"),

  async execute(interaction) {
    const userId = interaction.user.id;
    const configPath = path.join(__dirname, "../../Database/config.json");

    await interaction.deferReply({ ephemeral: false });

    const sendLog = async (msg, color = 0x2f3136) => {
      const embed = new EmbedBuilder()
        .setDescription(`\`\`\`ansi\n${msg}\`\`\``)
        .setColor(color)
        .setTimestamp();
      await interaction.followUp({ embeds: [embed] });
    };

    if (!fs.existsSync(configPath)) {
      return interaction.editReply("❌ Configuration file not found. Use `/config` first.");
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    const userConfig = config.users?.[userId];

    if (!userConfig) {
      return interaction.editReply("❌ You haven't set up Uptime Kuma. Use `/config` first.");
    }

    const { username, password, url, token } = userConfig;
    if ((!username || !password) && !token || !url) {
      return interaction.editReply("❌ Incomplete configuration.");
    }

    // Normalize and convert URL
    let socketUrl = url.trim().replace(/\/$/, "");
    if (socketUrl.startsWith("http://")) {
      socketUrl = "ws://" + socketUrl.slice(7);
    } else if (socketUrl.startsWith("https://")) {
      socketUrl = "wss://" + socketUrl.slice(8);
    }

    await sendLog(`[DEBUG] Using socket URL: ${socketUrl}`, 0x3498db);

    const socket = io(socketUrl, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 8000,
      path: "/socket.io"
    });

    try {
      await new Promise((resolve, reject) => {
        socket.on("connect", () => {
          sendLog("[DEBUG] ✅ Connected to socket server.");
        });

        socket.on("disconnect", (reason) => {
          sendLog(`[DEBUG] 🔌 Disconnected: ${reason}`);
        });

        socket.on("connect_error", (err) => {
          sendLog(`[ERROR] Connection error: ${err.message}`, 0xff4c4c);
          reject(new Error(err.message));
        });

        socket.on("error", (err) => {
          sendLog(`[ERROR] Socket error: ${err}`, 0xff4c4c);
        });

        socket.on("loginRequired", () => {
          sendLog("[DEBUG] 🔐 Login required.");
          const loginPayload = token
            ? ["loginByToken", { token }]
            : ["login", { username, password }];

          sendLog(`[DEBUG] Sending login: ${loginPayload[0]}`);
          socket.emit(...loginPayload, (res) => {
            sendLog(`[DEBUG] Login response: ${JSON.stringify(res)}`);
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        });

        // Fallback login in case loginRequired doesn't fire
        setTimeout(() => {
          sendLog("[DEBUG] ⏱ Fallback login attempt...");
          const loginPayload = token
            ? ["loginByToken", { token }]
            : ["login", { username, password }];

          socket.emit(...loginPayload, (res) => {
            sendLog(`[DEBUG] Fallback login response: ${JSON.stringify(res)}`);
            if (res.ok) resolve();
            else reject(new Error(res.msg));
          });
        }, 1500);
      });

      await new Promise((resolve, reject) => {
        const timeout = setTimeout(
          () => reject(new Error("Timeout waiting for monitorList")),
          8000
        );

        socket.once("monitorList", (data) => {
          clearTimeout(timeout);
          sendLog(`[DEBUG] 📥 Received monitor list (${Object.keys(data).length} items).`);
          socket.disconnect();
          resolve();
        });

        sendLog("[DEBUG] 📤 Requesting monitor list...");
        socket.emit("getMonitorList");
      });

      await sendLog("✅ Debug complete. Socket connection working as expected.", 0x2ecc71);
    } catch (err) {
      await sendLog(`❌ Error during debug: ${err.message}`, 0xe74c3c);
    }
  }
};
