"""Small read-only client for OKX's documented public spot ticker API.

Mimic inspected the anonymous HAR traffic for this public endpoint. Requests
here use OKX's documented route directly and never carry account credentials.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation
from threading import Lock
from time import monotonic
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

BASE_URL = 'https://www.okx.com/api/v5/market/ticker'
INSTRUMENTS = ('BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'USDC-USDT')
USER_AGENT = 'AtlasVault/AV01.000 (read-only public market data)'
_CACHE_SECONDS = 15
_cache_lock = Lock()
_cache_at = 0.0
_cache_value = None


def _decimal(value):
    try:
        return Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        return None


def _fetch_ticker(instrument):
    query = urlencode({'instId': instrument})
    request = Request(f'{BASE_URL}?{query}', headers={'Accept': 'application/json', 'User-Agent': USER_AGENT})
    with urlopen(request, timeout=8) as response:
        payload = json.loads(response.read())
    if payload.get('code') != '0' or not payload.get('data'):
        raise RuntimeError(payload.get('msg') or f'Risposta ticker non valida per {instrument}.')
    item = payload['data'][0]
    last, opening = _decimal(item.get('last')), _decimal(item.get('open24h'))
    change = ((last - opening) / opening * 100) if last is not None and opening else None
    return {
        'instrument': instrument,
        'last': item.get('last'),
        'change24hPct': format(change, '.4f') if change is not None else None,
        'high24h': item.get('high24h'),
        'volume24h': item.get('volCcy24h'),
        'timestamp': item.get('ts'),
    }


def get_market_summary():
    """Return cached public OKX spot tickers for the dashboard."""
    global _cache_at, _cache_value
    now = monotonic()
    with _cache_lock:
        if _cache_value is not None and now - _cache_at < _CACHE_SECONDS:
            return _cache_value

    markets, warnings = [], []
    with ThreadPoolExecutor(max_workers=len(INSTRUMENTS)) as pool:
        futures = {instrument: pool.submit(_fetch_ticker, instrument) for instrument in INSTRUMENTS}
        for instrument in INSTRUMENTS:
            try:
                markets.append(futures[instrument].result())
            except (HTTPError, URLError, TimeoutError, OSError, ValueError, KeyError, RuntimeError) as exc:
                warnings.append(f'{instrument}: {exc}')
    if not markets:
        raise RuntimeError('Feed OKX non raggiungibile. Riprova tra poco.')
    result = {
        'source': 'OKX public spot market data',
        'fetchedAt': datetime.now(timezone.utc).isoformat(),
        'markets': markets,
        'warnings': warnings,
    }
    with _cache_lock:
        _cache_value, _cache_at = result, monotonic()
    return result
