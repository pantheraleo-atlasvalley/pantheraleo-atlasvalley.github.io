# Atlas Vault release setup

- Sorgente attiva unica: `../atlaslabs/`.
- Le versioni archiviate si conservano qui come ZIP; niente copie estratte delle vecchie app nella root.
- Versione attiva: `AV01.000` (base applicativa v0.2.4).
- Modifiche maggiori dall’ultima versione: **2 / 100** — (1) primo restyling e rimozione dei grafici dimostrativi; (2) nuova interfaccia VLT e tabella prezzi pubblici OKX.
- Alla modifica maggiore numero 100: creare un changelog breve, archiviare in ZIP l’intera app aggiornata in `draft/`, verificare l’archivio e solo dopo incrementare la versione, per esempio `AV01.001`.
- Non incrementare la versione prima di aver salvato e verificato l’archivio e il changelog.

Atlas Vault al momento non usa un database: i saldi sono richiesti a Solana mainnet e restano in memoria durante la sessione.

## Nota Mimic

Mimic è stato installato in ambiente isolato sotto `/tmp` e ha analizzato un HAR anonimo con il ticker pubblico OKX. `mimic learn` ha identificato la rotta; `mimic gen` non ha prodotto il file perché il generatore Claude locale è uscito con errore vuoto. Il client read-only corrente è quindi un piccolo wrapper Python scritto sul contratto pubblico documentato, senza credenziali. Mimic non è una dipendenza di runtime dell’app.
