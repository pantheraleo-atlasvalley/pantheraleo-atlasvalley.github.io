#!/usr/bin/env python3
"""Read-only Solana RPC proxy and static server for Atlas Valley Yield Lab."""

from __future__ import annotations

import json
import os
import re
import threading
import time
from collections import defaultdict, deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlencode, urlsplit
from urllib.request import Request, urlopen

APP_ROOT = Path(__file__).resolve().parents[1]
LOCAL_ENV = Path(__file__).with_name(".env.local")
HELIUS_RPC = "https://mainnet.helius-rpc.com/"
ALLOWED_METHODS = {"getBalance", "getTokenAccountsByOwner"}
TOKEN_PROGRAMS = {
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
    "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
}
OWNER_PATTERN = re.compile(r"^[1-9A-HJ-NP-Za-km-z]{32,44}$")
MAX_REQUEST_BYTES = 16 * 1024
MAX_RESPONSE_BYTES = 4 * 1024 * 1024
RATE_LIMIT = 180
RATE_WINDOW = 60
RATE_LOCK = threading.Lock()
RATE_HITS: dict[str, deque[float]] = defaultdict(deque)


def load_local_env() -> None:
    if not LOCAL_ENV.is_file():
        return
    for raw_line in LOCAL_ENV.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        name, value = line.split("=", 1)
        name, value = name.strip(), value.strip().strip("\"'")
        if name in {"HELIUS_API_KEY", "ALLOWED_ORIGINS", "PORT", "HOST"}:
            os.environ.setdefault(name, value)


load_local_env()
API_KEY = os.getenv("HELIUS_API_KEY", "").strip()
ALLOWED_ORIGINS = {
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "ALLOWED_ORIGINS",
        "https://pantheraleo-atlasvalley.github.io,http://127.0.0.1:8791,http://localhost:8791",
    ).split(",")
    if origin.strip()
}


def encode_json(value: object) -> bytes:
    return json.dumps(value, separators=(",", ":")).encode("utf-8")


