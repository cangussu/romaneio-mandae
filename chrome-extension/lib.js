// ---------------------------------------------------------------------------
// State manager

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

export {
    INJECT_ONLY_ONCE_KEY,
    setTabData,
    getTabData,
    deleteTabData
}