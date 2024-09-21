(function () {

  // make sure the event listener is not added multiple times
  if (chrome.runtime.onMessage.hasListeners()) {
    return;
  }

  // generate a random number
  const randomNumber = Math.random();
  const PROCESS_OS = "process-os";

  // DOM handlers
  window.addEventListener("message", async function (event) {
    console.debug(`content-script: got DOM event ${randomNumber}`, event.data);
  });

  chrome.runtime.onMessage.addListener(
    async (message, sender, sendResponse) => {
      console.log(
        `content-script: got background message ${randomNumber}`,
        message,
        sender
      );
      if (message.action === PROCESS_OS) {
        await processOS();
        sendResponse({ value: "processing OS..." });
      }

      sendResponse({ value: "hi from content-script" });
    }
  );

  async function processOS() {
    try {
      var osId = getOsFromUrl();
      var token = getMandaeToken();

      console.debug("content-script: OS ID:", osId);

      var response = await getOsStatus(token, osId);
      const data = await response.json();
      console.log(data);
      sendMessageToBackground(PROCESS_OS, data);
    } catch (error) {
      console.error("content-script: error:", error);
    }
  }

  function getMandaeToken() {
    var token = localStorage.getItem("ls.token");
    // Remove string quotes from token value
    token = token.replace(/['"]+/g, "");
    return token;
  }

  // This function extracts the OS ID from the URL
  // URL examples: https://app.mandae.com.br/pedido/detalhe/2302916/empacotamento
  //               https://app.mandae.com.br/pedido/detalhe/2394960/envio
  function getOsFromUrl() {
    var urlParts = new URL(window.location.href);
    var pathParts = urlParts.pathname.split("/");

    var os_id = pathParts[3];
    if (isNaN(os_id)) {
      throw new Error("Invalid OS ID");
    }

    return os_id;
  }

  async function getOsStatus(token, osId) {
    const endpoint = `https://k8s-eks.mandae.com.br/pedido-services-prd/orders/${osId}/status`;
    return fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    });
  }

  function sendMessageToBackground(action, payload) {
    const msg = {
      action,
      payload,
    };
    const rv = chrome.runtime.sendMessage(msg, (response) => {
      console.log("content-script: response from background", response);
    });
  }

  async function main() {
    console.log("content-script: Running main....");
  }

  main();
})();
