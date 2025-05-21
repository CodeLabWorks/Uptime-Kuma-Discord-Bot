const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");
const io = require("socket.io-client");

module.exports = {
  name: "config",
  description: "Validate and save your Uptime Kuma username, password, and URL",
  category: "Configuration",
  cooldown: 20,


  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Validate your Uptime Kuma credentials")
    .addStringOption((option) =>
      option
        .setName("username")
        .setDescription("Your Uptime Kuma username")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("password")
        .setDescription("Your Uptime Kuma password")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("url")
        .setDescription("Your Uptime Kuma URL (e.g. https://status.example.com)")
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString("username");
    const password = interaction.options.getString("password");
    const url = interaction.options.getString("url");
    const userId = interaction.user.id;

    // Clean URL trailing slash
    const cleanUrl = url.replace(/\/$/, "");

    const socket = io(cleanUrl, {
      transports: ["websocket"],
      reconnection: false,
      timeout: 2000,
      path: "/socket.io",
    });

    // Helper timeout
    const timeoutPromise = (ms) =>
      new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms));

    try {
      await Promise.race([
        new Promise((resolve, reject) => {
          socket.on("connect", () => {
            socket.emit(
              "login",
              { username, password },
              (res) => {
                if (res.ok) {
                  resolve(res);
                } else {
                  reject(new Error(res.msg || "Invalid credentials"));
                }
              }
            );
          });

          socket.on("connect_error", (err) => {
            reject(new Error(`WebSocket connection error: ${err.message}`));
          });
        }),
        timeoutPromise(10000),
      ]);

      // On success, save credentials
      const databaseFolder = path.join(__dirname, "../../Database");
      if (!fs.existsSync(databaseFolder)) {
        fs.mkdirSync(databaseFolder, { recursive: true });
      }

      const configPath = path.join(databaseFolder, "config.json");
      let config = {};
      if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } else {
        config = { users: {} };
      }

      config.users[userId] = { username, password, url };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      socket.disconnect();

      return interaction.reply({
        content: "✅ Credentials validated and configuration saved successfully!",
        flags: 1 << 6,
      });
    } catch (error) {
      socket.disconnect();
      console.error("Validation error:", error);
      return interaction.reply({
        content: `❌ Validation failed: ${error.message}`,
        flags: 1 << 6,
      });
    }
  },
};
