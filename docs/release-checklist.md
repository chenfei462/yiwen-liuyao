# Release Checklist

Use this checklist before every local beta handoff or production-style build.

## Startup

- [ ] Install dependencies with `npm install`.
- [ ] Start local Web/H5 with `npm run dev -- --hostname 127.0.0.1 --port 3002`.
- [ ] Open `http://127.0.0.1:3002`.
- [ ] Confirm the first screen exposes entries for casting, learning, history, cases, community, and privacy settings.
- [ ] Confirm sandbox language is visible and no real payment or settlement flow is enabled.

## Verification Gate

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

Expected E2E coverage:

- [ ] Coin casting: six shakes enable chart generation.
- [ ] Manual casting: default six lines can submit immediately.
- [ ] Time casting: independent entry creates a chart without explicit line input.
- [ ] AI modes and recommended follow-up buttons are clickable.
- [ ] Free follow-up remains available after evidence generation.
- [ ] Share card, favorite, and tags are clickable.
- [ ] Share preview and public share page do not expose the original full question.
- [ ] Privacy data export reports raw question text and private followups as excluded.
- [ ] Public registration, login, logout, email verification, and password reset routes return expected statuses.
- [ ] Anonymous history, favorites, tags, privacy settings, and learning progress remain scoped to the same anonymous principal.
- [ ] Logging in after anonymous usage preserves the merged data view without duplicate items.
- [ ] `/api/admin/*` returns `401` when logged out, `403` for non-admin users, and `200` for emails in `ADMIN_EMAILS`.
- [ ] Non-admin workbench sessions do not fetch or render admin-only data.
- [ ] High-risk investment, medical, legal, self-harm, luck-changing, and coercive relationship requests are blocked or redirected.
- [ ] History deletion shows a confirmation step before deleting.
- [ ] Desktop `1440x1200` and mobile `390x844` flows are covered.

## Plan Acceptance

- [ ] Time casting is visible beside coin casting, manual input, and imported chart flows.
- [ ] Time casting explains that it is a lightweight experience method and not equivalent to the coin method.
- [ ] Results first show base chart, changed chart, yongshen, three key evidence points, and a safety notice.
- [ ] Advanced evidence remains available below the summary.
- [ ] Share preview hides the original full question and shows chart names, key points, and entertainment/safety notice.
- [ ] History delete requires a second confirmation.
- [ ] Web/H5 remains the primary deliverable; mini-program/App work stays in evaluation.
- [ ] Business, settlement, and ecosystem functions remain simulated/sandbox only.

## Release

- [ ] Merge feature branch into `develop` after the verification gate passes.
- [ ] Build from a clean working tree with `npm run build`.
- [ ] Confirm Vercel project settings match `docs/deployment-vercel.md`.
- [ ] Confirm production and preview environment variables are set in Vercel, not committed locally.
- [ ] Confirm `ADMIN_EMAILS` and auth email provider variables are present in deployment environments.
- [ ] Confirm `DATABASE_URL` is configured for production reading-service PostgreSQL JSONB snapshots.
- [ ] Confirm production reading-service and auth/session storage are shared and persistent, not per-instance local filesystem state.
- [ ] Capture the commit SHA, build time, and verification commands in the release note.
- [ ] Record the handoff branch, commit SHA, build time, verification results, and remaining risks in the acceptance or release note.
- [ ] Keep `.data/`, `.next/`, screenshots, reports, and browser artifacts out of git.

## Rollback

- [ ] Identify the last known good commit on `main` or `develop`.
- [ ] Rebuild that commit with `npm run build`.
- [ ] Restore only intended local data snapshots if needed; do not restore raw user question text into public artifacts.
- [ ] Re-run typecheck, unit tests, lint, and build after rollback.
