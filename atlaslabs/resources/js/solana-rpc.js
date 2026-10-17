(() => {
  const config = window.ATLASLABS_CONFIG || {};
  const endpoint = config.solanaRpcUrl || 'https://api.mainnet-beta.solana.com';
  const tokenPrograms = [
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ];
  const arkVMint = 'ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump';
  const knownTokens = {
    [arkVMint]: ['$ARKV', 'Atlas Valley'],
    EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: ['USDC', 'USD Coin'],
    Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: ['USDT', 'Tether USD'],
    So11111111111111111111111111111111111111112: ['wSOL', 'Wrapped SOL'],
  };
  let requestId = 0;

  async function rpc(method, params) {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: ++requestId, method, params }),
      cache: 'no-store',
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(`RPC HTTP ${response.status}`);
    if (payload.error) throw new Error(payload.error.message || 'Errore RPC Solana');
    return payload.result;
  }

  function decimalString(rawAmount, decimals) {
    const raw = BigInt(rawAmount || '0').toString();
    if (!decimals) return raw;
    const padded = raw.padStart(decimals + 1, '0');
    const whole = padded.slice(0, -decimals);
    const fraction = padded.slice(-decimals).replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : whole;
  }

  async function getSolBalance(address) {
    const result = await rpc('getBalance', [address, { commitment: 'finalized' }]);
    return { lamports: result.value, slot: result.context.slot };
  }

  async function getWalletAssets(address) {
    const native = await getSolBalance(address);
    const accountsByMint = new Map();
    const warnings = [];
    const responses = await Promise.allSettled(tokenPrograms.map(programId => rpc(
      'getTokenAccountsByOwner',
      [address, { programId }, { encoding: 'jsonParsed', commitment: 'finalized' }],
    )));

    responses.forEach((response, index) => {
      if (response.status === 'rejected') {
        warnings.push(`Lettura programma token non riuscita: ${response.reason.message}`);
        return;
      }
      const result = response.value;
      native.slot = Math.max(native.slot, result.context.slot);
      for (const account of result.value) {
        const info = account.account.data.parsed.info;
        const token = info.tokenAmount;
        const raw = BigInt(token.amount || '0');
        if (raw <= 0n) continue;
        const previous = accountsByMint.get(info.mint);
        if (previous && previous.decimals !== token.decimals) {
          warnings.push(`Decimali discordanti per mint ${info.mint}.`);
          continue;
        }
        if (previous) previous.raw += raw;
        else accountsByMint.set(info.mint, {
          raw,
          decimals: token.decimals,
          tokenProgram: tokenPrograms[index],
        });
      }
    });

    if (!accountsByMint.has(arkVMint)) {
      accountsByMint.set(arkVMint, { raw: 0n, decimals: 0, tokenProgram: tokenPrograms[0] });
    }
    const tokens = [...accountsByMint.entries()].map(([mint, item]) => {
      const [symbol, name] = knownTokens[mint] || ['TOKEN', 'Token SPL'];
      return {
        mint,
        symbol,
        name,
        amount: decimalString(item.raw, item.decimals),
        decimals: item.decimals,
        tokenProgram: item.tokenProgram,
        isArkV: mint === arkVMint,
      };
    }).sort((a, b) => Number(b.isArkV) - Number(a.isArkV) || a.symbol.localeCompare(b.symbol) || a.mint.localeCompare(b.mint));

    return {
      address,
      cluster: 'mainnet-beta',
      commitment: 'finalized',
      slot: native.slot,
      fetchedAt: new Date().toISOString(),
      native: {
        symbol: 'SOL',
        name: 'Solana',
        amount: decimalString(native.lamports, 9),
        lamports: native.lamports,
      },
      tokens,
      warnings,
    };
  }

  window.AtlasSolanaRpc = Object.freeze({ rpc, getSolBalance, getWalletAssets });
})();
