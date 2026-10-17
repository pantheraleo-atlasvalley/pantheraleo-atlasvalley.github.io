const DEFAULT_RPC_URL = 'https://api.mainnet-beta.solana.com';
const RPC_STORAGE_KEY = 'atlas-yield-lab-rpc-url';
const TOKEN_PROGRAMS = [
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
];
const ARKV_MINT = 'ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump';
const $ = (selector) => document.querySelector(selector);
const elements = {
  walletMenu: $('#walletMenu'), walletButton: $('#walletButton'), walletButtonText: $('#walletButtonText'),
  dropdown: $('#walletDropdown'), dropdownAddress: $('#dropdownAddress'), refreshButton: $('#refreshButton'),
  disconnectButton: $('#disconnectButton'), connectButton: $('#connectButton'), connectTitle: $('#connectTitle'),
  connectDescription: $('#connectDescription'), connectMessage: $('#connectMessage'), liveStatus: $('#liveStatus'),
  portfolioDescription: $('#portfolioDescription'), solBalance: $('#solBalance'), walletAddress: $('#walletAddress'),
  explorerLink: $('#explorerLink'), assetCount: $('#assetCount'), assetList: $('#assetList'), lastUpdated: $('#lastUpdated'),
  rpcToggle: $('#rpcToggle'), rpcSettings: $('#rpcSettings'), rpcEndpoint: $('#rpcEndpoint'), rpcReset: $('#rpcReset'),
};

let provider = null;
let publicKey = null;
let requestId = 0;

function getRpcUrl() {
  try { return localStorage.getItem(RPC_STORAGE_KEY) || DEFAULT_RPC_URL; }
  catch { return DEFAULT_RPC_URL; }
}

function getProvider() {
  const phantom = window.phantom?.solana;
  if (phantom?.isPhantom) return phantom;
  if (window.solana?.isPhantom) return window.solana;
  return null;
}

function shortAddress(address) { return `${address.slice(0, 5)}…${address.slice(-5)}`; }
function safe(text) {
  return String(text).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function formatUnits(raw, decimals, maxDecimals = 6) {
  const integer = BigInt(raw || '0');
  const scale = 10n ** BigInt(decimals);
  const whole = integer / scale;
  const remainder = integer % scale;
  if (remainder === 0n || maxDecimals === 0) return whole.toLocaleString('it-IT');
  const fraction = remainder.toString().padStart(decimals, '0').slice(0, maxDecimals).replace(/0+$/, '');
  return `${whole.toLocaleString('it-IT')},${fraction}`;
}

async function rpc(method, params) {
  let response;
  try {
    response = await fetch(getRpcUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
    });
  } catch {
    throw new Error('Connessione RPC bloccata o non raggiungibile. Controlla endpoint e permessi CORS del provider.');
  }
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) {
      throw new Error(`Il nodo RPC ha rifiutato la richiesta (HTTP ${response.status}). Apri “Impostazioni RPC” e inserisci un endpoint Solana mainnet con accesso dal browser.`);
    }
    throw new Error(`Il nodo RPC ha risposto con HTTP ${response.status}. Verifica l’endpoint e riprova.`);
  }
  let data;
  try { data = await response.json(); }
  catch { throw new Error('Il provider RPC non ha restituito una risposta JSON valida.'); }
  if (data.error) throw new Error(data.error.message || 'La rete Solana ha restituito un errore RPC.');
  return data.result;
}

function setStatus(text, kind = '') {
  elements.liveStatus.className = `live-status ${kind}`.trim();
  elements.liveStatus.innerHTML = `<span></span><b>${safe(text)}</b>`;
}

function setDisconnected() {
  publicKey = null;
  elements.dropdown.hidden = true;
  elements.walletButton.setAttribute('aria-expanded', 'false');
  elements.walletButtonText.textContent = 'CONNETTI PHANTOM';
  elements.walletButton.classList.remove('connected');
  elements.dropdownAddress.textContent = 'Non connesso';
  elements.disconnectButton.hidden = true;
  elements.connectTitle.innerHTML = 'Uno sguardo chiaro<br>al tuo wallet.';
  elements.connectDescription.textContent = '✨ Collega Phantom per vedere il saldo SOL, $ARKV e gli altri token presenti. Leggiamo solo l’indirizzo pubblico: niente firme né transazioni.';
  elements.connectButton.hidden = false;
  elements.connectMessage.textContent = '';
  elements.solBalance.textContent = '—';
  elements.walletAddress.textContent = 'Indirizzo wallet in attesa';
  elements.explorerLink.hidden = true;
  elements.assetCount.textContent = '— asset';
  elements.lastUpdated.textContent = 'Dati non ancora caricati';
  elements.portfolioDescription.textContent = 'Connetti Phantom per caricare i saldi aggiornati.';
  elements.assetList.innerHTML = '<div class="empty-state"><span class="empty-orb">◎</span><b>Il portafoglio apparirà qui</b><span>Collega Phantom per leggere i token SPL.</span></div>';
  setStatus('WALLET NON CONNESSO');
}

