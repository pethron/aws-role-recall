export function extractIssuer(samlResponse: string): string | null {
    const startTag = '<saml2:Issuer';
    const endTag = '</saml2:Issuer>';
  
    const startIndex = samlResponse.indexOf(startTag);
    const endIndex = samlResponse.indexOf(endTag);
  
    if (startIndex !== -1 && endIndex !== -1) {
      const contentStart = samlResponse.indexOf('>', startIndex) + 1;
      const issuer = samlResponse.substring(contentStart, endIndex).trim();
      return issuer;
    }
  
    return null;
  }

export function extractAccountInfo(responseText: string) {
    // Use a regular expression to match the content inside the div
    const regex = /<div class="saml-account-name">Account:\s*([^\(]+)\((\d+)\)<\/div>/g;
    const matches = [...responseText.matchAll(regex)];

    const accounts = matches.map((match) => {
      return {
          name: match[1].trim(), // Extract the account name
          number: match[2], // Extract the account number
      };
  });

  console.log("Extracted Accounts:", accounts);
  return accounts;
}