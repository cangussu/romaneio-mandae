var authTriggered = false;


// Set up message event handler:
window.addEventListener('message', async function (event) {
    console.debug(event);

    if (event.data.action === 'process-os') {
        console.log('Processing OS:', event.data.payload.numero);
        var result = await handleAuthClick(event.data.payload.remessas);
        event.source.postMessage({ result: result }, event.origin);
    }
});

// ----------------------------------------------------------------------------

/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

const SPREADSHEET_ID = '1CCry2AIpjy079BCq2xsgmlp81SJHsixfOf8otsSeuSE';
const CLIENT_ID = '382900821268-gqi3atgehj0eu77m2g3joht6adhc205k.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBfIUgoUmRdBFZ26Daeaz2Z6mh0Vc6jBKM';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';

// Google Sheets API authorization scope.
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.visibility = 'hidden';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    console.log("gapiLoaded");
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
    console.log("gisLoaded");
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
}

/**
 *  Sign in the user upon button click.
 */
async function handleAuthClick(remessas) {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('authorize_button').innerText = 'Refresh';

        await resetRange(SPREADSHEET_ID, 'identificadores');
        await resetRange(SPREADSHEET_ID, 'nomes');
        await resetRange(SPREADSHEET_ID, 'quantidade');

        var rastreios = remessas.map(remessa => remessa.id);
        var nomes = remessas.map(remessa => remessa.destinatario.nome);
        var quantidades = remessas.map(remessa => 1);

        await updateRange(SPREADSHEET_ID, 'identificadores', rastreios);
        await updateRange(SPREADSHEET_ID, 'nomes', nomes);
        await updateRange(SPREADSHEET_ID, 'quantidade', quantidades);
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        return tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        return tokenClient.requestAccessToken({ prompt: '' });
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

// Function to update a spreadsheet range.
function updateRange(spreadsheetId, range, values) {
    return gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        valueInputOption: 'RAW',
        range,
        values: values.map(v => [v]),
    }).then(response => console.log(`Range ${range} updated.`))
        .catch(error => console.error("Error updating range:", error));
}


// Function to reset a spreadsheet range (clear it)
function resetRange(spreadsheetId, range) {
    return gapi.client.sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: range,
    }).then(response => console.log(`Range ${range} cleared.`))
        .catch(error => console.error("Error clearing range:", error));
}

