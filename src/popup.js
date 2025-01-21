// Function to update roles in the popup
function updateRoles(samlResponse) {
  const roles = parseSAMLResponse(samlResponse);
  const roleListContainer = document.getElementById("roleListContainer");

  roleListContainer.innerHTML = "";

  // Generate a styled div for each role
  roles.forEach((value) => {
    const { roleArn, providerArn } = value;
    const accountId = roleArn.split(":")[4]; // Extract account ID
    const roleName = roleArn.split("/")[1]; // Extract role name

    // Create a div for the role
    const roleDiv = document.createElement("div");
    roleDiv.className = "role-item"; // Add a CSS class for styling
    roleDiv.textContent = `${roleName} (${accountId})`;

    // Add a click event to navigate to the AWS switch role link
    roleDiv.addEventListener("click", () => {
      const switchRoleUrl = `https://signin.aws.amazon.com/switchrole?roleName=${encodeURIComponent(
        roleName
      )}&account=${encodeURIComponent(accountId)}&displayName=${encodeURIComponent(roleName)}`;
      window.open(switchRoleUrl, "_blank");
    });

    // Append the div to the container
    roleListContainer.appendChild(roleDiv);
  });
}

// Initialize popup content
function initializePopup() {
  console.log("Popup initialized!");

  // Fetch and render roles on popup load
  chrome.storage.local.get("samlResponse", (data) => {
    if (data.samlResponse) {
      console.log("SAMLResponse found on load");
      updateRoles(data.samlResponse);
    } else {
      console.log("No SAMLResponse found on load.");
    }
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.samlResponse) {
      console.log("SAMLResponse updated:", changes.samlResponse.newValue);
      updateRoles(changes.samlResponse.newValue);
    }
  });
}

// Trigger initialization immediately
initializePopup();

// Parse the SAMLResponse XML and extract roles
function parseSAMLResponse(xmlString) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "application/xml");
  
  const SAML_NAMESPACE = "urn:oasis:names:tc:SAML:2.0:assertion";
  const attributes = xmlDoc.getElementsByTagNameNS(SAML_NAMESPACE, "Attribute");
  console.log("Attributes:", attributes);

  roles =[];
  for (let i = 0; i < attributes.length; i++) {
    const name = attributes[i].getAttribute("Name");
    if (name === "https://aws.amazon.com/SAML/Attributes/Role") {
      console.log("Found Attribute:", name);

      // Extract all <saml2:AttributeValue> elements within this <Attribute>
      const attributeValues = attributes[i].getElementsByTagNameNS(SAML_NAMESPACE, "AttributeValue");

      for (let j = 0; j < attributeValues.length; j++) {
        const [roleArn, providerArn] = attributeValues[j].textContent.trim().split(",");
        roles.push({ roleArn, providerArn });
      }
    }
  }

  return roles;
}

// Generate AWS switch role links
function generateSwitchRoleLinks(roles) {
  return roles.map(({ roleArn, providerArn }) => {
    const roleName = roleArn.split("/")[1];
    const accountId = roleArn.split(":")[4];
    const displayName = roleName.replace("-", " ");

    const switchRoleUrl = `https://signin.aws.amazon.com/switchrole?roleName=${encodeURIComponent(
      roleName
    )}&account=${encodeURIComponent(accountId)}&displayName=${encodeURIComponent(displayName)}`;

    return { accountId, roleName, displayName, url: switchRoleUrl };
  });
}