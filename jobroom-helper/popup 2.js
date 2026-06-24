const statusEl = document.getElementById("status");
const readButton = document.getElementById("read");
const pasteButton = document.getElementById("paste");
const versionEl = document.getElementById("version");
const manifest = chrome.runtime.getManifest();
const ACTIONS = {
  read: "readLinkedInV2",
  paste: "pasteJobRoomV2",
  ping: "pingV2"
};

versionEl.textContent = `Extension v${manifest.version}`;
showStoredJob();

function storageGet(key) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(key, (result) => {
      const error = chrome.runtime.lastError;
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
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) {
    throw new Error("No active tab found.");
  }
  return tab;
}

async function ensureContentScript(tabId) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content.js"]
  });
  const ping = await chrome.tabs.sendMessage(tabId, { action: ACTIONS.ping });
  if (ping?.version) {
    versionEl.textContent = `Extension v${manifest.version} / content v${ping.version}`;
  }
}

async function run(action) {
  setBusy(true);
  try {
    const tab = await getActiveTab();
    await ensureContentScript(tab.id);
    const response = await chrome.tabs.sendMessage(tab.id, { action });
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
