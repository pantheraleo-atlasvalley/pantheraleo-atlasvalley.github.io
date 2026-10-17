const STORAGE_KEY = 'atlas-yield-lab-v0.1-ledger';
const FEE_BPS = 0;
const labels = { deposit: 'Deposito simulato', withdraw: 'Prelievo simulato', stake: 'Allocazione simulata', unstake: 'Rientro simulato' };
const notes = {
  deposit: 'Deposito simulato: DEMO creati solo nel registro locale.',
  withdraw: 'Prelievo simulato: nessuna criptovaluta trasferita.',
  stake: 'Allocazione simulata; nessun validator o protocollo esterno coinvolto.',
  unstake: "Rientro simulato dall'allocazione.",
};
const symbols = { deposit: '↓', withdraw: '↑', stake: '◈', unstake: '↙', genesis: '·' };
let state = null;

function safe(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function units(value) { return Number(value).toLocaleString('it-IT', { maximumFractionDigits: 0 }); }
function shortHash(value) { return `${value.slice(0, 10)}…${value.slice(-8)}`; }
function stamp(value) { return new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }

function canonicalEvent(event) {
  const fields = ['sequence', 'created_at', 'kind', 'amount', 'fee', 'note', 'previous_hash'];
  return Object.fromEntries(fields.sort().map((key) => [key, event[key]]));
}

async function calculateHash(event) {
  const bytes = new TextEncoder().encode(JSON.stringify(canonicalEvent(event)));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function verifyEvents(events) {
  let previous = '0'.repeat(64);
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.sequence !== index + 1 || event.previous_hash !== previous || await calculateHash(event) !== event.event_hash) return false;
    previous = event.event_hash;
  }
  return events.length > 0;
}

function ledgerState(events) {
  const balances = { available: 0, staked: 0, deposited: 0, withdrawn: 0, fees: 0 };
  for (const event of events) {
    const { amount, fee, kind } = event;
    if (kind === 'deposit') { balances.available += amount - fee; balances.deposited += amount; }
    else if (kind === 'withdraw') { balances.available -= amount; balances.withdrawn += amount; balances.fees += fee; }
    else if (kind === 'stake') { balances.available -= amount; balances.staked += amount; }
    else if (kind === 'unstake') { balances.staked -= amount; balances.available += amount; }
  }
  return balances;
}

async function newEvent(events, kind, amount, note) {
  const event = {
    sequence: events.length + 1,
    created_at: new Date().toISOString(),
    kind,
    amount,
    fee: 0,
    note,
    previous_hash: events.length ? events.at(-1).event_hash : '0'.repeat(64),
  };
  return { ...event, event_hash: await calculateHash(event) };
}

