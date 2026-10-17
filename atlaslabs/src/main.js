import { createAppKit } from '@reown/appkit';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';
import { solana } from '@reown/appkit/networks';

const config = window.ATLASLABS_CONFIG || {};
const $ = (selector) => document.querySelector(selector);
const loginGate = $('#loginGate');
const walletApp = $('#walletApp');
const loginButton = $('#loginButton');
const loginStatus = $('#loginStatus');
let appKit = null;
let accountState = null;
let phantomProvider = null;

function setScreen(connected) {
  loginGate.hidden = connected;
  walletApp.hidden = !connected;
}

function short(address) {
  return `${address.slice(0, 5)}…${address.slice(-5)}`;
}

function showAccount(state = {}) {
  accountState = state;
  if (state.isConnected && state.address) {
    setScreen(true);
    $('#connectionBadge').textContent = 'COLLEGATO';
    $('#walletAddress').textContent = state.address;
    $('#walletAddress').title = state.address;
    $('#walletShort').textContent = short(state.address);
    $('#verified').innerHTML = '<span></span> Wallet collegato';
    $('#readStatus').textContent = 'Lettura saldo mainnet…';
    refreshBalance(state.address);
  } else {
    setScreen(false);
    $('#solBalance').textContent = '—';
    $('#walletAddress').textContent = '—';
    $('#walletShort').textContent = 'Collega il wallet';
    $('#connectionBadge').textContent = 'NON COLLEGATO';
    $('#verified').innerHTML = '<span></span> In attesa del wallet';
    $('#readStatus').textContent = 'Wallet non collegato';
  }
}

async function createWalletModal() {
  if (appKit) return appKit;
  if (!config.reownProjectId) throw new Error('Project ID Reown non configurato.');
  loginStatus.textContent = 'Carico WalletConnect…';
  appKit = createAppKit({
    adapters: [new SolanaAdapter()],
    networks: [solana],
    defaultNetwork: solana,
    projectId: config.reownProjectId,
    metadata: {
      name: config.appName,
      description: 'Atlas Valley Wallet login',
      url: window.location.origin,
      icons: [`${window.location.origin}/icon.svg`],
    },
    features: { analytics: false, email: false, socials: [] },
    allWallets: 'HIDE',
    featuredWalletIds: [],
  });
  appKit.subscribeAccount(showAccount);
  showAccount(appKit.getAccount());
  return appKit;
}

async function openLogin() {
  loginButton.disabled = true;
  loginStatus.textContent = 'Apro WalletConnect…';
  try {
    const modal = await createWalletModal();
    await modal.open({ view: 'Connect' });
    if (!accountState?.isConnected) loginStatus.textContent = 'Scansiona il QR code con WalletConnect.';
  } catch (error) {
    console.error('Wallet connection could not start', error);
    phantomProvider = window.phantom?.solana;
    if (phantomProvider?.isPhantom) {
      try {
        loginStatus.textContent = 'Reown non disponibile; apro Phantom…';
        const result = await phantomProvider.connect();
        const address = result.publicKey?.toString();
        if (address) {
          showAccount({ isConnected: true, address, chainId: 'solana:mainnet' });
          phantomProvider.on('disconnect', () => showAccount({ isConnected: false }));
          phantomProvider.on('accountChanged', (key) => key
            ? showAccount({ isConnected: true, address: key.toString(), chainId: 'solana:mainnet' })
            : showAccount({ isConnected: false }));
          return;
        }
      } catch (phantomError) {
        console.error('Phantom fallback failed', phantomError);
      }
    }
    loginStatus.textContent = `Wallet non avviato: ${error.message}. Controlla che il sito sia autorizzato in Reown e riprova.`;
  } finally {
    loginButton.disabled = false;
  }
}

async function refreshBalance(address = accountState?.address) {
  if (!address) return;
  const status = $('#walletMessage');
  status.textContent = 'Lettura saldo da Solana mainnet…';
  status.classList.remove('error');
  try {
    const response = await fetch(`/api/sol-balance?address=${encodeURIComponent(address)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Errore HTTP ${response.status}`);
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
  try { await appKit?.disconnect(); } catch (error) { console.warn('Wallet disconnect failed', error); }
  try { if (phantomProvider?.isConnected) await phantomProvider.disconnect(); } catch (error) { console.warn('Phantom disconnect failed', error); }
  showAccount({ isConnected: false });
  loginStatus.textContent = 'Sessione terminata. Puoi accedere di nuovo quando vuoi.';
});

setScreen(false);
createWalletModal().then((modal) => {
  showAccount(modal.getAccount());
  if (!modal.getAccount()?.isConnected) loginStatus.textContent = 'Usa il pulsante per collegare il wallet.';
}).catch((error) => {
  console.error('Wallet SDK initialization failed', error);
  loginStatus.textContent = 'WalletConnect non è riuscito a caricarsi (' + error.name + ': ' + error.message + '). Premi Logga in per riprovare.';
});
