export type SamlProviderEntry = {
    id: string; // Unique ID (e.g., extracted from SAML response)
    accountName?: string; // Extracted name from HTML
    accountNumber?: string; // Extracted number from HTML
    roles?: Role[]; // Extracted roles from SAML response
    lastRequest?: LastSamlRequest; // Last request details    
};

export type LastSamlRequest = {	
    id: string;
    hash?: string;
    samlResponse: string;
    samlResponseDecoded: string;
}

export type Role = {
    id: string;
    name: string;
    accountNumber: string;
    accountName: string;
    arn: string;
}

export type SamlDatabase = {
    [id: string]: SamlProviderEntry;
};