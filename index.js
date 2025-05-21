require("dotenv").config();
const { Collection, Client, EmbedBuilder, WebhookClient, ChannelType } = require("discord.js");
const color = require("colors");

const { loadSlashCommands } = require("./Src/Handlers/Load/slashCommand");
const { loadEvents } = require("./Src/Handlers/Load/event");
const { loadAntiCrash } = require("./Src/Handlers/antiCrash");
const clientSettingsObject = require("./Src/Functions/clientSettingsObject");
const config = require("./config");

(async () => {
  try {

    // Create the Discord client
    client = new Client(clientSettingsObject());
    [
      "slashCommands",
      "messageCommands",
      "events",
      "categories",
      "cooldowns",
    ].forEach((prop) => (client[prop] = new Collection()));

    // Crash handlers & event loader
    loadAntiCrash(client, color);
    loadEvents(client, color);


    // Log in to Discord
    await client.login(process.env.TOKEN);

    // Register Slash commands
    loadSlashCommands(client, color);
  } catch (error) {
    console.error("❌ Startup error:", error);
  }

  // Graceful shutdown
  const shutdown = async () => {
    console.log("🛑 Shutting down gracefully...".yellow);
    // Destroy Discord client
    if (client) {
      client.removeAllListeners();
      await client.destroy();
    }

    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
})();