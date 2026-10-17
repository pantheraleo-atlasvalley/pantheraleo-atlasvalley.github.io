# Atlas Valley Yield Lab — protocollo dimostrativo v0.1

**Stato: prototipo locale, solo simulazione. Nessun contratto on-chain, wallet, custodia, staking, validator, rendimento o transazione reale è implementato.** Le unità `DEMO` non hanno valore, non sono convertibili e non rappresentano un token.

## Obiettivo

Rendere ispezionabili le regole contabili e il flusso utente prima di scegliere una rete o un protocollo esterno. Questa versione non propone un prodotto finanziario e non stima rendimenti.

## Regole contabili

- `deposit(amount)`: accredita `amount` unità DEMO al saldo disponibile.
- `withdraw(amount)`: addebita il saldo disponibile.
- `stake(amount)`: sposta unità dal saldo disponibile al saldo in allocazione dimostrativa.
- `unstake(amount)`: sposta unità dall'allocazione dimostrativa al saldo disponibile.
- Commissioni: 0 punti base nel prototipo; nessuna commissione di rete è simulata.
- Ricompense e APY: non calcolati e non accreditati.
- Importi: interi positivi, massimo 1.000.000.000 DEMO per operazione.
- Un prelievo o un rientro superiore al relativo saldo è rifiutato.

## Registro verificabile

Il browser conserva un evento per operazione nel `localStorage`. Per ogni evento `n`, il digest è SHA-256 della codifica JSON UTF-8 canonica con chiavi ordinate e separatori compatti dei campi `sequence`, `created_at`, `kind`, `amount`, `fee`, `note` e `previous_hash`. `previous_hash` punta al digest dell'evento precedente; il primo evento usa 64 zeri. Il browser ricalcola i digest e verifica sequenza e collegamenti. Questa catena rileva modifiche che non ricalcolano correttamente gli hash, ma non è un ancoraggio pubblico né una prova indipendente: chi controlla il browser può cancellare il registro o ricalcolare l'intera catena.

## Cosa manca prima di fondi reali

1. Selezione di rete, asset, wallet e modello non-custodial.
2. Ricerca e due diligence indipendenti di protocolli, validator, rischi, liquidità, sblocco, slashing e commissioni.
3. Contratti o integrazioni con sorgenti dati verificabili, limiti e condizioni di uscita.
4. Modello di minaccia, revisione di sicurezza indipendente, monitoraggio e piano di risposta agli incidenti.
5. Revisione legale, fiscale e di conformità nelle giurisdizioni interessate.

Nessun rendimento è garantito. Staking, lending e altri strumenti possono comportare perdita del capitale, slashing, vulnerabilità, illiquidità, rischio di controparte, volatilità e commissioni.
