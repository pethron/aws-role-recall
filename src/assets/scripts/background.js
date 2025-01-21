chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
});

chrome.webRequest.onCompleted.addListener(
    (details) => {
      const urlParams = new URLSearchParams(details.url);
      const accountId = urlParams.get("account");
      const roleName = urlParams.get("roleName");
  
      if (accountId && roleName) {
        chrome.storage.local.get("awsSwitchRoles", (data) => {
          const roles = data.awsSwitchRoles || [];
          roles.push({ accountId, roleName, timestamp: new Date().toISOString() });
          chrome.storage.local.set({ awsSwitchRoles: roles });
        });
      }
    },

    { urls: ["https://*.signin.aws.amazon.com/switchrole*"] }
  );


chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Intercetta solo richieste POST verso l'URL target
    if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
      if (details.requestBody) {
        try {
          // Caso 1: Estrai dal formData
          if (details.requestBody.formData && details.requestBody.formData.SAMLResponse) {
            const samlResponseBase64 = details.requestBody.formData.SAMLResponse[0];
            const samlResponseDecoded = decodeBase64(samlResponseBase64);
            saveSamlResponse(samlResponseDecoded);
          }
          // Caso 2: Estrai dai dati grezzi
          else if (details.requestBody.raw) {
            const rawData = new TextDecoder("utf-8").decode(details.requestBody.raw[0].bytes);
            const n = rawData.lastIndexOf("SAMLResponse=");
            const n2 = rawData.lastIndexOf("&RelayState=");
            if (n !== -1) {
              const samlResponseBase64 = n2 !== -1
                ? rawData.substring(n + 13, n2)
                : rawData.substring(n + 13);

              const samlResponseDecoded = decodeBase64(decodeURIComponent(samlResponseBase64));
              saveSamlResponse(samlResponseDecoded);
            } else {
              console.warn("SAMLResponse non found in raw data.");
            }
          } else {
            console.warn("SAMLResponse not found.");
          }
        } catch (err) {
          console.error("Error:", err);
        }
      } else {
        console.warn("requestBody not found.");
      }
    }
  },
  { urls: ["https://signin.aws.amazon.com/saml*"] },
  ["requestBody"]
);

// Funzione per decodificare Base64
function decodeBase64(base64String) {
  try {
    return atob(base64String);
  } catch (err) {
    console.error("Decode error from Base64:", err);
    return null;
  }
}

// Funzione per salvare la SAMLResponse
function saveSamlResponse(samlResponse) {
  chrome.storage.local.set({ samlResponse });
}

