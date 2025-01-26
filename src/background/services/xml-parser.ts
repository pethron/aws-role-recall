const jsdom = require("jsdom");
const { JSDOM } = jsdom;

export function parseXML(xmlString: string): void {
    //const xmlDoc = new JSDOM(xmlString);
    //console.log(xmlDoc.window.document.querySelector("p").textContent); // "Hello world"

    const dom = new JSDOM(xmlString, { contentType: "text/xml" });
    const document = dom.window.document;

    // Use querySelector to find the saml2:Issuer element
    const issuerNode = document.querySelector("saml2\\:Issuer");

    if (issuerNode) {
        console.log(issuerNode.textContent?.trim() || null);
    }
    
    /* const samlAttributes: { [key: string]: string } = {};
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
    } */
}

