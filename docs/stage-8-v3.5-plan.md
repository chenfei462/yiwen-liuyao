# Stage 8 V3.5 Plan: Scaled Operations, Commercial Readiness, and Ecosystem Quality Loop

## Summary

V3.5 covers weeks 53-64 and extends the V3.0 controlled ecosystem into an operations-ready state. The stage does not launch real large-scale commercialization. It adds quality scoring, content risk handling, operations dashboards, SLO and incident records, privacy controls, compliance review queues, and commercial sandbox preparation.

The product positioning remains traditional-culture learning and entertainment. Ecosystem packages, recommendations, commercial entitlements, and experiments cannot override chart generation, evidence trees, AI safety checks, or high-risk blocking.

## Scope

- Ecosystem quality loop: package quality status, quality score, safety score, complaint count, regression failure count, install retention, feedback score, risk events, and automatic public catalog hiding.
- Operations and reliability: SLO targets, current P95 metrics, incident records, mitigations, audit trails, and rollback drill records.
- Commercial sandbox: simulated billing, entitlement checks, revenue preview, readiness gates, and real-money disabled flags.
- Privacy and compliance: privacy settings, data export, retention baseline, sensitive review queue, and compliance review resolution.
- H5 operations panel: one integrated V3.5 panel for quality, reliability, commercial sandbox, privacy, compliance, and growth/retention metrics.

## Out Of Scope

- Real split payment, withdrawal, invoice, tax, KYB, or KYC workflows.
- Public commercial marketplace settlement.
- Paid one-on-one divination, fate-changing, disaster-removal, relationship-control, medical, legal, or investment conclusions.
- Experiments that alter charting, rule-engine behavior, AI safety, or high-risk blocking.

## API Baseline

- `GET /api/admin/ecosystem/quality`
- `GET /api/admin/ecosystem/metrics`
- `POST /api/admin/ecosystem/packages/[id]/quality-review`
- `GET /api/admin/ecosystem/risk-events`
- `POST /api/admin/ecosystem/risk-events/[id]/resolve`
- `GET /api/admin/ops/slo`
- `GET /api/admin/ops/incidents`
- `POST /api/admin/ops/incidents`
- `PATCH /api/admin/ops/incidents/[id]`
- `GET /api/admin/commercial/readiness`
- `POST /api/admin/commercial/simulate-billing`
- `GET /api/contributor/revenue-preview`
- `GET /api/me/privacy-settings`
- `POST /api/me/privacy-settings`
- `POST /api/me/data-export`
- `GET /api/admin/compliance/reviews`
- `POST /api/admin/compliance/reviews/[id]/resolve`

## Data Baseline

The V3.5 database baseline adds:

- `ecosystem_quality_reviews`
- `ecosystem_risk_events`
- `ops_incidents`
- `commercial_billing_simulations`
- `privacy_settings`
- `privacy_data_exports`
- `compliance_reviews`

Only `healthy` published ecosystem packages are allowed in the public catalog. `needs_review`, `suspended`, or `deprecated` quality states are hidden or held for review.

## Week Plan

- Week 53: Freeze V3.5 PRD, quality metrics, commercial readiness boundaries, SLO targets, and privacy/compliance scope.
- Week 54: Implement quality scoring, risk events, low-quality marking, and public catalog hiding.
- Week 55: Implement ecosystem quality admin view for health, complaints, regression failures, version impact, and review SLA.
- Week 56: Implement growth and operations metrics for installs, learning, revisits, sharing, contributors, and recommendations.
- Week 57: Implement commercial sandbox with billing preview, entitlement checks, simulated reconciliation, and revenue preview.
- Week 58: Implement commercial readiness gates without calling real money movement.
- Week 59: Implement privacy settings, data export, retention baseline, and sensitive review queue.
- Week 60: Implement SLO, incident records, rollback drills, and audit query improvements.
- Week 61: Optimize ecosystem recommendations and topics without changing safety or rules.
- Week 62: Complete compliance sampling, minor-protection sampling, commitment-word scan, and high-risk content review.
- Week 63: Complete pressure tests, long-window consistency checks, billing sandbox reconciliation, and incident drills.
- Week 64: Deliver V3.5 acceptance report, commercial readiness report, compliance review report, and V4.0 decision list.

## Acceptance Gates

- Low-score, high-complaint, high-risk, or regression-failing packages enter review or suspension and disappear from the public catalog.
- Commercial sandbox can generate simulated billing and revenue preview without real payment, withdrawal, invoice, or tax calls.
- Privacy settings and data export do not expose raw questions, user identifiers, or private followups.
- SLO data, incident records, audit logs, and rollback drills are traceable.
- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.
