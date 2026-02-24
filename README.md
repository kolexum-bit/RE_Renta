# RE Renta Desktop (Electron + React + TypeScript + SQLite)

## Architecture plan

Single-window desktop app for end-to-end rental bookkeeping workflows.

- **Startup contract (non-negotiable):**
  - If no initialized DB (`app_settings.setup_complete = 0`), app opens **Setup Wizard**.
  - Otherwise app opens **Home Dashboard**.
- **Main process** handles:
  - SQLite initialization + migrations
  - Posting transactions as balanced journal entries
  - KPI/report data
  - PDF generation in dedicated Electron window
  - Backup copy of DB
- **Renderer process** handles:
  - Setup wizard (first run)
  - Dashboard + quick actions
  - Alerts and KPI widgets

## Folder structure

```text
migrations/
  001_initial.sql
src/
  main/
    main.ts
    db.ts
    services/
      setupService.ts
      accountingService.ts
      reportService.ts
      financeMath.ts
  preload/
    preload.ts
  renderer/
    main.tsx
    env.d.ts
    styles.css
    pages/
      App.tsx
    components/
      SetupWizard.tsx
      Dashboard.tsx
  shared/
    types.ts
tests/
  accounting.test.ts
```

## Key libraries and why

- **Electron:** single desktop app shell and multi-window PDF behavior.
- **React + TypeScript:** guided setup and dashboard UX with typed UI logic.
- **better-sqlite3:** fast local-only SQLite access in Electron main process.
- **Vite:** renderer build/dev speed.
- **Vitest:** accounting correctness checks.
- **electron-builder:** Windows installer (`nsis`) + portable executable target.

## Database schema + migration strategy

- Migration file: `migrations/001_initial.sql`
- Strategy:
  1. On app startup, read SQL migration and run idempotent `CREATE TABLE IF NOT EXISTS`.
  2. Keep forward-only numbered migrations (`002_*.sql`, `003_*.sql`) for incremental upgrades.
  3. `app_settings` is used to gate first-run wizard and module flags.

Included tables cover all requested domains:
- Entities, properties, units
- Bank accounts and CoA (Schedule E mapping)
- Transactions/splits and journal entries/lines
- Leases, loans, security deposits
- Assets/depreciation
- Import batches/rows/rules/reconciliation
- Attachments and audit log

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run package:win
npm run package:portable
```

## Notes

- Local-only storage (SQLite file in Electron userData directory).
- Strict tagging enforcement exists in posting API: transaction posts only if Child LLC + Property + (Unit or Shared) is present.
- PDF export uses HTML template rendered in hidden BrowserWindow and `printToPDF`, then opens a new window with the output.
