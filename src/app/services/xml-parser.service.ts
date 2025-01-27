import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root', // Available application-wide
})

export class XmlParserService {
  /**
   * Parses an XML string and returns an XMLDocument object.
   * @param xmlString - The XML string to parse.
   * @returns The parsed XMLDocument.
   */
  static parseXml(xmlString: string): Document {
    try {
      const domParser = new DOMParser();
      const dom = domParser.parseFromString(xmlString, 'application/xml');

      // Check for parsing errors
      const parserError = document.querySelector('parsererror');
      if (parserError) {
        throw new Error(`Error parsing XML: ${parserError.textContent}`);
      }

      return dom;
    } catch (error) {
      console.error('Failed to parse XML:', error);
      throw error;
    }
  }

  /**
   * Extracts specific elements or attributes from an XMLDocument.
   * @param xmlDoc - The XMLDocument to query.
   * @param tagName - The tag name to extract.
   * @returns An array of text content for the specified tag.
   */
  static extractValues(xmlDoc: Document): any {
    console.log(xmlDoc);
    const SAML_NAMESPACE = "urn:oasis:names:tc:SAML:2.0:assertion";
    // Get Issuer
    const issuerElement = xmlDoc.getElementsByTagNameNS(SAML_NAMESPACE, "Issuer")[0];
    const issuer = issuerElement?.textContent;

    // Get NameID
    const nameIdElement = xmlDoc.getElementsByTagNameNS(SAML_NAMESPACE, "NameID")[0];
    const nameId = nameIdElement?.textContent;

    console.log("Issuer:", issuer);
    console.log("NameID:", nameId);
    
    const attributes = xmlDoc.getElementsByTagNameNS(SAML_NAMESPACE, "Attribute");
    console.log("attributes:", attributes);
  
    let roles = [];
    let roleSessionName = "";
    let sessionDuration;
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].getAttribute("Name");
      if (name === "https://aws.amazon.com/SAML/Attributes/Role") {  
        // Extract all <saml2:AttributeValue> elements within this <Attribute>
        const attributeValues = attributes[i].getElementsByTagNameNS(SAML_NAMESPACE, "AttributeValue");
        for (let j = 0; j < attributeValues.length; j++) {
          const textContent = attributeValues[j].textContent?.trim();
          if (textContent) {
            const [roleArn, providerArn] = textContent.split(",");
            roles.push({ roleArn, providerArn });
          }
        }
      } else if (name === "https://aws.amazon.com/SAML/Attributes/RoleSessionName") {
        roleSessionName = attributes[i].textContent?.trim() || "";
        console.log("RoleSessionName:", roleSessionName);

      } else if (name === "https://aws.amazon.com/SAML/Attributes/SessionDuration") {
        sessionDuration = parseInt(attributes[i].textContent?.trim() || "2600");
        console.log("SessionDuration:", sessionDuration);
      }
    }


/* 
    const elements = xmlDoc.getElementsByTagName(tagName);
    const values: string[] = [];
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].textContent) {
        values.push(elements[i].textContent.trim());
      }
    } */
    return roles;
  }
}
