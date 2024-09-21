// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC =
  "https://sheets.googleapis.com/$discovery/rest?version=v4";

// Google Sheets API authorization scope.
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

let tokenClient;
let gapiLoaded = false;
let gisLoaded = false;

// Set up message event handler:
window.addEventListener("message", async function (event) {
  console.debug(event);

  if (event.data.action === "process-os") {
    console.log("Processing OS:", event.data.payload.numero);
    await startAuth(event.data.config, event.data.payload.remessas, async () =>
      event.source.postMessage({ result: 0, action: "finished" }, event.origin)
    );
  }
});

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

/**
 * Callback after api.js is loaded.
 */
function onGapiLoaded() {
  console.log("gapiLoaded");
  gapiLoaded = true;
}

/**
 * Callback after Google Identity Services are loaded.
 */
function onGisLoaded() {
  console.log("gisLoaded");
  gisLoaded = true;
}

/**
 *  Sign in the user.
 */
async function startAuth(config, remessas, completionCallback) {
  if (!gisLoaded) {
    console.error("Google Identity Services not loaded.");
    return;
  }
  if (!gapiLoaded) {
    console.error("Google API not loaded.");
    return;
  }

  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: config.clientId,
    scope: SCOPES,
    callback: async (resp) => {
      if (resp.error !== undefined) {
        throw resp;
      }

      await gapi.load("client", async () => {
        await gapi.client.init({
          apiKey: config.apiKey,
          discoveryDocs: [DISCOVERY_DOC],
        });
        gapi.client.setToken(resp);
        await updateSheet(config.spreadsheetId, remessas);
        completionCallback();
      });
    },
  });

  if (!gapi.client || gapi.client.getToken() === null) {
    // Prompt the user to select a Google Account and ask for consent to share their data
    // when establishing a new session.
    return tokenClient.requestAccessToken({ prompt: "consent" });
  } else {
    // Skip display of account chooser and consent dialog for an existing session.
    return tokenClient.requestAccessToken({ prompt: "" });
  }
}

// Google Sheets API functions

async function updateSheet(spreadsheetId, remessas) {
  await resetRange(spreadsheetId, "identificadores");
  await resetRange(spreadsheetId, "nomes");
  await resetRange(spreadsheetId, "quantidade");

  var rastreios = remessas.map((remessa) => remessa.id);
  var nomes = remessas.map((remessa) => remessa.destinatario.nome);
  var quantidades = remessas.map((remessa) => 1);

  await updateRange(spreadsheetId, "identificadores", rastreios);
  await updateRange(spreadsheetId, "nomes", nomes);
  await updateRange(spreadsheetId, "quantidade", quantidades);
}

// Function to update a spreadsheet range.
function updateRange(spreadsheetId, range, values) {
  return gapi.client.sheets.spreadsheets.values
    .update({
      spreadsheetId: spreadsheetId,
      valueInputOption: "RAW",
      range,
      values: values.map((v) => [v]),
    })
    .then((response) => console.log(`Range ${range} updated.`))
    .catch((error) => console.error("Error updating range:", error));
}

// Function to reset a spreadsheet range (clear it)
function resetRange(spreadsheetId, range) {
  return gapi.client.sheets.spreadsheets.values
    .clear({
      spreadsheetId: spreadsheetId,
      range: range,
    })
    .then((response) => console.log(`Range ${range} cleared.`))
    .catch((error) => console.error("Error clearing range:", error));
}
