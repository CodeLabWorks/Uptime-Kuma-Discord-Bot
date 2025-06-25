const axios = require("axios");
const fs = require("fs");
const path = require("path");

const configPath = path.resolve(__dirname, "../Database/userConfigs.json");

if (!fs.existsSync(configPath)) {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({}, null, 2));
}

function getUserConfigs(userId) {
  const data = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  return data[userId] || { panels: [], uptimeKuma: [] };
}

function saveUserConfig(userId, newConfig) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  data[userId] = newConfig;
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function deleteUserConfig(userId) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  if (data[userId]) {
    delete data[userId];
    fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  }
}

// ---- Pterodactyl Utils ----
function createPteroAPI(panelURL, apiKey) {
  return axios.create({
    baseURL: `${panelURL}/api/client`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

async function fetchServers(userId, panelIndex = 0) {
  const userData = getUserConfigs(userId);
  const config = userData.panels?.[panelIndex];
  if (!config) throw new Error("Panel config not found.");
  const api = createPteroAPI(config.panelURL, config.apiKey);
  const res = await api.get("/");
  return res.data.data.map(s => ({ id: s.attributes.identifier, name: s.attributes.name }));
}

function deleteUserPanel(userId, panelName) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  if (!data[userId]?.panels) return false;
  const idx = data[userId].panels.findIndex(c => c.name.toLowerCase() === panelName.toLowerCase());
  if (idx === -1) return false;
  data[userId].panels.splice(idx, 1);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  return true;
}

function editUserPanel(userId, panelName, updates) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  const cfg = data[userId]?.panels?.find(c => c.name.toLowerCase() === panelName.toLowerCase());
  if (!cfg) return false;
  if (updates.name !== undefined) cfg.name = updates.name;
  if (updates.panelURL !== undefined) cfg.panelURL = updates.panelURL;
  if (updates.apiKey !== undefined) cfg.apiKey = updates.apiKey;
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  return true;
}

// ---- Uptime Kuma Utils ----
function getUptimeKumaConfigs(userId) {
  return getUserConfigs(userId).uptimeKuma || [];
}

function addUptimeKumaConfig(userId, config) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  if (!data[userId]) data[userId] = { panels: [], uptimeKuma: [] };
  data[userId].uptimeKuma = data[userId].uptimeKuma || [];
  data[userId].uptimeKuma.push(config);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function deleteUptimeKumaConfig(userId, kumaName) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  if (!data[userId]?.uptimeKuma) return false;
  const idx = data[userId].uptimeKuma.findIndex(c => c.name.toLowerCase() === kumaName.toLowerCase());
  if (idx === -1) return false;
  data[userId].uptimeKuma.splice(idx, 1);
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  return true;
}

function editUptimeKumaConfig(userId, kumaName, updates) {
  const data = fs.existsSync(configPath)
    ? JSON.parse(fs.readFileSync(configPath, "utf-8"))
    : {};
  const cfg = data[userId]?.uptimeKuma?.find(c => c.name.toLowerCase() === kumaName.toLowerCase());
  if (!cfg) return false;
  if (updates.name !== undefined) cfg.name = updates.name;
  if (updates.wsURL !== undefined) cfg.wsURL = updates.wsURL;
  if (updates.username !== undefined) cfg.username = updates.username;
  if (updates.password !== undefined) cfg.password = updates.password;
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
  return true;
}

function createKumaAPI(wsURL, username, password) {
  return axios.create({
    baseURL: wsURL.replace(/\/+$/, ""),
    timeout: 5000,
    auth: { username, password },
  });
}

async function fetchMonitors(userId, kumaIndex = 0) {
  const userData = getUserConfigs(userId);
  const config = userData.uptimeKuma?.[kumaIndex];
  if (!config) throw new Error("Uptime Kuma config not found.");
  const api = createKumaAPI(config.wsURL, config.username, config.password);
  const res = await api.get("/api/monitor");
  return res.data.monitors;
}

module.exports = {
  // Pterodactyl
  getUserConfigs,
  saveUserConfig,
  deleteUserConfig,
  createPteroAPI,
  fetchServers,
  deleteUserPanel,
  editUserPanel,
  // Uptime Kuma
  getUptimeKumaConfigs,
  addUptimeKumaConfig,
  deleteUptimeKumaConfig,
  editUptimeKumaConfig,
  createKumaAPI,
  fetchMonitors,
};
