#!/usr/bin/env python3
"""Read-only Solana mainnet RPC adapter for native SOL and SPL token balances."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from decimal import Decimal
from datetime import datetime, timezone
import json
from clients.okx_public import get_market_summary

HOST, PORT = '127.0.0.1', 8790
RPC = 'https://api.mainnet-beta.solana.com'
ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
TOKEN_PROGRAMS = (
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
)
ARKV_MINT = 'ABC64226vR9kHtjtYCDENostEbCFdtXYvY4o6Gwzpump'
KNOWN_TOKENS = {
    ARKV_MINT: ('$ARKV', 'Atlas Valley'),
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': ('USDC', 'USD Coin'),
    'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': ('USDT', 'Tether USD'),
    'So11111111111111111111111111111111111111112': ('wSOL', 'Wrapped SOL'),
}


def valid_pubkey(value):
    if not value or len(value) > 44: return False
    n = 0
    try:
        for char in value: n = n * 58 + ALPHABET.index(char)
    except ValueError:
        return False
    raw = n.to_bytes((n.bit_length() + 7) // 8, 'big')
    raw = b'\0' * (len(value) - len(value.lstrip('1'))) + raw
    return len(raw) == 32


def rpc(method, params):
    payload = json.dumps({'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params}).encode()
    request = Request(RPC, data=payload, headers={'Content-Type': 'application/json'}, method='POST')
    with urlopen(request, timeout=18) as response:
        data = json.loads(response.read())
    if 'error' in data:
        raise RuntimeError(data['error'].get('message', 'errore RPC Solana'))
    return data['result']


def decimal_string(raw_amount, decimals):
    value = Decimal(raw_amount).scaleb(-decimals)
    text = format(value, 'f')
    if '.' in text: text = text.rstrip('0').rstrip('.')
    return text or '0'


class Handler(BaseHTTPRequestHandler):
    server_version = 'AtlasVaultReadOnly/0.2.4'
    def log_message(self, fmt, *args): print('backend:', fmt % args)
    def send_json(self, status, obj):
        data = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status); self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(data)
    def do_GET(self):
        url = urlsplit(self.path)
        if url.path == '/health': return self.send_json(200, {'ok': True, 'service': 'read-only-mainnet-rpc'})
        if url.path == '/api/market-summary':
            try:
                return self.send_json(200, get_market_summary())
            except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, RuntimeError) as exc:
                return self.send_json(502, {'error': f'Feed prezzi non disponibile: {exc}'})
        if url.path not in ('/api/sol-balance', '/api/wallet-assets'):
            return self.send_json(404, {'error': 'Endpoint non trovato.'})
        address = parse_qs(url.query).get('address', [''])[0]
        if not valid_pubkey(address): return self.send_json(400, {'error': 'Indirizzo Solana non valido.'})
        try:
            native = rpc('getBalance', [address, {'commitment': 'finalized'}])
            slot = native['context']['slot']
            lamports = native['value']
            if url.path == '/api/sol-balance':
                return self.send_json(200, {'address': address, 'lamports': lamports, 'slot': slot,
                                            'cluster': 'mainnet-beta', 'commitment': 'finalized'})
            accounts_by_mint = {}
            warnings = []
            for token_program in TOKEN_PROGRAMS:
                try:
                    result = rpc('getTokenAccountsByOwner', [address, {'programId': token_program},
                                  {'encoding': 'jsonParsed', 'commitment': 'finalized'}])
                    slot = max(slot, result['context']['slot'])
                    for account in result['value']:
                        info = account['account']['data']['parsed']['info']
                        token = info['tokenAmount']
                        raw = int(token['amount'])
                        decimals = int(token['decimals'])
                        if raw <= 0: continue
                        mint = info['mint']
                        previous = accounts_by_mint.get(mint)
                        if previous and previous['decimals'] != decimals:
                            warnings.append(f'Decimali discordanti per mint {mint}.')
                            continue
                        if not previous:
                            accounts_by_mint[mint] = {'raw': raw, 'decimals': decimals, 'tokenProgram': token_program}
                        else:
                            previous['raw'] += raw
                except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, RuntimeError) as exc:
                    warnings.append(f'Lettura di un programma token non riuscita: {exc}')
            if ARKV_MINT not in accounts_by_mint:
                accounts_by_mint[ARKV_MINT] = {'raw': 0, 'decimals': 0, 'tokenProgram': TOKEN_PROGRAMS[0]}
            tokens = []
            for mint, item in accounts_by_mint.items():
                symbol, name = KNOWN_TOKENS.get(mint, ('TOKEN', 'Token SPL'))
                tokens.append({'mint': mint, 'symbol': symbol, 'name': name,
                               'amount': decimal_string(item['raw'], item['decimals']),
                               'decimals': item['decimals'], 'tokenProgram': item['tokenProgram'],
                               'isArkV': mint == ARKV_MINT})
            tokens.sort(key=lambda token: (not token['isArkV'], token['symbol'], token['mint']))
            sol = decimal_string(lamports, 9)
            return self.send_json(200, {'address': address, 'cluster': 'mainnet-beta', 'commitment': 'finalized',
                'slot': slot, 'fetchedAt': datetime.now(timezone.utc).isoformat(),
                'native': {'symbol': 'SOL', 'name': 'Solana', 'amount': sol, 'lamports': lamports},
                'tokens': tokens, 'warnings': warnings})
        except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, RuntimeError) as exc:
            return self.send_json(502, {'error': f'Lettura RPC non riuscita: {exc}'})
    def do_POST(self): return self.send_json(405, {'error': 'API in sola lettura; POST disabilitato.'})

if __name__ == '__main__':
    print(f'Atlas Vault v0.2.4 read-only backend su http://{HOST}:{PORT}; RPC mainnet configurato.')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