async function connectWallet() {
  provider = getProvider();
  if (!provider) {
    elements.connectMessage.textContent = '👻 Phantom non rilevato. Installa l’estensione o apri la pagina nel browser Phantom.';
    elements.connectMessage.classList.add('warning');
    return;
  }
  elements.connectButton.disabled = true;
  elements.connectMessage.classList.remove('warning');
  elements.connectMessage.textContent = '🔐 Conferma la connessione nel popup Phantom…';
  try {
    const result = await provider.connect();
    publicKey = result.publicKey.toString();
    showConnected();
    await refreshBalances();
  } catch (error) {
    elements.connectMessage.textContent = error?.code === 4001 ? 'Connessione annullata: il wallet non è stato modificato.' : (error.message || 'Connessione non riuscita.');
  } finally {
    elements.connectButton.disabled = false;
  }
}

function showConnected() {
  if (!publicKey) return;
  elements.walletButtonText.textContent = shortAddress(publicKey);
  elements.walletButton.classList.add('connected');
  elements.dropdownAddress.textContent = publicKey;
  elements.disconnectButton.hidden = false;
  elements.connectTitle.textContent = 'Wallet collegato ✨';
  elements.connectDescription.textContent = 'Il saldo SOL e i token sono letti dalla mainnet. Le chiavi restano in Phantom e questa pagina non invia transazioni.';
  elements.connectButton.hidden = true;
  elements.connectMessage.textContent = '';
  elements.walletAddress.textContent = publicKey;
  elements.explorerLink.href = `https://solscan.io/account/${encodeURIComponent(publicKey)}`;
  elements.explorerLink.hidden = false;
  elements.portfolioDescription.textContent = 'Saldi token letti direttamente dalla rete Solana.';
  setStatus('CONNESSO · SOLANA MAINNET', 'online');
}

async function refreshBalances() {
  if (!publicKey) return;
  const owner = publicKey;
  elements.refreshButton.disabled = true;
  elements.refreshButton.classList.add('loading');
  setStatus('LETTURA MAINNET…', 'loading');
  try {
    const native = await rpc('getBalance', [owner, { commitment: 'confirmed' }]);
    if (owner !== publicKey) return;
    elements.solBalance.textContent = formatUnits(String(native.value), 9, 6);
    const tokenReads = await Promise.allSettled(TOKEN_PROGRAMS.map((programId) => rpc('getTokenAccountsByOwner', [owner, { programId }, { encoding: 'jsonParsed', commitment: 'confirmed' }])));
    if (owner !== publicKey) return;
    const tokenResults = tokenReads.filter((result) => result.status === 'fulfilled').map((result) => result.value);
    const tokenErrors = tokenReads.filter((result) => result.status === 'rejected');
    if (!tokenResults.length) {
      const message = tokenErrors[0]?.reason?.message || 'Il nodo RPC non ha restituito i token SPL.';
      elements.lastUpdated.textContent = 'Saldo SOL aggiornato · token non disponibili';
      elements.assetList.innerHTML = `<div class="empty-state error-state"><b>SOL aggiornato; token SPL non leggibili</b><span>${safe(message)}</span></div>`;
      setStatus('TOKEN SPL NON DISPONIBILI', 'error');
      return;
    }
    const tokenMap = new Map();
    for (const result of tokenResults) {
      for (const account of result.value || []) {
        const info = account.account?.data?.parsed?.info;
        const amount = info?.tokenAmount;
        if (!info?.mint || !amount || BigInt(amount.amount || '0') === 0n) continue;
        const current = tokenMap.get(info.mint) || { mint: info.mint, raw: 0n, decimals: Number(amount.decimals) };
        current.raw += BigInt(amount.amount);
        tokenMap.set(info.mint, current);
      }
    }
    const tokens = [...tokenMap.values()].sort((a, b) => a.mint === ARKV_MINT ? -1 : b.mint === ARKV_MINT ? 1 : a.mint.localeCompare(b.mint));
    renderTokens(tokens);
    const updatedAt = `Aggiornato alle ${new Intl.DateTimeFormat('it-IT', { timeStyle: 'medium' }).format(new Date())}`;
    elements.lastUpdated.textContent = tokenErrors.length ? `${updatedAt} · lettura token parziale` : updatedAt;
    setStatus(tokenErrors.length ? 'LETTURA PARZIALE' : 'DATI LIVE · MAINNET', tokenErrors.length ? 'loading' : 'online');
  } catch (error) {
    setStatus('ERRORE DI LETTURA', 'error');
    elements.lastUpdated.textContent = 'Lettura mainnet non riuscita';
    elements.assetList.innerHTML = `<div class="empty-state error-state"><b>Non riesco a leggere i saldi</b><span>${safe(error.message)}</span></div>`;
  } finally {
    elements.refreshButton.disabled = false;
    elements.refreshButton.classList.remove('loading');
  }
}

