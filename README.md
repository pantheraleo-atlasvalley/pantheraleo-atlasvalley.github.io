# Atlas Valley

Atlas Valley website and project documentation.

- Main website: `index.html`
- Documentation portal: `docs/index.html`
- Docs styling and interactions: `docs/style.css`, `docs/script.js`

The documentation distinguishes project concepts and goals from verified deployed features. Review all token addresses, technical claims, and links before publishing.

## Atlas Vault v0.2.4

`atlaslabs/` is the single Atlas Vault app. Start it from the repository root with `python3 atlaslabs/COM/start.py`, then open `http://127.0.0.1:8789/`. The flow is login landing page → Atlas Vault, where the sidebar switches between Exchange and Web3 experience. The wallet connection and on-chain balances are read-only; exchange actions and yield integrations remain previews. Version ZIP archives are kept in `draft/`.

Atlas Vault has no local database: balances are fetched on demand from Solana mainnet RPC and are not written to disk. The `atlaslabs/data/` directory is currently empty; wallet addresses and private keys are not stored by the backend.
