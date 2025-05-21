const { version, Client, ActivityType, PresenceUpdateStatus } = require("discord.js");
const { author } = require("../../../package.json");
const moment = require("moment");
const color = require("colors");

module.exports = {
  name: "ready",
  once: false,

  async execute(client) {
    console.log("=======================================< LIMIT >=======================================".gray);
    console.log(`${color.bold.bgBlue(`[${moment().format("dddd - DD/MM/YYYY - hh:mm:ss", true)}]`)} ` + `${color.bold.green(`[READY]`)} ` + `Logging into Discord...`.yellow);
    console.table({
      "Name": client.user.tag,
      "Author": `${author}`,
      "Discord.js": `v${version}`,
      "Node.js": `${process.version}`,
      "Guilds": client.guilds.cache.size,
      "Users": client.users.cache.size,
      "Channels": client.channels.cache.size,
      "Slash Commands": client.slashCommands.size,
      "Events": client.events.size
    });
    console.log(`${color.bold.bgBlue(`[${moment().format("dddd - DD/MM/YYYY - hh:mm:ss", true)}]`)} ` + `${color.bold.green(`[READY]`)} ` + `${client.user.tag} is online!`.yellow);

    const acts = [
      {
        name: "/help",
        type: 5,    
        status: "dnd",
      },
      {
        name: `listening ${client.users.cache.size} user(s)`,
        type: 3,   
        status: "idle",
      },
      {
        name: `over ${client.guilds.cache.size} guild(s)`,
        type: 3,
        status: "idle",
      },
    ];

    const currentAct = acts[0];
    await client.user.setPresence({
      activities: [
        {
          name: currentAct.name.toString(),
          type: currentAct.type,
        },
      ],
      status: currentAct.status,
    });

    // Rotate the status every 15 seconds
    setInterval(() => {
      const currentAct = acts.shift();
      client.user.setPresence({
        activities: [
          {
            name: currentAct.name.toString(),
            type: currentAct.type,
          },
        ],
        status: currentAct.status,
      });
      acts.push(currentAct);
    }, 60000);
  },
};
