// alert('sandbox');
// eval("alert('sandbox eval');");

var googleLoaded = false;

// Set up message event handler:
window.addEventListener('message', function (event) {
    console.log('SANDBOX: it works, got message on the sandbox' + event.data);

    if (!googleLoaded) {
        // loadGoogleApi();
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


// ----------------------------------------------------------------------------

/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '382900821268-gqi3atgehj0eu77m2g3joht6adhc205k.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAqsv8Fnk176nC0DFefNI3Sb9816j1wGvk';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
    handleAuthClick();
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';
        await listMajors();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({ prompt: '' });
    }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
    }
}

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
async function listMajors() {
    let response;
    try {
        // Fetch first 10 files
        response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
            range: 'Class Data!A2:E',
        });
    } catch (err) {
        console.error(err.message);
        return;
    }
    const range = response.result;
    if (!range || !range.values || range.values.length == 0) {
        console.error('No values found.');
        return;
    }
    // Flatten to string to display
    const output = range.values.reduce(
        (str, row) => `${str}${row[0]}, ${row[4]}\n`,
        'Name, Major:\n');
    console.log(output);
}
