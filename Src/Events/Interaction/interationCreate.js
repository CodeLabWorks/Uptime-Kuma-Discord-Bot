const { PermissionsBitField } = require("discord.js");
const {
  getPermissionLabel,
  DEFAULT_BOT_PERMISSIONS,
  DEFAULT_USER_PERMISSIONS,
} = require("../../Functions/permissions");
const { checkAndSetCooldown } = require("../../Functions/cooldown");
const settings = require("../../Settings/settings.json");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isAutocomplete()) {
      const command = client.slashCommands.get(interaction.commandName);
      if (command && typeof command.autocomplete === "function") {
        try {
          await command.autocomplete(interaction, client);
        } catch (error) {
          console.error(
            `❌ Autocomplete error in command ${command.name}:`,
            error
          );
          await interaction.respond([]);
        }
      }
      return;
    }

    // ⬇️ Normal slash command handler
    if (!interaction.isChatInputCommand()) return;

    const command = client.slashCommands.get(interaction.commandName);
    if (!command) return;

    const {
      cooldown = 15,
      devOnly = false,
      guildOnly = false,
      dmPermission = true,
      maintenanceCmd = false,
      toggleOffCmd = false,
      nsfwOnly = false,
      voiceOnly = false,
      requiredRole = false,
      memberPermissions = [],
      allowedGuilds = null,
    } = command;

    const userId = interaction.user.id;
    const guild = interaction.guild;

    if (toggleOffCmd) {
      return interaction.reply({
        content: "⚠️ This command is currently disabled.",
        flags: 64,
      });
    }

    if (maintenanceCmd && client.config?.maintenance) {
      return interaction.reply({
        content:
          "⚠️ Bot is under maintenance. This command is temporarily unavailable.",
        flags: 64,
      });
    }

    if (devOnly) {
      const devs = Array.isArray(settings?.Developer?.ids)
        ? settings.Developer.ids
        : [settings?.Developer?.ids];
      if (!devs.includes(userId)) {
        return interaction.reply({
          content:
            "❌ You do not have permission to use this developer-only command.",
          flags: 64,
        });
      }
    }

    if (guildOnly && !guild) {
      return interaction.reply({
        content: "❌ This command can only be used inside a server.",
        flags: 64,
      });
    }

    if (!dmPermission && !guild) {
      return interaction.reply({
        content: "❌ This command cannot be used in DMs.",
        flags: 64,
      });
    }

    if (allowedGuilds !== null) {
      let allowed = [];
      if (allowedGuilds === true && client.config?.Guild?.id) {
        allowed = Array.isArray(client.config.Guild.id)
          ? client.config.Guild.id
          : [client.config.Guild.id];
      } else if (Array.isArray(allowedGuilds)) {
        allowed = allowedGuilds;
      }
      if (guild && !allowed.includes(guild.id)) {
        return interaction.reply({
          content: "❌ This command is not allowed in this server.",
          flags: 64,
        });
      }
    }

    if (nsfwOnly && (!guild || !interaction.channel.nsfw)) {
      return interaction.reply({
        content: "❌ This command can only be used in NSFW channels.",
        flags: 64,
      });
    }

    if (voiceOnly && guild) {
      const member = guild.members.cache.get(userId);
      if (!member.voice.channel) {
        return interaction.reply({
          content: "❌ You need to be in a voice channel to use this command.",
          flags: 64,
        });
      }
    }

    if (requiredRole) {
      let roleIDs = [];
      if (requiredRole === true) {
        roleIDs = Array.isArray(client.config?.DefaultRoles)
          ? client.config.DefaultRoles
          : [];
      } else if (typeof requiredRole === "string") {
        roleIDs = [requiredRole];
      }
      if (guild) {
        const member = guild.members.cache.get(userId);
        if (!roleIDs.some((roleId) => member.roles.cache.has(roleId))) {
          return interaction.reply({
            content: `❌ You need one of the required roles to use this command.`,
            flags: 64,
          });
        }
      } else {
        return interaction.reply({
          content: "❌ This command requires a server context.",
          flags: 64,
        });
      }
    }

    if (guild && memberPermissions.length) {
      const member = guild.members.cache.get(userId);
      const missingPermissions = memberPermissions.filter(
        (perm) => !member.permissions.has(PermissionsBitField.Flags[perm])
      );
      if (missingPermissions.length > 0) {
        const permLabels = missingPermissions
          .map(getPermissionLabel)
          .join(", ");
        return interaction.reply({
          content: `❌ You are missing the following permissions to use this command: ${permLabels}`,
          flags: 64,
        });
      }
    }

    const timeLeft = checkAndSetCooldown(command.name, userId, cooldown);
    if (timeLeft) {
      return interaction.reply({
        content: `⏳ Please wait ${timeLeft.toFixed(1)}s before reusing the \`${
          command.name
        }\` command.`,
        flags: 64,
      });
    }

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(`❌ Error executing command ${command.name}:`, error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: "❌ There was an error while executing this command.",
          flags: 64,
        });
      }
    }
  },
};