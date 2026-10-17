# atlas-vault-AV01.000 — v0.2.4

## Stato
- Login: connessione diretta all’estensione Phantom. Il collegamento non è autenticazione server-side con firma.
- Saldo SOL e token SPL/Token-2022: lettura RPC Solana mainnet in sola lettura con commitment finalized. Le quantità e lo slot provengono dalla risposta RPC; token account multipli per lo stesso mint sono aggregati.
- ARKV: riconosciuto con il mint fornito dall’utente ([Solscan](https://solscan.io/token/ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump)); mostrato come zero quando non c’è un token account con saldo.
- Mercati: ticker spot pubblici OKX letti dal browser, senza API key.
- Swap, depositi, prelievi, staking ed esecuzione di transazioni: non implementati.
- DeFi e dApp: layout esplorativo, integrazioni da valutare.

La UI non deve essere presentata come exchange operativo né come promessa di rendimento.

Il client richiede direttamente a Solana RPC SOL nativo e saldi positivi dai programmi SPL Token e Token-2022. Per mint sconosciuti mostra il mint integrale invece di inventare simbolo o nome. La UI aggiorna automaticamente i saldi ogni 30 secondi e permette l’aggiornamento manuale. Non è presente un backend applicativo né un database.
