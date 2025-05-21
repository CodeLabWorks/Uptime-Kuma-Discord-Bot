const { GatewayIntentBits, Partials ,MessageFlags } = require("discord.js");

function clientSettingsObject() {
    return {
        shards: 'auto',
        allowedMentions: {
            parse: ['users', 'roles', 'everyone'],
        },

        intents: [
            GatewayIntentBits.AutoModerationConfiguration,
            GatewayIntentBits.AutoModerationExecution,
            GatewayIntentBits.DirectMessageReactions,
            GatewayIntentBits.DirectMessageTyping,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildPresences,
            GatewayIntentBits.GuildScheduledEvents,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent
        ],

        partials: [
            Partials.Channel,
            Partials.GuildMember,
            Partials.GuildScheduledEvent,
            Partials.Message,
            Partials.Reaction,
            Partials.ThreadMember,
            Partials.User
        ],

        fetchAllMembers: false,
    };
};

module.exports = clientSettingsObject;