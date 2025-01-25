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
      const dom = domParser.parseFromString(xmlString, 'text/xml');

      // Check for parsing errors
      const parserError = document.querySelector('parsererror');
      if (parserError) {
        throw new Error(`Error parsing XML: ${parserError.textContent}`);
      }

      return document;
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
  extractValues(xmlDoc: Document): any {
    const issuer = xmlDoc.querySelector("saml2:Issuer")?.textContent;
    const nameId = xmlDoc.querySelector("saml2:NameID")?.textContent;

    console.log("issuer:", issuer);
    console.log("nameId:", nameId);
    
    const samlAttributes: { [key: string]: string } = {};
    xmlDoc.querySelectorAll("saml2:Attribute").forEach((attribute) => {
        const key = attribute.getAttribute("Name") || "";
        const value = attribute.querySelector("saml2:AttributeValue")?.textContent || "";
        samlAttributes[key] = value;
    });
    console.log("samlAttributes:", samlAttributes)

    const SAML_NAMESPACE = "urn:oasis:names:tc:SAML:2.0:assertion";
    const attributes = xmlDoc.getElementsByTagNameNS(SAML_NAMESPACE, "Attribute");
    console.log("attributes:", attributes);
  
    let roles = [];
    for (let i = 0; i < attributes.length; i++) {
      const name = attributes[i].getAttribute("Name");
      if (name === "https://aws.amazon.com/SAML/Attributes/Role") {
        console.log("Found Attribute:", name);
  
        // Extract all <saml2:AttributeValue> elements within this <Attribute>
        const attributeValues = attributes[i].getElementsByTagNameNS(SAML_NAMESPACE, "AttributeValue");
  
        for (let j = 0; j < attributeValues.length; j++) {
          const textContent = attributeValues[j].textContent?.trim();
          if (textContent) {
            const [roleArn, providerArn] = textContent.split(",");
            roles.push({ roleArn, providerArn });
          }
        }
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
