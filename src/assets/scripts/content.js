console.log("Content script caricato!");

// Funzione per aggiungere un listener al bottone
function addButtonListener(button) {
    if (!button) return; // Evita errori se il bottone non esiste
    console.log("Bottone trovato e listener aggiunto:", button);
  
    button.addEventListener("click", () => {
      console.log("Click sul bottone intercettato!");
      // Legge i valori degli input
      const value1 = document.querySelector("#accountId")?.value.trim() || "";
      const value2 = document.querySelector("#roleName")?.value.trim() || "";
      const value3 = document.querySelector("#displayName")?.value.trim() || "";
  
      console.log("Valori letti:", { value1, value2, value3 });
  
      // Aggiungi qui ulteriori azioni come salvare i dati o inviarli altrove
    });
  }
  
// Configura un MutationObserver per monitorare tutto il DOM
function observeDOM() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          // Cerca il bottone nei nuovi nodi aggiunti
          const button = node.querySelector?.('[data-testid="switchrole-button-switchrole"]') ||
                          (node.matches?.('[data-testid="switchrole-button-switchrole"]') ? node : null);
          if (button) {
            addButtonListener(button);
            observer.disconnect(); // Disconnetti l'osservazione se il bottone è stato trovato
          }
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true, // Include tutti i nodi discendenti
  });

  console.log("MutationObserver configurato.");
}

// Fallback con setInterval per assicurarsi che il bottone venga trovato
function fallbackCheck() {
  const intervalId = setInterval(() => {
    const button = document.querySelector('[data-testid="switchrole-button-switchrole"]');
    if (button) {
      console.log("Bottone trovato con setInterval:", button);
      addButtonListener(button);
      clearInterval(intervalId); // Ferma l'intervallo una volta trovato il bottone
    }
  }, 500); // Cerca ogni 500 ms
}

// Avvia l'osservazione del DOM e il fallback
observeDOM();
fallbackCheck();
  