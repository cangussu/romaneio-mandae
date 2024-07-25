// alert('sandbox');
// eval("alert('sandbox eval');");

var googleLoaded = false;

// Set up message event handler:
window.addEventListener('message', function (event) {
    console.log('SANDBOX: it works, got message on the sandbox' + event.data);

    if (!googleLoaded) {
        loadGoogleApi();
        googleLoaded = true;
    }
});

function GISCallback() {
    alert('GISCallback');
}

// Load the Google API script
function loadGoogleApi() {
    const script = document.createElement('script');
    // script.src = 'https://apis.google.com/js/api.js';
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = onGoogleLoaded;
    document.body.appendChild(script);
}

function onGoogleLoaded() {
    console.log("Google API loaded");
    // gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        clientId: '382900821268-gqi3atgehj0eu77m2g3joht6adhc205k.apps.googleusercontent.com',
        scope: 'https://www.googleapis.com/auth/drive.file'
    }).then(() => {
        // Handle successful authentication here
        // Example: List files from Google Drive
        listFiles();
    }, (error) => {
        console.error('Error initializing Google API client:', error);
    });
}

function listFiles() {
    gapi.client.drive.files.list({
        'pageSize': 10,
        'fields': 'nextPageToken, files(id, name)'
    }).then((response) => {
        console.log('Files:', response.result.files);
    });
}
