# Yiwen Liuyao Web/H5

Yiwen Liuyao is a Next.js Web/H5 entertainment and learning app for Liuyao chart casting, evidence review, AI-style explanations, learning cards, history, community governance, and simulated ecosystem/commercial operations.

The current product boundary is intentionally conservative:

- Web/H5 first. Native mini-program, iOS, and Android packages are not implemented in this repo.
- AI, billing, settlement, and ecosystem operations are sandbox/simulated by default.
- High-risk medical, legal, investment, self-harm, luck-changing, and coercive relationship requests are blocked or redirected.
- Local development can use in-memory reading-service state when `DATABASE_URL` is absent; production uses PostgreSQL JSONB snapshots.

## Requirements

- Node.js and npm
- Windows PowerShell, macOS shell, or Linux shell

## Install

```bash
npm install
```

## Development

```bash
npm run dev -- --hostname 127.0.0.1 --port 3002
```

Open `http://127.0.0.1:3002`.

Default local settings:

- Dev port: `3002` for Playwright and local smoke runs.
- Fake/sandbox providers: enabled by code path; no real payment or settlement flow is connected.
- Reading-service persistence: PostgreSQL `domain_snapshots` JSONB row when `DATABASE_URL` is configured; otherwise local development keeps in-memory state only. Browser `localStorage` remains an anonymous/offline fallback.

## Data Migration

To import an existing local `.data/readings.json` snapshot into PostgreSQL, set `DATABASE_URL` and run:

```bash
npm run migrate:readings -- .data/readings.json
```

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm run test:e2e
```

The E2E suite starts the Next.js dev server on `127.0.0.1:3002` and covers desktop `1440x1200` plus mobile `390x844`.

## Git Flow

- `main`: stable baseline
- `develop`: integration branch
- `codex/*`: feature branches

Recommended flow:

```bash
git switch develop
git switch -c codex/<feature-name>
npm run typecheck && npm test && npm run lint && npm run build
```

## Release Docs

- `docs/release-checklist.md`: startup, verification, release, rollback, and plan acceptance checklist.
- `docs/deployment-vercel.md`: Vercel project settings, environment variables, and deploy flows.
- `docs/api-contracts.md`: Web/H5 API contracts, enums, safety boundaries, and stage API baselines.
- `docs/database-baseline.sql`: PostgreSQL baseline for persisted domain data and the reading-service JSONB snapshot table.
- `docs/acceptance/`: stage acceptance reports from MVP through V3.5.
