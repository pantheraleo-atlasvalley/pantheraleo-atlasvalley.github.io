# Atlas Valley Yield Lab — note di versione v0.1.1

**Modalità attiva: connessione Phantom e lettura pubblica di saldi Solana.** L'app non invia transazioni e non richiede firme.

## Connessione e dati

- Phantom viene rilevato dal provider iniettato nel browser. La connessione chiede il permesso di leggere l'indirizzo pubblico.
- Il saldo SOL è letto con il metodo RPC `getBalance`.
- I token vengono letti con `getTokenAccountsByOwner`, usando `jsonParsed`, per il programma SPL Token e Token-2022.
- I dati vengono richiesti direttamente dal browser al nodo RPC pubblico di Solana mainnet-beta. L'indirizzo pubblico viene inviato al nodo per la richiesta dei saldi.
- Le quantità sono on-chain. Questa versione non recupera prezzi, non stima un valore in valuta e non mostra metadati token non verificati. I token sconosciuti sono identificati dal mint.
- Il mint `ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump` viene etichettato `$ARKV`; il nome deriva dalla configurazione locale e non costituisce verifica dell'autenticità del token.

## Limiti e sicurezza

- La connessione non consegna chiavi private e il codice non chiama metodi di firma o invio transazioni.
- Non sono implementati deposito, prelievo, staking o rendimenti reali. Le strategie sono informative e non attive.
- Il nodo RPC pubblico può applicare limiti, essere temporaneamente indisponibile o fornire dati con ritardo. La UI mostra gli errori di lettura e permette di aggiornare i saldi.
- Il sito non riceve l'indirizzo da un proprio backend; le richieste RPC dal browser sono necessarie per leggere la chain.

## Riferimenti tecnici

- [Phantom: stabilire una connessione](https://docs.phantom.com/solana/establishing-a-connection)
- [Solana RPC: getBalance](https://solana.com/docs/rpc/http/getbalance)
- [Solana RPC: getTokenAccountsByOwner](https://solana.com/docs/rpc/http/gettokenaccountsbyowner)
