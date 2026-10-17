(() => {
  const addressNode = document.getElementById('walletAddress');
  const app = document.getElementById('walletApp');
  const containers = ['assetListExchange', 'assetListWallet']
    .map(id => document.getElementById(id)).filter(Boolean);
  let address = '';
  let inFlight = false;
  let lastRefresh = 0;

  function formatAmount(value) {
    const [whole = '0', fraction = ''] = String(value).split('.');
    let grouped;
    try { grouped = BigInt(whole || '0').toLocaleString('it-IT'); }
    catch { grouped = whole; }
    return fraction ? `${grouped},${fraction}` : grouped;
  }

  function assetRow(asset, native = false) {
    const row = document.createElement('div');
    row.className = 'portfolio-asset live-asset';
    const icon = document.createElement('span');
    icon.className = `asset-icon ${native ? 'sol-icon' : asset.isArkV ? 'ark-icon' : 'token-icon'}`;
    icon.textContent = native ? '◎' : asset.isArkV ? 'A' : asset.symbol === 'USDC' ? '$' : asset.symbol.slice(0, 1);
    const label = document.createElement('span');
    label.className = 'asset-label';
    const name = document.createElement('b');
    name.textContent = asset.name;
    const details = document.createElement('small');
    details.textContent = native ? 'SOL · saldo nativo' : `${asset.symbol} · ${asset.mint}`;
    label.append(name, details);
    const amount = document.createElement('strong');
    amount.textContent = `${formatAmount(asset.amount)} ${asset.symbol}`;
    row.title = native ? 'Bilancio nativo Solana letto da RPC' : `Mint: ${asset.mint}\nProgramma: ${asset.tokenProgram}`;
    row.append(icon, label, amount);
    return row;
  }

  function render(data) {
    for (const container of containers) {
      container.replaceChildren(assetRow(data.native, true));
      for (const token of data.tokens) container.append(assetRow(token));
    }
    const count = 1 + data.tokens.filter(token => Number(token.amount) > 0).length;
    for (const id of ['assetCount', 'assetCountWallet']) {
      const countNode = document.getElementById(id);
      if (countNode) countNode.textContent = String(count);
    }
    const solNodes = document.querySelectorAll('#solBalance, #solBalanceSecondary');
    solNodes.forEach(node => { node.textContent = `${formatAmount(data.native.amount)} SOL`; });
    const status = document.getElementById('walletMessage');
    const time = new Date(data.fetchedAt).toLocaleTimeString('it-IT', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    const statusText = data.warnings?.length
      ? `Saldo aggiornato · slot ${data.slot} · lettura parziale: ${data.warnings.join(' ')}`
      : `Dati Solana mainnet aggiornati alle ${time} · slot ${data.slot}.`;
    if (status) {
      status.textContent = statusText;
      status.classList.toggle('error', Boolean(data.warnings?.length));
    }
    const secondaryStatus = document.getElementById('walletStatusWallet');
    if (secondaryStatus) secondaryStatus.textContent = statusText;
    const visibleSolNodes = document.querySelectorAll('#solBalanceDisplay, #solBalanceWallet');
    visibleSolNodes.forEach(node => { node.textContent = `${formatAmount(data.native.amount)} SOL`; });
    const readStatus = document.getElementById('readStatus');
    if (readStatus) readStatus.textContent = `Mainnet · slot ${data.slot} · ${time}`;
  }

  async function refresh(force = false) {
    if (!address || app.hidden || inFlight || (!force && Date.now() - lastRefresh < 15000)) return;
    inFlight = true;
    const status = document.getElementById('walletMessage') || document.getElementById('walletStatusWallet');
    if (status) {
      status.textContent = 'Lettura SOL e token SPL da Solana mainnet…';
      status.classList.remove('error');
    }
    try {
      const data = await window.AtlasSolanaRpc.getWalletAssets(address);
      if (address !== data.address) return;
      render(data);
      lastRefresh = Date.now();
    } catch (error) {
      const message = `Lettura saldi non riuscita: ${error.message}`;
      for (const id of ['walletMessage', 'walletStatusWallet']) {
        const node = document.getElementById(id);
        if (node) { node.textContent = message; node.classList.add('error'); }
      }
    } finally { inFlight = false; }
  }

  function detectWallet() {
    if (app.hidden) { address = ''; return; }
    const next = addressNode.textContent.trim();
    if (next && next !== '—' && next !== address) {
      address = next;
      lastRefresh = 0;
      refresh(true);
    }
  }

  new MutationObserver(detectWallet).observe(app, {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['hidden']});
  document.querySelectorAll('.refresh-button').forEach(button => button.addEventListener('click', () => refresh(true)));
  window.setInterval(() => refresh(), 30000);
  detectWallet();
})();
