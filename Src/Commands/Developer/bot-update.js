const { SlashCommandBuilder } = require('discord.js');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

module.exports = {
  name: "bot-update",
  description: "Pull latest code and restart the bot if updates were found",
  category: "Developer",
  usage: "/bot-update",
  cooldown: 15,
  devOnly: true,
  guildOnly: false,
  requiredRole: false,
  voiceOnly: false,
  nsfwOnly: false,
  toggleOffCmd: false,
  maintenanceCmd: false,

  data: new SlashCommandBuilder()
    .setName("bot-update")
    .setDescription("Pull latest code and restart the bot if updates were found"),

  async execute(interaction, client) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const timestamp = `<t:${Math.floor(Date.now() / 1000)}:f>`;

      // Run git pull with timeout
      let gitResult;
      try {
        gitResult = await Promise.race([
          execPromise('git pull'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('git pull timeout after 5s')), 5000)
          )
        ]);
      } catch (gitErr) {
        await interaction.editReply({
          content: `❌ Git pull failed:\n\`\`\`${gitErr.message || gitErr.toString()}\`\`\``
        });
        return;
      }

      const fullOutput = (gitResult.stdout + gitResult.stderr).trim();

      if (/Already up to date\./i.test(fullOutput)) {
        await interaction.editReply({
          content: `${timestamp} ✅ No updates found from GitHub.\n\`\`\`Already up to date.\`\`\``
        });
        return;
      }

      await interaction.editReply({
        content: `${timestamp} 🔄 Updates pulled from GitHub:\n\`\`\`${fullOutput.slice(0, 1900)}\`\`\`\nChecking for package changes...`
      });

      const needsInstall = /package(?:-lock)?\.json/.test(fullOutput);

      if (needsInstall) {
        await interaction.followUp({
          content: `${timestamp} 📦 Detected changes to package files. Running \`npm install\`...`,
          ephemeral: true
        });

        try {
          await Promise.race([
            execPromise('npm install'),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('npm install timeout after 30s')), 30000)
            )
          ]);
        } catch (npmErr) {
          await interaction.followUp({
            content: `❌ NPM install failed:\n\`\`\`${npmErr.message || npmErr.toString()}\`\`\``,
            ephemeral: true
          });
          return;
        }
      }

      await interaction.followUp({
        content: `${timestamp} ♻️ Restarting the bot now...`,
        ephemeral: true
      });

      setTimeout(() => {
        restartBot(client);
      }, 1500);
    } catch (fatalError) {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: '❌ Unexpected error occurred while processing this command.',
          ephemeral: true,
        });
      }
    }
  }
};

function restartBot(client) {
  client.destroy();

  const child = spawn('node', ['index.js'], {
    detached: true,
    shell: true,
    stdio: 'ignore'
  });

  child.unref();

  setTimeout(() => {
    process.exit(0);
  }, 1500);
}
