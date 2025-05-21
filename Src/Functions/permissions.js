function getPermissionLabel(permission) {
    switch (permission) {
      case "AddReactions":
        return "Add Reactions";
      case "Administrator":
        return "Administrator";
      case "AttachFiles":
        return "Attach files";
      case "BanMembers":
        return "Ban members";
      case "ChangeNickname":
        return "Change nickname";
      case "Connect":
        return "Connect";
      case "CreateInstantInvite":
        return "Create instant invite";
      case "CreatePrivateThreads":
        return "Create private threads";
      case "CreatePublicThreads":
        return "Create public threads";
      case "DeafenMembers":
        return "Deafen members";
      case "EmbedLinks":
        return "Embed links";
      case "KickMembers":
        return "Kick members";
      case "ManageChannels":
        return "Manage channels";
      case "ManageEmojisAndStickers":
        return "Manage emojis and stickers";
      case "ManageEvents":
        return "Manage Events";
      case "ManageGuild":
        return "Manage server";
      case "ManageMessages":
        return "Manage messages";
      case "ManageNicknames":
        return "Manage nicknames";
      case "ManageRoles":
        return "Manage roles";
      case "ManageThreads":
        return "Manage Threads";
      case "ManageWebhooks":
        return "Manage webhooks";
      case "MentionEveryone":
        return "Mention everyone";
      case "ModerateMembers":
        return "Moderate Members";
      case "MoveMembers":
        return "Move members";
      case "MuteMembers":
        return "Mute members";
      case "PrioritySpeaker":
        return "Priority speaker";
      case "ReadMessageHistory":
        return "Read message history";
      case "RequestToSpeak":
        return "Request to Speak";
      case "SendMessages":
        return "Send messages";
      case "SendMessagesInThreads":
        return "Send Messages In Threads";
      case "SendTTSMessages":
        return "Send TTS messages";
      case "Speak":
        return "Speak";
      case "Stream":
        return "Video";
      case "UseApplicationCommands":
        return "Use Application Commands";
      case "UseEmbeddedActivities":
        return "Use Embedded Activities";
      case "UseExternalEmojis":
        return "Use External Emojis";
      case "UseExternalStickers":
        return "Use External Stickers";
      case "UseVAD":
        return "Use voice activity";
      case "ViewAuditLog":
        return "View audit log";
      case "ViewChannel":
        return "View channel";
      case "ViewGuildInsights":
        return "View server insights";
      default:
        return "Unknown permission";
    }
  }
  
  const DEFAULT_BOT_PERMISSIONS = [
    "ViewChannel",
    "EmbedLinks",
    "SendMessages",
    "ReadMessageHistory",
  ];
  const DEFAULT_USER_PERMISSIONS = [
    "SendMessages",
    "ViewChannel",
    "UseApplicationCommands",
  ];
  
  module.exports = {
    getPermissionLabel,
    DEFAULT_BOT_PERMISSIONS,
    DEFAULT_USER_PERMISSIONS,
  };