class Handler(BaseHTTPRequestHandler):
    server_version = "AtlasYieldProxy/1.0"

    def send_json(self, status: int, payload: object, origin: str | None = None) -> None:
        body = encode_json(payload)
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        if origin:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type")
            self.send_header("Vary", "Origin")
        self.end_headers()
        self.wfile.write(body)

    def allowed_origin(self) -> str | None:
        origin = self.headers.get("Origin", "").rstrip("/")
        if not origin:
            return None
        forwarded_proto = self.headers.get("X-Forwarded-Proto", "").split(",", 1)[0].strip()
        scheme = "https" if forwarded_proto == "https" else "http"
        if origin == f"{scheme}://{self.headers.get('Host', '')}".rstrip("/"):
            return origin
        return origin if origin in ALLOWED_ORIGINS else None

    def do_OPTIONS(self) -> None:
        origin = self.allowed_origin()
        if origin is None:
            self.send_error(403, "Origin non consentita")
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", origin)
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.end_headers()

    def do_GET(self) -> None:
        path = urlsplit(self.path).path
        if path == "/health":
            self.send_json(200, {"ok": True, "service": "atlas-yield-rpc", "configured": bool(API_KEY)})
            return
        if path in {"/", "/atlaslabs", "/atlaslabs/"}:
            self.send_response(302)
            self.send_header("Location", "/atlaslabs/")
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            return
        if path.startswith("/atlaslabs/"):
            self.serve_static(path.removeprefix("/atlaslabs/") or "index.html")
            return
        self.send_error(404)

    def serve_static(self, relative: str) -> None:
        target = (APP_ROOT / unquote(relative)).resolve()
        if APP_ROOT not in target.parents or not target.is_file():
            self.send_error(404)
            return
        content_type = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript; charset=utf-8",
            ".css": "text/css; charset=utf-8",
            ".md": "text/markdown; charset=utf-8",
        }.get(target.suffix, "application/octet-stream")
        body = target.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self) -> None:
        if urlsplit(self.path).path != "/api/rpc":
            self.send_error(404)
            return
        origin = self.allowed_origin()
        if origin is None:
            self.send_json(403, {"error": "Origin non consentita."})
            return
        if not self.consume_rate(self.client_address[0]):
            self.send_json(429, {"error": "Troppe richieste; riprova tra un minuto."}, origin)
            return
        if not API_KEY:
            self.send_json(503, {"error": "HELIUS_API_KEY non configurata sul server."}, origin)
            return

        length = self.headers.get("Content-Length", "")
        if not length.isdigit() or not 0 < int(length) <= MAX_REQUEST_BYTES:
            self.send_json(413, {"error": "Dimensione richiesta non valida."}, origin)
            return
        try:
            data = json.loads(self.rfile.read(int(length)))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self.send_json(400, {"error": "JSON non valido."}, origin)
            return
        problem = self.validate(data)
        if problem:
            request_id = data.get("id") if isinstance(data, dict) else None
            self.send_json(400, {"jsonrpc": "2.0", "id": request_id,
                                 "error": {"code": -32600, "message": problem}}, origin)
            return

        upstream = Request(
            f"{HELIUS_RPC}?{urlencode({'api-key': API_KEY})}",
            data=encode_json(data),
            headers={"Content-Type": "application/json", "Accept": "application/json"},
            method="POST",
        )
        try:
            with urlopen(upstream, timeout=15) as response:
                body = response.read(MAX_RESPONSE_BYTES + 1)
            if len(body) > MAX_RESPONSE_BYTES:
                self.send_json(502, {"error": "Risposta RPC troppo grande."}, origin)
                return
            self.send_json(200, json.loads(body), origin)
        except HTTPError as exc:
            self.send_json(502, {"jsonrpc": "2.0", "id": data.get("id"),
                                 "error": {"code": -32000, "message": f"Provider RPC ha risposto HTTP {exc.code}."}}, origin)
        except (URLError, TimeoutError, json.JSONDecodeError, OSError):
            self.send_json(502, {"jsonrpc": "2.0", "id": data.get("id"),
                                 "error": {"code": -32000, "message": "Provider RPC non raggiungibile o risposta non valida."}}, origin)

    @staticmethod
    def validate(data: object) -> str | None:
        if not isinstance(data, dict) or data.get("jsonrpc") != "2.0" or "id" not in data:
            return "Richiesta JSON-RPC non valida."
        method, params = data.get("method"), data.get("params")
        if method not in ALLOWED_METHODS:
            return "Metodo non consentito: il proxy inoltra solo letture del saldo."
        if not isinstance(params, list) or not params or not isinstance(params[0], str) or not OWNER_PATTERN.fullmatch(params[0]):
            return "Indirizzo pubblico Solana non valido."
        if method == "getBalance":
            if len(params) > 2 or (len(params) == 2 and not isinstance(params[1], dict)):
                return "Parametri getBalance non validi."
        else:
            if len(params) != 3 or not isinstance(params[1], dict) or params[1].get("programId") not in TOKEN_PROGRAMS:
                return "Token limitati ai programmi SPL Token e Token-2022."
            if not isinstance(params[2], dict) or params[2].get("encoding") != "jsonParsed":
                return "La lettura token richiede encoding jsonParsed."
        return None

    @staticmethod
    def consume_rate(client: str) -> bool:
        now = time.monotonic()
        with RATE_LOCK:
            hits = RATE_HITS[client]
            while hits and now - hits[0] > RATE_WINDOW:
                hits.popleft()
            if len(hits) >= RATE_LIMIT:
                return False
            hits.append(now)
            return True

    def log_message(self, fmt: str, *args: object) -> None:
        # The request body and the upstream API key are never logged.
        super().log_message(fmt, *args)


def main() -> None:
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8791"))
    if os.getenv("RENDER"):
        host = "0.0.0.0"
    server = ThreadingHTTPServer((host, port), Handler)
    display_host = "127.0.0.1" if host == "0.0.0.0" else host
    print(f"Atlas Yield Lab: http://{display_host}:{port}/atlaslabs/")
    print(f"RPC proxy configurato: {'sì' if API_KEY else 'no (impostare HELIUS_API_KEY)'}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer arrestato.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
