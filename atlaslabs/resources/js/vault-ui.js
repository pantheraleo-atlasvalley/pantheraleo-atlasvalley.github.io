(() => {
  const labels = { exchange: 'Exchange', web3: 'VLT Wallet' };
  document.querySelectorAll('.nav-item').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('.view').forEach(view => view.classList.toggle('active', view.id === `view-${button.dataset.view}`));
    document.getElementById('pageTitle').textContent = labels[button.dataset.view];
  }));
  const source = document.getElementById('solBalance');
  const mirror = document.getElementById('solBalanceSecondary');
  if (source && mirror) new MutationObserver(() => { mirror.textContent = source.textContent; }).observe(source, {childList:true,subtree:true,characterData:true});
  const address = document.getElementById('walletAddress');
  const sidebarAddress = document.getElementById('walletSidebar');
  if (address && sidebarAddress) {
    const update = () => { sidebarAddress.textContent = address.textContent; sidebarAddress.title = address.textContent; };
    new MutationObserver(update).observe(address, {childList:true,characterData:true,subtree:true});
    update();
  }
})();
