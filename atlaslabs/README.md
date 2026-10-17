# Atlas Valley Yield Lab v0.2

Percorso GitHub Pages: `/atlaslabs/`; login: `/atlaslabs/login`.

Questa versione mantiene il registro DEMO nel browser e introduce il percorso grafico di accesso wallet. **WalletConnect non è ancora live**: in `config.js` mancano il Project ID Reown e la rete selezionata. Per un login effettivo occorre inoltre un servizio server-side per nonce monouso, verifica della firma e sessione. La connessione non va presentata come autenticazione sicura finché il backend non è pronto.

La landing principale contiene il pulsante “Enter Yield Lab”. La specifica contabile e i limiti del registro sono in [protocol.md](protocol.md).
