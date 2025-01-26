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