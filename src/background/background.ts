import { extractIssuer, extractAccountInfo } from "./utils/saml-utils";

let requestHeaders: Record<string, string> = {};

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.url.includes("https://signin.aws.amazon.com/saml") && details.method === "POST") {
            requestHeaders = {}; 
            details.requestHeaders?.forEach((header) => {
                if (header.value) {
                    requestHeaders[header.name] = header.value;
                }
            });
        }
    },
    { urls: ["https://signin.aws.amazon.com/saml*"] },
    ["requestHeaders"]
);

chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
        // Ignore requests made by the extension itself
        if (details.initiator?.startsWith("chrome-extension://")) {
            return;
        }

        if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
            console.log('DETAILS ONBEFORE:', details);
            if (details.requestBody) {
                try {
                    if (details.requestBody.formData && details.requestBody.formData["SAMLResponse"]) {
                        const samlResponseBase64 = details.requestBody.formData["SAMLResponse"][0];
                        const samlResponseDecoded = atob(samlResponseBase64);
                        const id = extractIssuer(samlResponseDecoded);
                        if (!id) {
                            console.error("Issuer ID not found.");
                            throw new Error("Issuer ID not found.");
                            
                        }

                        chrome.storage.local.get("database", (data) => {
                            const database = data.database || {};
                            // TODO: Update logic for:
                            //      1) roles if they already exist and preserve their IDs and names
                            //      2) samlResponse if it already exists and is between the previous validity time

                            database[id] = {
                                ...database[id],
                                lastRequest: {
                                    id: details.requestId,
                                    samlResponseBase64: samlResponseBase64,
                                    samlResponseDecoded: samlResponseDecoded
                                }
                            };
                        
                            // Persist the updated database
                            chrome.storage.local.set({ database }, () => {
                                console.log(`Stored SAML response for ID ${id}`);
                            });
                        });

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
                        /* const rawData = new TextDecoder("utf-8").decode(details.requestBody.raw[0].bytes);
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
                        } */
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
            chrome.storage.local.get("database", async (data) => {
                const database = data.database || {};

                console.log('DETAILS ONCOMPLETED:', details);

                // Iterate through the database to find the corresponding ID
                for (const id in database) {
                    if (database[id].samlResponse.base64) {
                        try {
                            console.log("DATABASE");
                            const formData = new URLSearchParams();
                            formData.append("SAMLResponse", database[id].samlResponse.base64); // Re-encode SAML response

                            const response = await fetch(details.url, {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: formData.toString(),
                            });

                            if (response.ok) {
                                const responseText = await response.text();
                                const info = extractAccountInfo(responseText);
                                console.log(info);
                                
                                database[id] = {
                                    ...database[id],
                                    ...info,
                                };
    
                                // Persist the updated database
                                chrome.storage.local.set({ database }, () => {
                                    console.log(`Updated entry for ID ${id} with HTML body`);
                                });
                                // chrome.storage.local.set({ responseId: id, responseBody: responseText });
                            } else {
                                console.error("Failed to fetch response:", response.status, response.statusText);
                            }

   /*                          const htmlBody = await response.text();
                            const parsedInfo = extractAccountInfo(htmlBody); // Extract additional info
 */
                            // Update the database entry
                            
                        } catch (err) {
                            console.error(`Failed to fetch HTML body for ID ${id}:`, err);
                        }
                    }
                }
            });


            chrome.storage.local.get("providers", async (result) => {
                const samlResponseDecoded = result.providers?.[0]?.samlResponse;

                if (!samlResponseDecoded) {
                    console.error("No SAML response found in storage.");
                    return;
                }

                try {
                    // Reconstruct the POST request with the original SAMLResponse
                    const formData = new URLSearchParams();
                    formData.append("SAMLResponse", btoa(samlResponseDecoded));

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