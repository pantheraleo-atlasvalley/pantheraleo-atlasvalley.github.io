#!/usr/bin/env python3
"""Serve the Atlas Vault v0.2.4 UI and proxy same-origin API calls to backend.py."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
from http.client import HTTPConnection
import mimetypes

ROOT = Path(__file__).resolve().parents[1]
HOST, PORT = '127.0.0.1', 8789
BACKEND_HOST, BACKEND_PORT = '127.0.0.1', 8790

class Handler(BaseHTTPRequestHandler):
    server_version = 'AtlasVaultFrontend/0.2.4'
    def log_message(self, fmt, *args): print('frontend:', fmt % args)
    def proxy_api(self):
        body = self.rfile.read(int(self.headers.get('Content-Length', '0'))) if self.command == 'POST' else None
        conn = HTTPConnection(BACKEND_HOST, BACKEND_PORT, timeout=10)
        try:
            conn.request(self.command, self.path, body=body,
                         headers={'Content-Type': self.headers.get('Content-Type', 'application/json')})
            response = conn.getresponse(); data = response.read()
            self.send_response(response.status)
            self.send_header('Content-Type', response.getheader('Content-Type', 'application/json'))
            self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store'); self.end_headers()
            if self.command != 'HEAD': self.wfile.write(data)
        except OSError as exc:
            data = ('{"error":"Backend non raggiungibile: %s"}' % str(exc)).encode()
            self.send_response(502); self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(data))); self.end_headers(); self.wfile.write(data)
        finally: conn.close()
    def serve_file(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/': path = '/index.html'
        target = (ROOT / path.lstrip('/')).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file() or any(part in ('COM', 'data') for part in target.relative_to(ROOT).parts):
            self.send_error(404); return
        data = target.read_bytes(); mime = mimetypes.guess_type(target.name)[0] or 'application/octet-stream'
        self.send_response(200); self.send_header('Content-Type', mime + ('; charset=utf-8' if mime.startswith(('text/', 'application/javascript')) else ''))
        self.send_header('Content-Length', str(len(data))); self.send_header('Cache-Control', 'no-store'); self.end_headers()
        if self.command != 'HEAD': self.wfile.write(data)
    def do_GET(self): self.proxy_api() if self.path.startswith('/api/') else self.serve_file()
    def do_POST(self): self.proxy_api() if self.path.startswith('/api/') else self.send_error(404)
    def do_HEAD(self): self.serve_file()

if __name__ == '__main__':
    print(f'Atlas Vault v0.2.4 frontend su http://{HOST}:{PORT}; API proxy → http://{BACKEND_HOST}:{BACKEND_PORT}')
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
