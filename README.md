# Dadbooks

Offline-first, double-entry bookkeeping for small finance operations — a lightweight Tally
alternative. Runs as a desktop app (Electron + Vue 3 + TypeScript) and stores each company's books
in a local SQLite file.

## What's here

- **Chart of accounts** seeded with Tally-style groups (Capital Account, Current Assets, Sundry
  Debtors, Duties & Taxes, …). Ledgers belong to a group and carry a Dr/Cr opening balance.
- **Vouchers**: payment, receipt, contra, journal, sales and purchase, each numbered per type.
  Every voucher must balance (total debits = total credits) before it is posted.
- **Reports**: Day Book and Trial Balance (as of any date, flags differences in opening balances).

Amounts are stored as integer paise and formatted with Indian digit grouping (`1,23,456.78`).

## Layout

```
src/shared/    Pure TypeScript domain: money, types, voucher validation, reports, IPC contract
src/main/      Electron main process: SQLite storage (node:sqlite), migrations, IPC handlers
src/preload/   Exposes the typed `window.books` API to the renderer (sandboxed, context-isolated)
src/renderer/  Vue 3 UI
```

The renderer never touches the database directly; it calls `window.books.*`, which maps 1:1 to
`Books` methods in `src/main/db/books.ts` over IPC.

## Development

Requires Node 24 (see `.nvmrc`; matches the Node version bundled with Electron).

```bash
npm install
npm run dev          # launch the app with hot reload
npm test             # unit + storage tests (vitest)
npm run lint
npm run typecheck
npm run format
```

The database lives at `<userData>/books.sqlite`. Set `DADBOOKS_DB=/path/to/file.sqlite` to use a
different file.

## Packaging

```bash
npm run build:win    # or build:mac / build:linux
```
