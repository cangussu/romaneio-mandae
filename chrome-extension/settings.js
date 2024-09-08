document.addEventListener('DOMContentLoaded', function () {
    const settingsTab = document.getElementById('settingsTab');
    const actionsTab = document.getElementById('actionsTab');
    const actionButtons = document.querySelectorAll('.action-button');

    settingsTab.addEventListener('click', function () {
        showTab('settings');
        setActiveTab(settingsTab, actionsTab);
    });

    actionsTab.addEventListener('click', function () {
        showTab('actions');
        setActiveTab(actionsTab, settingsTab);
    });

    actionButtons.forEach(button => {
        button.addEventListener('click', function () {
            handleAction(button.id);
        });
    });
});

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.add('hidden');
    });

    const activeTab = document.getElementById(tabName);
    if (activeTab) {
        activeTab.classList.remove('hidden');
    }
}

function setActiveTab(activeButton, inactiveButton) {
    activeButton.classList.add('active-tab');
    activeButton.classList.remove('inactive-tab');
    inactiveButton.classList.add('inactive-tab');
    inactiveButton.classList.remove('active-tab');
}

async function handleAction(actionId) {
    await chrome.runtime.sendMessage({ action: actionId });
    await openSheet();
}

async function openSheet() {
    const [tab] = await chrome.tabs.query(
        { url: 'https://docs.google.com/spreadsheets/d/1CCry2AIpjy079BCq2xsgmlp81SJHsixfOf8otsSeuSE/*' }
    );

    if (tab) {
        return chrome.tabs.update(tab.id, { active: true });
    } else {
        return chrome.tabs.create({
            url: 'https://docs.google.com/spreadsheets/d/1CCry2AIpjy079BCq2xsgmlp81SJHsixfOf8otsSeuSE',
        });
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    console.log('Message received in popup:', message);
    sendResponse({ status: 'Message received in popup' });
});