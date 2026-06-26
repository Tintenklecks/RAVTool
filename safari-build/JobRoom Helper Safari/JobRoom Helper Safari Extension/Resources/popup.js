const statusEl = document.getElementById("status");
const readButton = document.getElementById("read");
const pasteButton = document.getElementById("paste");
const versionEl = document.getElementById("version");
const jobSummaryEl = document.getElementById("jobSummary");
const storedJobLabelEl = document.getElementById("storedJobLabel");
const jobTitleEl = document.getElementById("jobTitle");
const jobCompanyEl = document.getElementById("jobCompany");
const clearDataButton = document.getElementById("clearData");
const supportedSitesLabelEl = document.getElementById("supportedSitesLabel");
const supportedSitesListEl = document.getElementById("supportedSitesList");
const languageButtons = Array.from(document.querySelectorAll("[data-language]"));
const extensionApi = globalThis.browser || globalThis.chrome;
const usesPromiseApi = Boolean(globalThis.browser);
const manifest = extensionApi.runtime.getManifest();
const SUPPORTED_LANGUAGES = ["en", "de", "fr", "it"];
const SUPPORTED_JOB_SITES = [
  { name: "LinkedIn", host: "linkedin.com" },
  { name: "jobs.ch", host: "jobs.ch" }
];
const FALLBACK_MESSAGES = {
  extName: "JobRoom Helper",
  readJob: "READ job",
  readLinkedInJob: "READ job",
  pasteJobRoom: "PASTE into Job-Room",
  clearData: "Clear data",
  storedJob: "Stored job",
  supportedWebsites: "Supported websites",
  extensionVersion: "Extension v$1",
  extensionContentVersion: "Extension v$1 / content v$2",
  noLocalJobData: "No local job data yet.",
  instructionJobSource: "1. Go to a supported job detail page.",
  instructionLinkedIn: "1. Go to a supported job detail page.",
  instructionRead: "2. Click READ job.",
  instructionJobRoom: "3. Go to the Job-Room page.",
  instructionPaste: "4. Click PASTE into Job-Room."
};
const ACTIONS = {
  read: "readJobV2",
  paste: "pasteJobRoomV2",
  ping: "pingV2"
};

let currentLanguage = "en";
let currentMessages = {};
let currentContentVersion = "";

init();

async function init() {
  const { popupLanguage } = await storageGet(["popupLanguage"]);
  currentLanguage = normalizeLanguage(popupLanguage || extensionApi.i18n?.getUILanguage?.() || "en");
  currentMessages = await loadMessages(currentLanguage);
  applyStaticLocalization();
  setVersionText();
  await showStoredJob();
}

function message(key, substitutions = []) {
  const entry = currentMessages[key];
  const template = entry?.message || extensionApi.i18n?.getMessage(key, substitutions) || FALLBACK_MESSAGES[key] || key;
  return applySubstitutions(template, substitutions, entry?.placeholders);
}

function applySubstitutions(template, substitutions, placeholders = {}) {
  let value = template;
  for (const [name, placeholder] of Object.entries(placeholders)) {
    const indexMatch = String(placeholder.content || "").match(/^\$(\d+)$/);
    if (indexMatch) {
      value = value.split(`$${name.toUpperCase()}$`).join(substitutions[Number(indexMatch[1]) - 1] || "");
    }
  }

  return substitutions.reduce((result, substitution, index) => {
    return result.split(`$${index + 1}`).join(substitution);
  }, value);
}

async function loadMessages(language) {
  try {
    const response = await fetch(extensionApi.runtime.getURL(`_locales/${language}/messages.json`));
    if (response.ok) {
      return response.json();
    }
  } catch {
    // Fall back to browser i18n/default strings below.
  }
  return {};
}

function applyStaticLocalization() {
  document.documentElement.lang = currentLanguage;
  document.title = message("extName");
  readButton.textContent = message("readJob");
  pasteButton.textContent = message("pasteJobRoom");
  clearDataButton.textContent = message("clearData");
  storedJobLabelEl.textContent = message("storedJob");
  supportedSitesLabelEl.textContent = message("supportedWebsites");
  renderSupportedJobSites();
  for (const button of languageButtons) {
    button.setAttribute("aria-pressed", String(button.dataset.language === currentLanguage));
  }
}

