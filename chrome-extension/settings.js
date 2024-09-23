async function getConfig() {
  return {
    spreadsheetId: document.getElementById("spreadsheetId").value,
    apiKey: document.getElementById("apiKey").value,
    clientId: document.getElementById("clientId").value,
  };
}

async function saveConfig() {
  const config = {
    spreadsheetId: document.getElementById("spreadsheetId").value,
    apiKey: document.getElementById("apiKey").value,
    clientId: document.getElementById("clientId").value,
  };

  await chrome.runtime.sendMessage({
    action: "saveConfig",
    config,
  });
}

async function loadConfig() {
  const { config } = await chrome.storage.local.get(["config"]);
  if (config) {
    document.getElementById("spreadsheetId").value = config.spreadsheetId;
    document.getElementById("apiKey").value = config.apiKey;
    document.getElementById("clientId").value = config.clientId;
  }
}

function showTab(tabName) {
  const tabs = document.querySelectorAll(".tab-content");
  tabs.forEach((tab) => {
    tab.classList.add("hidden");
  });

  const activeTab = document.getElementById(tabName);
  if (activeTab) {
    activeTab.classList.remove("hidden");
  }
}

function setActiveTab(activeButton, inactiveButton) {
  activeButton.classList.add("active-tab");
  activeButton.classList.remove("inactive-tab");
  inactiveButton.classList.add("inactive-tab");
  inactiveButton.classList.remove("active-tab");
}

async function handleAction(actionId) {
  saveConfig();
  if (actionId === "saveConfig") {
    return;
  }

  await chrome.runtime.sendMessage({ action: actionId });
  await openSheet();
}

async function openSheet() {
  const config = await getConfig();
  const url = `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}`;
  const [tab] = await chrome.tabs.query({ url: `${url}/*` });

  if (tab) {
    return chrome.tabs.update(tab.id, { active: true });
  } else {
    return chrome.tabs.create({ url });
  }
}

async function init() {
  await loadConfig();
}

// -----------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  console.log("Message received in popup:", message);
  sendResponse({ status: "Message received in popup" });
});

document.addEventListener("DOMContentLoaded", function () {
  const actionButtons = document.querySelectorAll(".action-button");

  actionButtons.forEach((button) => {
    button.addEventListener("click", function () {
      handleAction(button.id);
    });
  });
});

init();
