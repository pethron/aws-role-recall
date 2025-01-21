// Listener per confermare che il content script è eseguito
console.log("Content script caricato sulla pagina:", window.location.href);

chrome.runtime.sendMessage({ type: "DEBUG", message: "saml.js eseguito correttamente." });


// Verifica l'URL corrente
if (window.location.href.startsWith("https://signin.aws.amazon.com/saml")) {
  console.log("Pagina AWS SAML rilevata correttamente!");
} else {
  console.log("Il content script è stato eseguito su una pagina non target.");
}