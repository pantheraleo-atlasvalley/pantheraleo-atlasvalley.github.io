# Atlas Valley Yield Lab v0.1.1

Frontend HTML/CSS/JS pubblicato su `/atlaslabs/`, con proxy Python facoltativo per le richieste RPC. Phantom condivide solo l'indirizzo pubblico; l'app legge il saldo SOL e i token SPL/Token-2022 dalla Solana mainnet. Non chiede firme, non trasmette transazioni e non accede alle chiavi private.

In locale avviare il proxy backend seguendo [backend/README.md](backend/README.md) e aprire `http://127.0.0.1:8791/atlaslabs/`. GitHub Pages non esegue Python: per il sito pubblico occorre distribuire il proxy e configurare il suo URL in `config.js`. La chiave RPC resta nella variabile d'ambiente privata del server, mai nel frontend.

I saldi e le quantità token sono dati on-chain; i prezzi e il valore complessivo in valuta non sono calcolati. Le strategie di staking e rendimento restano in valutazione e non sono attive. Consulta [protocol.md](protocol.md) per i dettagli e i limiti.