function renderTokens(tokens) {
  elements.assetCount.textContent = `${tokens.length} ${tokens.length === 1 ? 'asset' : 'asset'}`;
  if (!tokens.length) {
    elements.assetList.innerHTML = '<div class="empty-state"><span class="empty-orb">◎</span><b>Nessun token SPL con saldo</b><span>Il saldo SOL è mostrato sopra. Non risultano token SPL con quantità positiva.</span></div>';
    return;
  }
  elements.assetList.innerHTML = tokens.map((token) => {
    const isArkv = token.mint === ARKV_MINT;
    const name = isArkv ? 'Atlas Valley' : 'Token SPL';
    const symbol = isArkv ? '$ARKV' : `${token.mint.slice(0, 4)}…${token.mint.slice(-4)}`;
    const amount = formatUnits(token.raw.toString(), token.decimals, 8);
    return `<article class="asset-row"><div class="asset-icon ${isArkv ? 'arkv' : ''}">${isArkv ? 'A' : '◎'}</div><div class="asset-name"><b>${name}</b><span>${safe(symbol)} <i>·</i> ${safe(token.mint.slice(0, 8))}…${safe(token.mint.slice(-6))}</span></div><div class="asset-balance"><b>${safe(amount)}</b><span>${safe(symbol)}</span></div><a class="token-link" href="https://solscan.io/token/${encodeURIComponent(token.mint)}" target="_blank" rel="noreferrer" aria-label="Apri ${safe(symbol)} su Solscan">↗</a></article>`;
  }).join('');
}

elements.connectButton.addEventListener('click', connectWallet);
elements.walletButton.addEventListener('click', async () => {
  if (!publicKey) return connectWallet();
  const isOpen = !elements.dropdown.hidden;
  elements.dropdown.hidden = isOpen;
  elements.walletButton.setAttribute('aria-expanded', String(!isOpen));
});
elements.refreshButton.addEventListener('click', refreshBalances);
elements.rpcEndpoint.value = getRpcUrl();
elements.rpcToggle.addEventListener('click', () => {
  const open = elements.rpcSettings.hidden;
  elements.rpcSettings.hidden = !open;
  elements.rpcToggle.setAttribute('aria-expanded', String(open));
  if (open) elements.rpcEndpoint.focus();
});
elements.rpcSettings.addEventListener('submit', async (event) => {
  event.preventDefault();
  let url;
  try { url = new URL(elements.rpcEndpoint.value.trim()); }
  catch { elements.rpcEndpoint.setCustomValidity('Inserisci un URL valido.'); elements.rpcEndpoint.reportValidity(); return; }
  if (url.protocol !== 'https:') {
    elements.rpcEndpoint.setCustomValidity('Per GitHub Pages è necessario un endpoint HTTPS.');
    elements.rpcEndpoint.reportValidity();
    return;
  }
  elements.rpcEndpoint.setCustomValidity('');
  try { localStorage.setItem(RPC_STORAGE_KEY, url.href); }
  catch {
    elements.assetList.innerHTML = '<div class="empty-state error-state"><b>Impossibile salvare l’endpoint</b><span>Il browser ha bloccato l’archiviazione locale. Controlla le impostazioni di privacy del sito.</span></div>';
    return;
  }
  elements.rpcSettings.hidden = true;
  elements.rpcToggle.setAttribute('aria-expanded', 'false');
  if (publicKey) await refreshBalances();
});
elements.rpcEndpoint.addEventListener('input', () => elements.rpcEndpoint.setCustomValidity(''));
elements.rpcReset.addEventListener('click', async () => {
  try { localStorage.removeItem(RPC_STORAGE_KEY); } catch { /* use the default for this page load */ }
  elements.rpcEndpoint.value = DEFAULT_RPC_URL;
  if (publicKey) await refreshBalances();
});
elements.disconnectButton.addEventListener('click', async () => {
  try { await provider?.disconnect(); } finally {
    elements.dropdown.hidden = true;
    elements.walletButton.setAttribute('aria-expanded', 'false');
    setDisconnected();
  }
});
document.addEventListener('click', (event) => {
  if (!elements.walletMenu.contains(event.target)) {
    elements.dropdown.hidden = true;
    elements.walletButton.setAttribute('aria-expanded', 'false');
  }
});

provider = getProvider();
if (provider) {
  provider.on('connect', (key) => {
    publicKey = key?.toString?.() || provider.publicKey?.toString?.() || null;
    if (publicKey) { showConnected(); refreshBalances(); }
  });
  provider.on('disconnect', setDisconnected);
  provider.on('accountChanged', (key) => {
    publicKey = key?.toString?.() || null;
    if (publicKey) { showConnected(); refreshBalances(); }
    else setDisconnected();
  });
  if (provider.isConnected && provider.publicKey) {
    publicKey = provider.publicKey.toString();
    showConnected();
    refreshBalances();
  }
}
