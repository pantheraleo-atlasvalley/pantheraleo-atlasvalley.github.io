# Atlas Valley RPC proxy

Small Python standard-library service for the Yield Lab. It serves the static app locally and forwards only `getBalance` and SPL/Token-2022 `getTokenAccountsByOwner` calls to Helius. The provider key stays on the server; the browser sends only the wallet's public address. The proxy never signs or submits transactions.

## Run locally

1. Copy `.env.example` to `.env.local` and set `HELIUS_API_KEY` there. `.env.local` is ignored by Git.
2. Start with `python3 atlaslabs/backend/server.py`.
3. Open <http://127.0.0.1:8791/atlaslabs/> in Firefox with Phantom. On localhost, the app selects the same-origin `/api/rpc` proxy automatically.

The health endpoint is `/health`; JSON-RPC requests go to `/api/rpc`. `ALLOWED_ORIGINS` can be changed in `.env.local` for local development.

## Host the public proxy

GitHub Pages serves static files and cannot run this Python backend. Deploy the repository's `render.yaml` as a Render Blueprint, then enter the provider key as the private `HELIUS_API_KEY` environment variable in Render. Do not put it in Git, `config.js`, or the frontend.

After Render creates the service, set `window.ATLAS_RPC_PROXY_URL` in `atlaslabs/config.js` to the service's public `/api/rpc` URL and push that public endpoint URL. It is safe for the URL to be public; the provider key remains in Render. The proxy allows the GitHub Pages origin and applies per-IP request limiting, a small method allowlist, request/response size limits, and exact-origin CORS.

Render's free service may sleep when idle. For a public service, monitor provider usage and set an appropriate provider quota; browser CORS rules alone are not access control.
