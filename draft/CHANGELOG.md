# Changelog AV01.000

Registro delle modifiche maggiori. Gli ZIP archiviati sono immutabili; se ne crea uno nuovo solo al raggiungimento di 100 modifiche maggiori.

1. Restyling iniziale e rimozione dei grafici dimostrativi.
2. Nuova interfaccia VLT con dati di mercato pubblici OKX.
3. Conversione di COM in app statica HTML/CSS/JS con letture dirette dal browser.
4. Rimozione di Reown/AppKit e del toolchain npm; il prototipo Vault usa il provider Phantom diretto.
5. Ripristinata come app attiva la versione originale Atlas Valley Yield Lab v0.2 archiviata in `atlas-yield-lab-v0.2.zip`; `/atlaslabs/` e i link della landing aprono direttamente quella pagina.
6. Sostituita la v0.2 attiva con l’interfaccia Atlas Valley Yield Lab v0.1; adattato il registro DEMO a `localStorage` per funzionare su GitHub Pages senza backend Python.
7. Rilasciata la v0.1.1: connessione Phantom, lettura live di SOL e token SPL/Token-2022, aggiornamento saldi e restyling con pannelli glass, menu luminosi e layout responsive. Nessuna firma o transazione.
8. Corretto il caricamento della v0.1.1 aggiungendo una query di versione a CSS e JavaScript, per evitare che browser con cache persistente usino gli asset della vecchia simulazione.
9. Migliorata la sezione 01: un errore Token-2022 non blocca gli altri saldi, gli errori RPC spiegano come risolvere HTTP 403/429 e si può configurare dal browser un endpoint HTTPS Solana mainnet.
10. Aggiunto un proxy backend Python per l’RPC Solana: la chiave provider resta sul server, le chiamate sono limitate alle letture del wallet e l’app seleziona il proxy automaticamente in locale. Aggiunti blueprint Render e istruzioni; nessuno ZIP è stato modificato.
11. Corretto il reindirizzamento della route `/atlaslabs/` nel proxy locale, che causava un loop e impediva l’apertura dell’app.