function renderSupportedJobSites() {
  supportedSitesListEl.replaceChildren(
    ...SUPPORTED_JOB_SITES.map((site) => {
      const item = document.createElement("li");
      const name = document.createElement("span");
      const host = document.createElement("span");

      name.className = "supported-site-name";
      host.className = "supported-site-host";
      name.textContent = site.name;
      host.textContent = site.host;

      item.append(name, host);
      return item;
    })
  );
}

function setVersionText(contentVersion = currentContentVersion) {
  currentContentVersion = contentVersion || "";
  versionEl.textContent = currentContentVersion
    ? message("extensionContentVersion", [manifest.version, currentContentVersion])
    : message("extensionVersion", [manifest.version]);
}

function normalizeLanguage(language) {
  const normalized = String(language || "en").toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(normalized) ? normalized : "en";
}

function callbackApi(namespace, method, ...args) {
  if (usesPromiseApi) {
    return extensionApi[namespace][method](...args);
  }

  return new Promise((resolve, reject) => {
    extensionApi[namespace][method](...args, (result) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

function storageGet(keys) {
  if (usesPromiseApi) {
    return extensionApi.storage.local.get(keys);
  }

  return new Promise((resolve, reject) => {
    extensionApi.storage.local.get(keys, (result) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

function storageSet(value) {
  if (usesPromiseApi) {
    return extensionApi.storage.local.set(value);
  }

  return new Promise((resolve, reject) => {
    extensionApi.storage.local.set(value, () => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

function storageRemove(key) {
  if (usesPromiseApi) {
    return extensionApi.storage.local.remove(key);
  }

  return new Promise((resolve, reject) => {
    extensionApi.storage.local.remove(key, () => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve();
    });
  });
}

async function showStoredJob() {
  try {
    const { jobData } = await storageGet(["jobData"]);
    if (jobData) {
      renderStoredJob(jobData);
      return;
    }
  } catch (error) {
    hideStoredJobSummary();
    statusEl.textContent = JSON.stringify({ ok: false, error: error.message || String(error) }, null, 2);
    return;
  }

  hideStoredJobSummary();
  statusEl.textContent = [
    message("noLocalJobData"),
    "",
    message("instructionJobSource"),
    message("instructionRead"),
    message("instructionJobRoom"),
    message("instructionPaste")
  ].join("\n");
}

function renderStoredJob(jobData) {
  jobSummaryEl.hidden = false;
  jobTitleEl.textContent = jobData.title || "";
  jobCompanyEl.textContent = jobData.company || "";
  statusEl.textContent = JSON.stringify({ ok: true, storedJob: jobData }, null, 2);
}

function hideStoredJobSummary() {
  jobSummaryEl.hidden = true;
  jobTitleEl.textContent = "";
  jobCompanyEl.textContent = "";
}

async function getActiveTab() {
  const [tab] = await callbackApi("tabs", "query", { active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }
  return tab;
}

async function ensureContentScript(tabId) {
  if (extensionApi.scripting?.executeScript) {
    await callbackApi("scripting", "executeScript", {
      target: { tabId },
      files: ["content.js"]
    });
  } else {
    await callbackApi("tabs", "executeScript", tabId, { file: "content.js" });
  }

  const ping = await callbackApi("tabs", "sendMessage", tabId, { action: ACTIONS.ping });
  if (ping?.version) {
    setVersionText(ping.version);
  }
}

async function run(action) {
  setBusy(true);
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const response = await callbackApi("tabs", "sendMessage", tab.id, { action });
    statusEl.textContent = JSON.stringify(response, null, 2);
    await showStoredJob();
  } catch (error) {
    hideStoredJobSummary();
    statusEl.textContent = JSON.stringify(
      { ok: false, error: error.message || String(error) },
      null,
      2
    );
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  readButton.disabled = isBusy;
  pasteButton.disabled = isBusy;
  clearDataButton.disabled = isBusy;
  for (const button of languageButtons) {
    button.disabled = isBusy;
  }
}

readButton.addEventListener("click", () => run(ACTIONS.read));
pasteButton.addEventListener("click", () => run(ACTIONS.paste));
clearDataButton.addEventListener("click", async () => {
  await storageRemove("jobData");
  await showStoredJob();
});

for (const button of languageButtons) {
  button.addEventListener("click", async () => {
    currentLanguage = normalizeLanguage(button.dataset.language);
    currentMessages = await loadMessages(currentLanguage);
    await storageSet({ popupLanguage: currentLanguage });
    applyStaticLocalization();
    setVersionText();
    await showStoredJob();
  });
}
