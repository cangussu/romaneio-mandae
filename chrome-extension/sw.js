var baseUrls = [
  'https://example.com',
  'https://app.mandae.com.br/pedido/detalhe'
];

// ---------------------------------------------------------------------------
// State manager

var onlyOnce = false;

// Define constants
const INJECT_ONLY_ONCE_KEY = 'injectOnlyOnce';

// Data structure to store variables per tab
var tabData = {};

// Function to set variables for a specific tab ID
function setTabData(tabId, key, data) {
  (tabData[tabId] = tabData[tabId] || {})[key] = data;
}

// Function to get variables for a specific tab ID
function getTabData(tabId, key) {
  return (tabData[tabId] || {})[key] || null;
}

// Function to delete variables for a specific tab ID
function deleteTabData(tabId) {
  delete tabData[tabId];
}

// ---------------------------------------------------------------------------

async function main() {
  // Register handlers
  chrome.runtime.onMessage.addListener(onMessage);
  chrome.action.onClicked.addListener(onClicked);
  chrome.webNavigation.onDOMContentLoaded.addListener(onDOMContentLoaded);

  // await createExtensionTab();
  await createOffscreen();
  console.log('Offscreen page created.');
  onlyOnce = true;
}

function genericOnClick(info) {
  switch (info.menuItemId) {
    case 'radio':
      // Radio item function
      console.log('Radio item clicked. Status:', info.checked);
      break;
    case 'checkbox':
      // Checkbox item function
      console.log('Checkbox item clicked. Status:', info.checked);
      break;
    default:
      // Standard context menu item function
      console.log('Standard context menu item clicked.');
  }
}

async function createExtensionTab() {
  const { options } = await chrome.storage.local.get('options');
  const rv = await chrome.tabs.create({
    url: 'settings.html',
    ...options
  });
}

async function onMessage(message, sender, sendResponse) {
  console.log('SW: onMessage from', message, sender);

  setProgress(message.action);

  switch (message.action) {
    case 'process-os':
      console.log('Processing OS:', message.payload.numero);
      chrome.runtime.sendMessage({
        target: 'offscreen',
        action: message.action,
        payload: message.payload
      });
      break;
    case 'start':
      const [tab] = await chrome.tabs.query({ active: true });
      await injectContentScript(tab.id, tab.url);
      chrome.runtime.sendMessage('message to popup XXXXXXXXXXXXXXXX', function (response) {
        console.log('Response from popup:', response);
      });
      break;
    default:
      console.log(`Unexpected message action received: '${message.action}'.`);
      sendResponse({ value: 'cloud not process your message' });
      return false;
  }
  sendResponse({ value: 'message processed' });
}

async function onDOMContentLoaded({ tabId, url }) {
  console.log('SW: onDOMContentLoaded for Tab ID: ', tabId);
  console.log('SW: onDOMContentLoaded for URL: ', url);
  const canInject = baseUrls.some(baseUrl => url.startsWith(baseUrl));
  if (!canInject) {
    console.log('Aborting for URL: ', url);
    return;
  }

}

async function onClicked(event) {
  // await injectContentScript(event.id, event.url);
}

// Create an offscreen document if it doesn't exist.
async function createOffscreen() {
  if (!onlyOnce) {
    console.log('Creating offscreen page.');
    return chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ["IFRAME_SCRIPTING"],
      justification: 'Access Google APIs.'
    });
  } else {
    console.log('Offscreen already created, sending a message.');
    return chrome.runtime.sendMessage({
      target: 'offscreen',
      name: 'message',
      options: {}
    });
  }
}

async function injectContentScript(tabId, tabUrl) {
  if (!tabId || !tabUrl) {
    console.log(`Invalid tabId or tabUrl: ${tabId}, ${tabUrl}`);
    return;
  }

  if (getTabData(tabId, INJECT_ONLY_ONCE_KEY)) {
    console.log('Content script already injected.');
    // Send a message to the content script so it can process the OS
    chrome.tabs.sendMessage(tabId, { action: 'process-os' });
    return;
  }

  console.log('Injecting content script for URL: ', tabUrl);

  const canInject = baseUrls.some(baseUrl => tabUrl.startsWith(baseUrl));
  if (!canInject) {
    console.log('SW: Aborting content injection for URL: ', tabUrl);
    return;
  }

  const { options } = await chrome.storage.local.get('options');
  const rv = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content-script.js'],
    ...options
  });
  const csId = rv[0].documentId;
  setTabData(tabId, 'csId', csId);
  setTabData(tabId, INJECT_ONLY_ONCE_KEY, true);

  chrome.tabs.sendMessage(tabId, { action: 'process-os' });
}

async function setProgress(status) {
  const statusIcons = {
    "idle": "./images/default-icon.png",
    "start": "./images/progress-1.png",
    "process-os": "./images/progress-2.png",
    "progress-ship": "./images/progress-3.png",
    "finished": "./images/finished.png",
    "error": "./images/error.png"
  };

  if (!statusIcons[status]) {
    console.info(`Invalid status: ${status}`);
    return;
  }

  chrome.action.setIcon({
    path: statusIcons[status]
  });
}


console.debug('SW: Running main()');
main();
