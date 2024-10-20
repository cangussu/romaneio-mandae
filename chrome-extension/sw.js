var onlyOnce = false;

var baseUrls = [
  "https://example.com",
  "https://app.mandae.com.br/pedido/detalhe",
];

async function main() {
  // Register handlers
  chrome.runtime.onMessage.addListener(onMessage);
  chrome.action.onClicked.addListener(onClicked);
  chrome.webNavigation.onDOMContentLoaded.addListener(onDOMContentLoaded);

  // await createExtensionTab();
  await createOffscreen();
  console.log("Offscreen page created.");
  onlyOnce = true;
}

async function onDOMContentLoaded({ tabId, url }) {}

async function onClicked(event) {
  await start(event);
}

async function createExtensionTab() {
  const rv = await chrome.tabs.create({
    url: "settings.html",
  });
}

async function start(event) {
  const tabId = event.id;
  const tabUrl = event.url;
  const injected = await injectContentScript(tabId, tabUrl);
  if (injected) {
    chrome.tabs.sendMessage(tabId, { action: "process-os" });
  } else {
    console.log("Content script not injected.");
  }
}

async function onMessage(message, sender, sendResponse) {
  console.log("SW: onMessage from", message, sender);

  setProgress(message.action);

  switch (message.action) {
    case "process-os":
      console.log("Processing OS:", message.payload.numero);
      const cb = await chrome.storage.local.get(["config"]);
      chrome.runtime.sendMessage({
        target: "offscreen",
        action: message.action,
        payload: message.payload,
        config: cb.config,
      });
      break;
    case "saveConfig":
      console.log("Saving config:", message.config);
      chrome.storage.local.set({ config: message.config });
      break;
    case "finished":
      console.log("Finished updating romaneio");
      break;
    default:
      console.log(`Unexpected message action received: '${message.action}'.`);
      return false;
  }

  try {
    sendResponse({ value: "message processed" });
  } catch (error) {
    console.error("Error sending response:", error);
  }
}

// Create an offscreen document if it doesn't exist.
async function createOffscreen() {
  if (!onlyOnce) {
    console.log("Creating offscreen page.");
    return chrome.offscreen.createDocument({
      url: "offscreen.html",
      reasons: ["IFRAME_SCRIPTING"],
      justification: "Access Google APIs.",
    });
  } else {
    console.log("Offscreen already created, sending a message.");
    return chrome.runtime.sendMessage({
      target: "offscreen",
      name: "message",
    });
  }
}

async function injectContentScript(tabId, tabUrl) {
  if (!tabId || !tabUrl) {
    console.log(`Invalid tabId or tabUrl: ${tabId}, ${tabUrl}`);
    return false;
  }

  const canInject = baseUrls.some((baseUrl) => tabUrl.startsWith(baseUrl));
  if (!canInject) {
    return false;
  }

  console.log("SW: Injecting content script for Tab ID: ", tabId);
  const rv = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ["content-script.js"],
  });
  return true;
}

async function setProgress(action) {
  const statusIcons = {
    idle: "./images/default-icon.png",
    start: "./images/progress-1.png",
    "process-os": "./images/progress-2.png",
    "progress-ship": "./images/progress-3.png",
    finished: "./images/finished.png",
    error: "./images/error.png",
  };

  if (!statusIcons[action]) {
    return;
  }

  chrome.action.setIcon({
    path: statusIcons[action],
  });

  if (action === "finished") {
    await openSheet();
    setTimeout(() => {
      chrome.action.setIcon({
        path: statusIcons["idle"],
      });
    }, 5000);
  }
}


async function openSheet() {
  const cb = await chrome.storage.local.get(["config"]);
  const config = cb.config;
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`;
  const [tab] = await chrome.tabs.query({ url: `${url}/*` });

  if (tab) {
    return chrome.tabs.update(tab.id, { active: true });
  } else {
    return chrome.tabs.create({ url });
  }
}

console.debug("SW: Running main()");
main();
