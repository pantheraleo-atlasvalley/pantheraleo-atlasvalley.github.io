# Atlas Valley Yield Lab — note di versione v0.1.1

**Modalità attiva: connessione Phantom e lettura pubblica di saldi Solana.** L'app non invia transazioni e non richiede firme.

## Connessione e dati

- Phantom viene rilevato dal provider iniettato nel browser. La connessione chiede il permesso di leggere l'indirizzo pubblico.
- Il saldo SOL è letto con il metodo RPC `getBalance`.
- I token vengono letti con `getTokenAccountsByOwner`, usando `jsonParsed`, per il programma SPL Token e Token-2022.
- In locale e sul servizio Atlas Valley, il browser invia le letture al proxy Python; il proxy inoltra solo `getBalance` e `getTokenAccountsByOwner` a Helius. Il provider key viene letto dal server e non viene inviato al browser. Su GitHub Pages, in assenza di un proxy configurato, resta disponibile il nodo pubblico Solana. L'indirizzo pubblico del wallet viene trasmesso al provider RPC scelto per la richiesta dei saldi.
- Le quantità sono on-chain. Questa versione non recupera prezzi, non stima un valore in valuta e non mostra metadati token non verificati. I token sconosciuti sono identificati dal mint.
- Il mint `ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump` viene etichettato `$ARKV`; il nome deriva dalla configurazione locale e non costituisce verifica dell'autenticità del token.

## Limiti e sicurezza

- La connessione non consegna chiavi private e il codice non chiama metodi di firma o invio transazioni.
- Non sono implementati deposito, prelievo, staking o rendimenti reali. Le strategie sono informative e non attive.
- Il nodo RPC può applicare limiti, essere temporaneamente indisponibile o fornire dati con ritardo. La UI distingue una lettura token parziale dagli errori totali e permette di configurare un endpoint dal browser.
- La chiave Helius deve essere configurata come variabile privata sul server o nel file locale ignorato da Git `atlaslabs/backend/.env.local`. Non inserirla in JavaScript, `config.js` o altri file pubblici. Vedi [backend/README.md](backend/README.md) per avvio e deploy.
- Il proxy limita metodi, dimensioni e frequenza delle richieste e applica CORS per gli origin previsti. CORS non è autenticazione: monitorare i consumi del provider e impostare limiti di quota.

## Riferimenti tecnici

- [Phantom: stabilire una connessione](https://docs.phantom.com/solana/establishing-a-connection)
- [Solana RPC: getBalance](https://solana.com/docs/rpc/http/getbalance)
- [Solana RPC: getTokenAccountsByOwner](https://solana.com/docs/rpc/http/gettokenaccountsbyowner)
