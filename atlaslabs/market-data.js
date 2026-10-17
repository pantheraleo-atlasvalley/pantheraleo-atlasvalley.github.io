(() => {
  const body = document.getElementById('marketTableBody');
  const updated = document.getElementById('marketUpdated');
  if (!body || !updated) return;

  const symbols = {
    'BTC-USDT': { name: 'Bitcoin', icon: '₿' },
    'ETH-USDT': { name: 'Ethereum', icon: '◆' },
    'SOL-USDT': { name: 'Solana', icon: '◎' },
    'USDC-USDT': { name: 'USD Coin', icon: '$' },
  };

  function price(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? amount.toLocaleString('en-US', { minimumFractionDigits: amount < 1 ? 4 : 2, maximumFractionDigits: amount < 1 ? 4 : 2 })
      : '—';
  }

  function volume(value) {
    const amount = Number(value);
    return Number.isFinite(amount)
      ? `${(amount / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M USDT`
      : '—';
  }

  function cell(text, className = '') {
    const node = document.createElement('td');
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function render(data) {
    const rows = [];
    for (const market of data.markets || []) {
      const meta = symbols[market.instrument];
      if (!meta) continue;
      const row = document.createElement('tr');
      const assetCell = document.createElement('td');
      const asset = document.createElement('div'); asset.className = 'market-row-asset';
      const icon = document.createElement('span'); icon.className = 'market-symbol'; icon.textContent = meta.icon;
      const labels = document.createElement('span');
      const name = document.createElement('b'); name.textContent = market.instrument;
      const subtitle = document.createElement('small'); subtitle.textContent = `${meta.name} · Spot`;
      labels.append(name, subtitle); asset.append(icon, labels); assetCell.append(asset);
      const change = Number(market.change24hPct);
      const changeClass = Number.isFinite(change) ? change >= 0 ? 'change-up' : 'change-down' : '';
      row.append(assetCell,
        cell(`${price(market.last)} USDT`),
        cell(`${Number.isFinite(change) && change > 0 ? '+' : ''}${Number.isFinite(change) ? change.toFixed(2) : '—'}%`, changeClass),
        cell(`${price(market.high24h)} USDT`),
        cell(volume(market.volume24h)),
        cell('↗'));
      rows.push(row);
    }
    body.replaceChildren(...rows);
    const time = new Date(data.fetchedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updated.textContent = `Aggiornato ${time}`;
  }

  async function refresh() {
    try {
      const response = await fetch('/api/market-summary', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      render(data);
    } catch (error) {
      const message = document.createElement('tr');
      const status = document.createElement('td'); status.colSpan = 6;
      status.className = 'market-loading market-error';
      status.textContent = `Feed prezzi non disponibile: ${error.message}`;
      message.append(status); body.replaceChildren(message);
      updated.textContent = 'Feed non disponibile';
    }
  }

  refresh();
  window.setInterval(refresh, 30_000);
})();
