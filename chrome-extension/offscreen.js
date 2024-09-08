console.debug('[offscreen]: init');

// DOM message handler.
window.addEventListener('message', function (event) {
    console.log('[offscreen]: got window message', event);
});

// Extension message handler.
chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(message) {
    // Return early if this message isn't meant for the offscreen document.
    if (message.target !== 'offscreen') {
        return false;
    }

    console.debug('[offscreen]: handling message:', message);

    // Dispatch the message to an appropriate handler.
    switch (message.action) {
        case 'process-os':
            // Post the message to the sandboxed iframe.
            const origin = '*';
            document.getElementById('sandbox-frame').contentWindow.postMessage(message, origin);
            break;
        default:
            console.log(`[offscreen]: unexpected message type received: '${message.type}'.`);
            return false;
    }
};
