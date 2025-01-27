import { extractIssuer } from "./utils/saml-utils";

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
            if (details.requestBody) {
                try {
                    if (details.requestBody.formData && details.requestBody.formData["SAMLResponse"]) {
                        const samlResponseBase64 = details.requestBody.formData["SAMLResponse"][0];
                        const samlResponseDecoded = atob(samlResponseBase64);
                        const id = extractIssuer(samlResponseDecoded);

                        chrome.storage.local.get("providers", function (result) {
                            let providers = result['providers'] || [];
                            const existingIndex = providers.findIndex((provider: { id: string | null; }) => provider.id === id);
                    
                            if (existingIndex !== -1) {
                                providers[existingIndex] = { id: id, samlResponse: samlResponseDecoded };
                            } else {
                                providers.push({ id: id, samlResponse: samlResponseDecoded });
                            }
                            chrome.storage.local.set({ providers: providers });
                        });
                    } 
                    else if (details.requestBody.raw) {
                        const rawData = new TextDecoder("utf-8").decode(details.requestBody.raw[0].bytes);
                        const n = rawData.lastIndexOf("SAMLResponse=");
                        const n2 = rawData.lastIndexOf("&RelayState=");
                        if (n !== -1) {
                            const samlResponseBase64 = n2 !== -1
                                ? rawData.substring(n + 13, n2)
                                : rawData.substring(n + 13);

                            const samlResponseDecoded = atob(decodeURIComponent(samlResponseBase64));
                            chrome.storage.local.set({ samlResponse: samlResponseDecoded });
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
