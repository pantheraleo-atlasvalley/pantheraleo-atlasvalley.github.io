#!/usr/bin/env python3
"""Start the atlas-vault-AV01.000 frontend and read-only backend; Ctrl-C stops both."""
import signal, socket, subprocess, sys, time
from pathlib import Path
HERE = Path(__file__).resolve().parent
services = [('frontend', 8789), ('backend', 8790)]
busy = []
for name, port in services:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        try:
            probe.bind(('127.0.0.1', port))
        except OSError:
            busy.append(f'{name} ({port})')
if busy:
    print('Atlas Vault non avviato: porte già occupate: ' + ', '.join(busy) + '.', file=sys.stderr)
    print('Se è già aperto, visita http://127.0.0.1:8789/. Altrimenti chiudi la vecchia istanza con Ctrl+C nel terminale in cui era stata avviata e riprova.', file=sys.stderr)
    raise SystemExit(1)

children = []
try:
    children.append(subprocess.Popen([sys.executable, str(HERE / 'backend.py')]))
    time.sleep(0.3)
    if children[0].poll() is not None:
        raise SystemExit(children[0].returncode or 1)
    children.append(subprocess.Popen([sys.executable, str(HERE / 'frontend.py')]))
    while True:
        failed = next((p for p in children if p.poll() is not None), None)
        if failed: raise SystemExit(failed.returncode or 1)
        time.sleep(0.5)
except KeyboardInterrupt:
    pass
finally:
    for proc in children:
        if proc.poll() is None: proc.terminate()
    for proc in children:
        try: proc.wait(timeout=3)
        except subprocess.TimeoutExpired: proc.kill()
