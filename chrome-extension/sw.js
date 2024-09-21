import { setTabData, INJECT_ONLY_ONCE_KEY, getTabData } from './lib.js';

var onlyOnce = false;

var baseUrls = [
  'https://example.com',
  'https://app.mandae.com.br/pedido/detalhe'
];

const moduleBlock = {
};

moduleBlock.isReadyPromise = new Promise(resolve => {
  moduleBlock.isReadyResolve = resolve;
});

export default moduleBlock;

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
  const rv = await chrome.tabs.create({
    url: 'settings.html',
  });
}

async function onMessage(message, sender, sendResponse) {
  console.log('SW: onMessage from', message, sender);

  setProgress(message.action);

  switch (message.action) {
    case 'process-os':
      console.log('Processing OS:', message.payload.numero);
      const cb = await chrome.storage.local.get(['config']);
      chrome.runtime.sendMessage({
        target: 'offscreen',
        action: message.action,
        payload: message.payload,
        config: cb.config
      });
      break;
    case 'start':
      const [tab] = await chrome.tabs.query({ active: true });
      const injected = await injectContentScript(tab.id, tab.url);
      if (injected) {
        chrome.tabs.sendMessage(tab.id, { action: 'process-os' });
      } else {
        console.log('Content script not injected.');
      }
      break;
    case 'saveConfig':
      console.log('Saving config:', message.config);
      chrome.storage.local.set({ config: message.config });
      break;
    default:
      console.log(`Unexpected message action received: '${message.action}'.`);
      sendResponse({ value: 'cloud not process your message' });
      return false;
  }
  sendResponse({ value: 'message processed' });
}

async function onDOMContentLoaded({ tabId, url }) {
  // console.log('SW: onDOMContentLoaded for Tab ID: ', tabId);
  // console.log('SW: onDOMContentLoaded for URL: ', url);
  // const canInject = baseUrls.some(baseUrl => url.startsWith(baseUrl));
  // if (!canInject) {
  //   console.log('Aborting for URL: ', url);
  //   return;
  // }
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
    });
  }
}

async function injectContentScript(tabId, tabUrl) {
  if (!tabId || !tabUrl) {
    console.log(`Invalid tabId or tabUrl: ${tabId}, ${tabUrl}`);
    return false;
  }

  const canInject = baseUrls.some(baseUrl => tabUrl.startsWith(baseUrl));
  if (!canInject) {
    return false;
  }
  
  const wasInjected = getTabData(tabId, INJECT_ONLY_ONCE_KEY);
  
  if (wasInjected) {
    return true;
  }
  
  console.log('SW: Injecting content script for Tab ID: ', tabId);
  const rv = await chrome.scripting.executeScript({
    target: { tabId: tabId },
    files: ['content-script.js'],
  });
  const csId = rv[0].documentId;
  setTabData(tabId, 'csId', csId);
  setTabData(tabId, INJECT_ONLY_ONCE_KEY, true);
  return true;
}

async function setProgress(action) {
  const statusIcons = {
    "idle": "./images/default-icon.png",
    "start": "./images/progress-1.png",
    "process-os": "./images/progress-2.png",
    "progress-ship": "./images/progress-3.png",
    "finished": "./images/finished.png",
    "error": "./images/error.png"
  };

  if (!statusIcons[action]) {
    return;
  }

  chrome.action.setIcon({
    path: statusIcons[action]
  });
}


console.debug('SW: Running main()');
main();
