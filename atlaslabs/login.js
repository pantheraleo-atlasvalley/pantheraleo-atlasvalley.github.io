(() => {
  const button = document.querySelector('#connectButton');
  const feedback = document.querySelector('#feedback');
  const label = document.querySelector('#connectLabel');
  const config = window.ATLASLABS_CONFIG || {};

  button.addEventListener('click', () => {
    if (!config.reownProjectId || !config.chain) {
      feedback.innerHTML = 'WalletConnect non è ancora attivo. Inserisci un <a href="https://cloud.reown.com" target="_blank" rel="noopener noreferrer">Project ID Reown</a> in <code>atlaslabs/config.js</code> e scegli la rete da usare per l’autenticazione.';
      feedback.classList.add('needs-setup');
      return;
    }
    feedback.textContent = 'Configurazione ricevuta. Completeremo il collegamento al provider dopo aver fissato SDK, chain e verifica server-side.';
    feedback.classList.add('needs-setup');
  });

  // Do not present a button as a working wallet login until the app has a real
  // Reown project, an explicitly selected chain, and server-verified auth.
  if (config.reownProjectId && config.chain) {
    label.textContent = 'Avvia connessione WalletConnect';
    document.querySelector('#connectState').textContent = 'PRONTO PER CONFIGURAZIONE';
  }
})();
