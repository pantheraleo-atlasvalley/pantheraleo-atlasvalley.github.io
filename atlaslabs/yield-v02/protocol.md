# Atlas Valley Yield Lab — v0.2

**Stato: simulazione client-side.** Il portafoglio, le unità `DEMO` e gli eventi restano nel `localStorage` del browser. Non vengono inviati ad alcun server o blockchain. `DEMO` non ha valore e non rappresenta un token.

## Regole contabili

- `deposit(amount)`: accredita unità DEMO create solo per la simulazione.
- `withdraw(amount)`: riduce il saldo disponibile nella simulazione.
- `stake(amount)`: sposta unità DEMO dal saldo disponibile al saldo allocato.
- `unstake(amount)`: sposta unità DEMO dall'allocazione al saldo disponibile.
- Le commissioni sono zero; APY e ricompense non sono calcolati né simulati.
- Gli importi sono interi positivi fino a 1.000.000.000 DEMO; movimenti oltre il saldo sono rifiutati.

## Registro hash-chain

Gli eventi vengono ordinati in una catena SHA-256. Ogni hash copre i campi `sequence`, `created_at`, `kind`, `amount`, `fee`, `note` e `previous_hash`, codificati come JSON UTF-8 con chiavi ordinate alfabeticamente e separatori compatti. Il primo evento punta a 64 zeri. Il browser ricostruisce ogni hash e controlla sequenze e collegamenti prima di abilitare nuove operazioni.

La verifica rileva modifiche al registro che non aggiornino correttamente l'intera catena. Non è una prova pubblica né un ancoraggio blockchain: il proprietario del browser può modificare o cancellare `localStorage` e ricalcolare gli hash. I dati sono specifici di quel browser e non sono sincronizzati.

## WalletConnect e limiti di autenticazione

Il percorso di login v0.2 è predisposto, ma il collegamento reale è disattivato finché non sono configurati un Project ID Reown e una rete per la sessione. La pagina non dichiara un utente autenticato, non chiede firme e non autorizza transazioni. Un'autenticazione di produzione richiede anche un servizio server-side che emetta nonce monouso, verifichi le firme e gestisca le sessioni.

## Fondi reali non supportati

Non esistono contratti, validatori o provider di rendimento selezionati. Nessun rendimento è garantito. Prima di qualunque uso reale servono due diligence dei protocolli, selezione delle reti, verifica indipendente del codice, analisi dei rischi, revisione legale e un'architettura server autenticata.
