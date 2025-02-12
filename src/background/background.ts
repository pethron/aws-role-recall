import { extractIssuerFromSAML, extractRolesFromSAML, extractAccountFromHTML } from "./utils/saml-utils";

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
                        const id = extractIssuerFromSAML(samlResponseDecoded);
                        if (!id) {
                            console.error("Issuer ID not found.");
                            throw new Error("Issuer ID not found.");
                        }

                        const extractedRoles = extractRolesFromSAML(samlResponseDecoded);
                        chrome.storage.local.get("database", (data) => {
                            const database = data.database || {};
                            let existingRoles = database[id]?.roles || [];
                            // TODO: Update logic for:
                            //      samlResponse if it already exists and is between the previous validity time                            

                            let updatedRoles = extractedRoles.map((newRole) => {
                                let existingRole = existingRoles.find((r: { roleArn: string; }) => r.roleArn === newRole.roleArn);

                                if (existingRole) {
                                    return {
                                        ...existingRole,
                                        accountName: newRole.accountName || existingRole.accountName,
                                        name: newRole.name || existingRole.name
                                    };
                                } else {
                                    return newRole;
                                }
                            });

                            database[id] = {
                                ...database[id],
                                roles: updatedRoles,
                                lastRequest: {
                                    id: details.requestId,
                                    samlResponseBase64: samlResponseBase64,
                                    samlResponseDecoded: samlResponseDecoded
                                }
                            };

                            // Persist the updated database
                            chrome.storage.local.set({ database }, () => {
                                console.log(`Updated database entry for ID ${id}`);
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
        // Ignore requests made by the extension itself
        if (details.initiator?.startsWith("chrome-extension://")) {
            return;
        }

        if (details.method === "POST" && details.url.includes("https://signin.aws.amazon.com/saml")) {
            chrome.storage.local.get("database", async (data) => {
                const database = data.database || {};
                console.log("DATABASE");

                // Iterate through the database to find the corresponding ID
                for (const id in database) {
                    if (database[id].lastRequest.id === details.requestId) {
                        try {
                            const formData = new URLSearchParams();
                            formData.append("SAMLResponse", database[id].lastRequest.samlResponseBase64);

                            const response = await fetch(details.url, {
                                method: "POST",
                                headers: {
                                    ...requestHeaders, // Add captured headers
                                    "Content-Type": "application/x-www-form-urlencoded",
                                    "X-Bypass-Service-Worker": "true", // Prevent service worker loop 
                                },
                                body: formData.toString(),
                            });

                            if (response.ok) {
                                const responseText = await response.text();
                                const accounts = extractAccountFromHTML(responseText);

                                let existingRoles = database[id]?.roles || [];
                                let updatedRoles = accounts.map((account) => {
                                    let existingRole = existingRoles.find((r: { accountNumber: string; }) => r.accountNumber === account.number);

                                    if (existingRole) {
                                        return {
                                            ...existingRole,
                                            accountName: account.name
                                        };
                                    } else {
                                        return existingRole;
                                    }
                                });


                                database[id] = {
                                    ...database[id],
                                    roles: updatedRoles,
                                };

                                // Persist the updated database
                                chrome.storage.local.set({ database }, () => {
                                    console.log(`Updated entry for ID ${id} with HTML body`);
                                });
                            } else {
                                console.error("Failed to fetch response:", response.status, response.statusText);
                            }

                        } catch (err) {
                            console.error(`Failed to fetch HTML body for ID ${id}:`, err);
                        }
                    }
                }
            });
        }
    },
    { urls: ["https://signin.aws.amazon.com/saml*"] }
);