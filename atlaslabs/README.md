# atlas-vault-AV01.000 · v0.2.4

Atlas Valley VLT v0.2.4 è una sola app con accesso WalletConnect/Phantom e switch tra Exchange e VLT Wallet. Il backend legge SOL e token SPL/Token-2022 da Solana mainnet (RPC finalized) e i prezzi spot pubblici da OKX; non salva questi dati in un database. Il mint $ARKV fornito dall’utente su [Solscan](https://solscan.io/token/ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump) è mostrato anche a saldo zero. I token non riconosciuti sono identificati dal mint integrale. L’app non gestisce chiavi private né abilita transazioni di trading.

## Avvio su Arch Linux
Dalla radice del repository: `python3 atlaslabs/COM/start.py`; poi apri <http://127.0.0.1:8789/>. Il frontend Python usa la porta 8789 e il backend read-only la 8790. Ctrl+C arresta i servizi.

La tabella mercati usa il ticker spot pubblico OKX (`/api/v5/market/ticker`) e si aggiorna periodicamente; non richiede API key. Il client Python `COM/clients/okx_public.py` esegue solo GET pubbliche. Trading, swap, trasferimenti e staking restano preview e non inviano transazioni. Il Project ID Reown è client-side; non è una chiave privata.