async function loadLedger() {
  let events;
  try { events = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
  catch { throw new Error('Il registro locale non è un JSON leggibile.'); }
  if (!Array.isArray(events) || !events.length) {
    events = [await newEvent([], 'genesis', 0, 'Registro demo inizializzato; nessun asset reale.')];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }
  return events;
}

async function refresh() {
  const events = await loadLedger();
  const valid = await verifyEvents(events);
  state = { mode: 'simulation', unit: 'DEMO', fee_bps: FEE_BPS, state: ledgerState(events), verified: valid, events: [...events].reverse(), total_events: events.length };
  document.querySelector('#available').textContent = units(state.state.available);
  document.querySelector('#staked').textContent = units(state.state.staked);
  document.querySelector('#fee').textContent = `${units(Math.ceil(Number(document.querySelector('#amount').value || 0) * FEE_BPS / 10000))} DEMO`;
  document.querySelector('#eventCount').textContent = `${state.total_events} eventi`;
  const badge = document.querySelector('#verified');
  badge.classList.toggle('invalid', !valid);
  badge.innerHTML = `<span></span>${valid ? 'Registro verificato' : 'Verifica non riuscita'}`;
  document.querySelector('.sync').innerHTML = `<i></i>${valid ? 'Registro aggiornato' : 'Registro da verificare'}`;
  const rows = state.events.map((event) => `<tr><td><div class="event-type"><span class="event-icon ${safe(event.kind)}">${symbols[event.kind] || '·'}</span><span>${safe(labels[event.kind] || 'Inizio registro')}</span></div></td><td class="timestamp">${stamp(event.created_at)}</td><td>${units(event.amount)} DEMO</td><td>${units(event.fee)} DEMO</td><td class="event-hash" title="${safe(event.event_hash)}">${shortHash(event.event_hash)}</td></tr>`).join('');
  document.querySelector('#ledger').innerHTML = rows || '<tr><td colspan="5" class="empty">Nessun evento nel registro.</td></tr>';
}

function currentAction() { return document.querySelector('.tab.active').dataset.action; }
function updateAction() {
  const action = currentAction();
  document.querySelector('#submitButton').innerHTML = `${labels[action].replace(' simulata', '').replace(' simulato', '')} <span>→</span>`;
  document.querySelector('#maxButton').hidden = !['withdraw', 'stake', 'unstake'].includes(action);
  document.querySelector('label[for="amount"] span').textContent = action === 'deposit' ? 'DEMO create localmente' : 'in DEMO';
  document.querySelector('#amount').max = action === 'unstake' ? state?.state.staked ?? 0 : ['withdraw', 'stake'].includes(action) ? state?.state.available ?? 0 : 1000000000;
  document.querySelector('#fee').textContent = '0 DEMO';
  document.querySelector('#formMessage').textContent = '';
  document.querySelector('#submitButton').disabled = !state?.verified;
}

document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach((item) => { item.classList.remove('active'); item.setAttribute('aria-selected', 'false'); });
  tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); updateAction();
}));
document.querySelector('#amount').addEventListener('input', () => {
  const amount = Number(document.querySelector('#amount').value || 0);
  document.querySelector('#fee').textContent = `${units(Math.ceil(amount * (state?.fee_bps || 0) / 10000))} DEMO`;
});
document.querySelector('#maxButton').addEventListener('click', () => {
  const key = currentAction() === 'unstake' ? 'staked' : 'available';
  document.querySelector('#amount').value = state?.state[key] || 0;
  document.querySelector('#amount').dispatchEvent(new Event('input'));
});
document.querySelector('#actionForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = document.querySelector('#formMessage');
  const button = document.querySelector('#submitButton');
  button.disabled = true; message.className = 'form-message'; message.textContent = 'Aggiornamento del registro locale…';
  try {
    const events = await loadLedger();
    if (!await verifyEvents(events)) throw new Error('Registro non verificato: impossibile aggiungere eventi.');
    const kind = currentAction();
    const amount = Number(document.querySelector('#amount').value);
    if (!Number.isSafeInteger(amount) || amount < 1 || amount > 1000000000) throw new Error('Inserisci un importo intero tra 1 e 1.000.000.000 DEMO.');
    const balances = ledgerState(events);
    const available = kind === 'unstake' ? balances.staked : balances.available;
    if (kind !== 'deposit' && amount > available) throw new Error(`Saldo insufficiente: ${units(available)} DEMO.`);
    events.push(await newEvent(events, kind, amount, notes[kind]));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    document.querySelector('#amount').value = '';
    await refresh(); updateAction();
    message.textContent = `Evento registrato · ${events.at(-1).event_hash.slice(0, 12)}…`;
  } catch (error) { message.className = 'form-message error'; message.textContent = error.message; }
  finally { button.disabled = !state?.verified; }
});

refresh().then(updateAction).catch((error) => {
  document.querySelector('#verified').classList.add('invalid');
  document.querySelector('#verified').innerHTML = '<span></span>Registro non disponibile';
  document.querySelector('#ledger').innerHTML = `<tr><td colspan="5" class="empty">${safe(error.message)}</td></tr>`;
});
