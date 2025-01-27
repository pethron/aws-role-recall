import { extractIssuer, extractAccountInfo } from "./utils/saml-utils";

let requestHeaders: Record<string, string> = {};

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.url.includes("https://signin.aws.amazon.com/saml") && details.method === "POST") {
            // Store headers for this request
            requestHeaders = {}; // Reset headers
            details.requestHeaders?.forEach((header) => {
                if (header.value) {
                    requestHeaders[header.name] = header.value;
                }
            });
            console.log("Captured Headers:", requestHeaders);
        }
    },
    { urls: ["https://signin.aws.amazon.com/saml*"] },
    ["requestHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        console.log(details.initiator, details.method, details.url);
        // Ignore requests made by the extension itself
        if (details.initiator?.startsWith("chrome-extension://")) {
            return;
        }

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

chrome.webRequest.onCompleted.addListener(
    async (details) => {
        console.log(details.initiator, details.method, details.url);
        // Ignore requests made by the extension itself
        if (details.initiator?.startsWith("chrome-extension://")) {
            return;
        }

        if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
            chrome.storage.local.get("providers", async (result) => {
                const samlResponseDecoded = result.providers?.[0]?.samlResponse;

                if (!samlResponseDecoded) {
                    console.error("No SAML response found in storage.");
                    return;
                }

                try {
                    // Reconstruct the POST request with the original SAMLResponse
                    const formData = new URLSearchParams();
                    formData.append("SAMLResponse", btoa(samlResponseDecoded)); // Encode back to Base64 if needed

                    console.log("Reconstructed Form Data:", formData.toString());

                    // Perform the fetch with captured headers
                    const response = await fetch(details.url, {
                        method: "POST",
                        headers: {
                            ...requestHeaders, // Add captured headers
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Bypass-Service-Worker": "true", // Prevent service worker loop
                        },
                        body: formData.toString(),
                    });

                    console.log("Fetched Response:", response);

                    if (response.ok) {
                        const responseText = await response.text();
                        // console.log("Fetched Response Body:", responseText);

                        // Parse and store the response if needed
                        // const id = extractIssuer(responseText);

                        const info = extractAccountInfo(responseText);
                        console.log(info);
                        
                        // chrome.storage.local.set({ responseId: id, responseBody: responseText });
                    } else {
                        console.error("Failed to fetch response:", response.status, response.statusText);
                    }
                } catch (err) {
                    console.error("Error fetching response:", err);
                }
            });
        }
    },
    { urls: ["https://signin.aws.amazon.com/saml*"] }
);

/* chrome.webRequest.onCompleted.addListener(
    async (details) => {
         if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
            chrome.storage.local.get("providers", async (result) => {
                
                const samlResponseDecoded = result.providers[0].samlResponse;
                
                if (!samlResponseDecoded) {
                    console.error("No SAML response found in storage.");
                    return;
                }

                try {
                    // Reconstruct the POST request with the original SAMLResponse
                    const formData = new URLSearchParams();
                    formData.append("SAMLResponse", btoa(samlResponseDecoded)); // Encode back to Base64 if needed
                
                    console.log(formData.toString());

                    // Perform the fetch
                    const response = await fetch(details.url, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Bypass-Service-Worker": "true",
                        },
                        body: formData.toString(),
                    });

                    console.log("Fetched Response:", response);

                    if (response.ok) {
                        const responseText = await response.text();
                        console.log("Fetched Response Body:", responseText);

                        // Parse and store the response if needed
                        const id = extractIssuer(responseText);
                        chrome.storage.local.set({ responseId: id, responseBody: responseText });
                    } else {
                        console.error("Failed to fetch response:", response.status, response.statusText);
                    }
                } catch (err) {
                    console.error("Error fetching response:", err);
                }
            });
        }
    },
    { urls: ["https://signin.aws.amazon.com/saml*"], },
    ["responseHeaders"]
); */