const statusEl = document.getElementById("status");
const readButton = document.getElementById("read");
const pasteButton = document.getElementById("paste");
const versionEl = document.getElementById("version");
const extensionApi = globalThis.browser || globalThis.chrome;
const usesPromiseApi = Boolean(globalThis.browser);
const manifest = extensionApi.runtime.getManifest();
const ACTIONS = {
  read: "readLinkedInV2",
  paste: "pasteJobRoomV2",
  ping: "pingV2"
};

versionEl.textContent = `Extension v${manifest.version}`;
showStoredJob();

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

function storageGet(key) {
  if (usesPromiseApi) {
    return extensionApi.storage.local.get(key);
  }

  return new Promise((resolve, reject) => {
    extensionApi.storage.local.get(key, (result) => {
      const error = extensionApi.runtime.lastError;
      if (error) {
        reject(new Error(error.message));
        return;
      }
      resolve(result);
    });
  });
}

async function showStoredJob() {
  try {
    const { jobData } = await storageGet("jobData");
    if (jobData) {
      statusEl.textContent = JSON.stringify({ ok: true, storedJob: jobData }, null, 2);
      return;
    }
  } catch (error) {
    statusEl.textContent = JSON.stringify({ ok: false, error: error.message || String(error) }, null, 2);
    return;
  }

  statusEl.textContent = [
    "No local job data yet.",
    "",
    "1. Go to the job detail page in LinkedIn.",
    "2. Click READ LinkedIn job.",
    "3. Go to the Job-Room page.",
    "4. Click PASTE into Job-Room."
  ].join("\n");
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
    versionEl.textContent = `Extension v${manifest.version} / content v${ping.version}`;
  }
}

async function run(action) {
  setBusy(true);
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const response = await callbackApi("tabs", "sendMessage", tab.id, { action });
    statusEl.textContent = JSON.stringify(response, null, 2);
  } catch (error) {
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
}

readButton.addEventListener("click", () => run(ACTIONS.read));
pasteButton.addEventListener("click", () => run(ACTIONS.paste));
