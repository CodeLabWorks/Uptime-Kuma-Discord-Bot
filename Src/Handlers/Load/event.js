// ./Src/Handlers/Load/event.js
const fs = require("fs");
const path = require("path");

function loadEvents(client, color) {
  const eventSummary = new Map(); // category => array of event names
  let totalEvents = 0;

  const walk = (dir) => {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filepath = path.join(dir, file);
      const stat = fs.statSync(filepath);

      if (stat.isDirectory()) {
        walk(filepath);
      } else if (file.endsWith(".js")) {
        try {
          const event = require(filepath);

          if (!event.name || typeof event.execute !== "function") {
            console.log(color.yellow(`⚠️ Invalid event file (missing name or execute): ${filepath}`));
            continue;
          }

          // Use folder name as category
          const category = path.basename(path.dirname(filepath)) || "Uncategorized";

          if (!eventSummary.has(category)) {
            eventSummary.set(category, []);
          }
          eventSummary.get(category).push(event.name);

          // Add event to client's events collection
          client.events.set(event.name, event);

          // Register event listener
          if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
          } else {
            client.on(event.name, (...args) => event.execute(...args, client));
          }

          totalEvents++;
        } catch (err) {
          console.log(color.red(`❌ Failed to load event at ${filepath}: ${err.message}`));
        }
      }
    }
  };

  walk(path.join(__dirname, "../../Events"));

  console.log("\n📊 Event Summary:");
  for (const [category, events] of eventSummary.entries()) {
    console.log(color.cyan(`  📁 ${category}: ${events.length} event(s)`));
  }
  console.log(color.green(`\n✅ Registered ${totalEvents} event(s) total.\n`));
}

module.exports = { loadEvents };
