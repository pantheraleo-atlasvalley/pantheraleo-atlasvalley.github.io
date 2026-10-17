# Atlas Vault AV01.000 · v0.2.4

Atlas Vault è una singola app statica con accesso diretto all’estensione Phantom e passaggio tra Exchange e VLT Wallet. I file pubblicati sono `index.html` e `resources/`; non servono backend, database, servizi cloud o tool di build.

## Anteprima locale

Dalla radice del repository avvia un server statico di sviluppo:

```sh
python3 -m http.server 8789 --directory atlaslabs
```

Apri <http://127.0.0.1:8789/>. Il server Python serve solo i file; i dati vengono richiesti dal browser direttamente alle API pubbliche Solana mainnet e OKX. Per arrestarlo premi Ctrl+C.

Il saldo e i token SPL/Token-2022 sono letture RPC `finalized`. Il mint $ARKV indicato nel protocollo viene mostrato anche a saldo zero. La tabella usa i ticker spot pubblici OKX senza API key. L’app non custodisce chiavi e non invia transazioni di trading, swap, trasferimento o staking.

Il login collega Phantom nell’estensione: non richiede una firma o invia transazioni.
