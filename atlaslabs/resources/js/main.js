(() => {
  const $ = (selector) => document.querySelector(selector);
  const loginGate = $('#loginGate');
  const walletApp = $('#walletApp');
  const loginButton = $('#loginButton');
  const loginStatus = $('#loginStatus');
  let provider = null;
  let address = '';

  function setScreen(connected) {
    loginGate.hidden = connected;
    walletApp.hidden = !connected;
  }

  function short(value) {
    return `${value.slice(0, 5)}…${value.slice(-5)}`;
  }

  function showAccount(value) {
    address = value || '';
    if (!address) {
      setScreen(false);
      $('#solBalance').textContent = '—';
      $('#walletAddress').textContent = '—';
      $('#walletShort').textContent = 'Collega Phantom';
      $('#connectionBadge').textContent = 'NON COLLEGATO';
      $('#verified').innerHTML = '<span></span> In attesa di Phantom';
      $('#readStatus').textContent = 'Wallet non collegato';
      return;
    }
    setScreen(true);
    $('#connectionBadge').textContent = 'PHANTOM COLLEGATO';
    $('#walletAddress').textContent = address;
    $('#walletAddress').title = address;
    $('#walletShort').textContent = short(address);
    $('#verified').innerHTML = '<span></span> Wallet collegato';
    $('#readStatus').textContent = 'Lettura saldo mainnet…';
    refreshBalance(address);
  }

  async function openLogin() {
    provider = window.phantom?.solana;
    if (!provider?.isPhantom) {
      loginStatus.textContent = 'Phantom non rilevato. Installa o abilita l’estensione Phantom in Firefox e riprova.';
      return;
    }
    loginButton.disabled = true;
    loginStatus.textContent = 'Richiesta di connessione a Phantom…';
    try {
      const result = await provider.connect();
      const key = result.publicKey || provider.publicKey;
      if (!key) throw new Error('Phantom non ha restituito un indirizzo.');
      showAccount(key.toString());
      loginStatus.textContent = 'Phantom collegato. Nessuna firma o transazione è stata richiesta.';
    } catch (error) {
      if (error?.code === 4001) loginStatus.textContent = 'Connessione rifiutata nel wallet.';
      else loginStatus.textContent = `Connessione Phantom non riuscita: ${error.message}`;
    } finally {
      loginButton.disabled = false;
    }
  }

  async function refreshBalance(walletAddress = address) {
    if (!walletAddress) return;
    const status = $('#walletMessage');
    status.textContent = 'Lettura saldo da Solana mainnet…';
    status.classList.remove('error');
    try {
      const data = await window.AtlasSolanaRpc.getSolBalance(walletAddress);
      if (walletAddress !== address) return;
      $('#solBalance').textContent = (Number(data.lamports) / 1_000_000_000).toLocaleString('it-IT', { maximumFractionDigits: 6 });
      $('#verified').innerHTML = '<span></span> Dati letti da mainnet';
      $('#readStatus').textContent = `Saldo SOL aggiornato · slot ${data.slot}`;
      status.textContent = 'Saldo SOL aggiornato dalla rete mainnet.';
    } catch (error) {
      status.textContent = `Lettura saldo non riuscita: ${error.message}`;
      status.classList.add('error');
      $('#readStatus').textContent = 'Lettura RPC non riuscita';
    }
  }

  loginButton.addEventListener('click', openLogin);
  $('#refreshWallet').addEventListener('click', () => refreshBalance());
  $('#logoutButton').addEventListener('click', async () => {
    try { if (provider?.isConnected) await provider.disconnect(); }
    catch (error) { console.warn('Phantom disconnect failed', error); }
    showAccount('');
    loginStatus.textContent = 'Sessione terminata. Puoi accedere di nuovo quando vuoi.';
  });

  setScreen(false);
  provider = window.phantom?.solana;
  if (provider?.isPhantom) {
    provider.on('connect', (key) => showAccount(key?.toString?.() || provider.publicKey?.toString()));
    provider.on('disconnect', () => showAccount(''));
    provider.on('accountChanged', (key) => showAccount(key?.toString?.() || ''));
    if (provider.isConnected && provider.publicKey) showAccount(provider.publicKey.toString());
    else loginStatus.textContent = 'Collega Phantom per continuare.';
  } else {
    loginStatus.textContent = 'Phantom non rilevato. Puoi installare l’estensione per Firefox.';
  }
})();
