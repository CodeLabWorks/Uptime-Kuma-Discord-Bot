const cooldowns = new Map();

function checkAndSetCooldown(commandName, userId, cooldownSeconds) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = cooldownSeconds * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return timeLeft;
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return null;
}

module.exports = {
  checkAndSetCooldown,
};
