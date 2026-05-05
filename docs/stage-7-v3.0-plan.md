# Stage 7 V3.0 Plan: Controlled Ecosystem, Expert Collaboration, and Rule Content Market

## Summary

V3.0 covers weeks 41-52 and builds on V2.0 community, multi-client, voice, import, and rule-pack governance. The product moves from an internal rule market v0 to a controlled ecosystem where invited contributors and experts can submit rule packs, courses, cases, knowledge cards, exercises, and creator templates.

The opening model remains controlled. No anonymous public API is exposed, rule packs are declarative only, and all public catalog content must pass professional, compliance, safety, and regression gates before publication.

## Scope

- Contributor workbench: roles, dashboard, submission drafts, submit flow, diff summary, review notes, status history, and publish records.
- Rule-pack ecosystem: declarative rule-pack submission, professional/compliance/safety review, standard-case regression, publication, rollback, suspension, and version tracking.
- Ecosystem catalog: published package list/detail, install, disable, and audit-safe package status.
- Expert collaboration: admin submission queue, review gates, changes requested, rejection, and package suspension.
- Simulated settlement: ledger events, simulated contributor statements, and ecosystem metrics.

## Out Of Scope

- Real revenue share, withdrawal, invoice, tax, KYB, or KYC.
- Arbitrary executable rule code.
- Anonymous third-party public API.
- Expert one-on-one paid divination, high-price judgment services, fate-changing, disaster-removal, relationship-control, medical, legal, or investment conclusions.

## API Baseline

- `GET /api/ecosystem/packages`
- `GET /api/ecosystem/packages/[id]`
- `POST /api/ecosystem/packages/install`
- `POST /api/ecosystem/packages/disable`
- `GET /api/me/contributor-dashboard`
- `POST /api/contributor/submissions`
- `GET /api/contributor/submissions`
- `GET /api/contributor/submissions/[id]`
- `PATCH /api/contributor/submissions/[id]`
- `POST /api/contributor/submissions/[id]/submit`
- `GET /api/admin/submissions`
- `POST /api/admin/submissions/[id]/reviews`
- `POST /api/admin/rule-packs/[id]/regression`
- `POST /api/admin/rule-packs/[id]/publish`
- `POST /api/admin/rule-packs/[id]/rollback`
- `POST /api/admin/ecosystem/packages/[id]/suspend`
- `GET /api/contributor/settlements`
- `POST /api/contributor/settlements/simulate`
- `GET /api/admin/ecosystem/metrics`

## Data Baseline

The V3.0 database baseline adds:

- `contributors`
- `contributor_submissions`
- `submission_reviews`
- `rule_pack_regressions`
- `ecosystem_packages`
- `package_installs`
- `settlement_ledger`
- `contributor_settlements`

`rule_packs` gains `rule_pack_version`, `safety_reviewed`, `regression_reviewed`, and `regression_report_id`. Future evidence-tree persistence must include `rule_pack_id` and `rule_pack_version` for every ecosystem-derived rule node.

## Week Plan

- Week 41: Freeze V3.0 PRD, controlled-opening boundary, contributor roles, review gates, simulated-settlement rules, and ecosystem catalog IA.
- Week 42: Implement contributor identity, role model, dashboard, submission draft, and personal workbench.
- Week 43: Implement submission lifecycle, diff summary, review notes, changes requested, and submission history.
- Week 44: Implement rule-pack regression, impact diff, standard-case validation, failure report, and pre-publish gates.
- Week 45: Implement ecosystem catalog, package detail, install/disable/favorite, and installed package management.
- Week 46: Connect course packs, case packs, knowledge packs, and creator template packs; ensure frontend only shows `published` packages.
- Week 47: Implement expert review queue, review SLA model, re-review, conflict handling, suspension, and rollback flow.
- Week 48: Implement simulated ledger, revenue events, contributor statements, and operations settlement report.
- Week 49: Add ecosystem metrics, audit logs, abuse reports, content quality score, and rule-pack health dashboard.
- Week 50: Wrap existing V2.0 rule packs and V1.5 cases/courses/templates as official ecosystem packages.
- Week 51: Invite-only beta: rehearse contributor submission, expert review, user install, and rollback.
- Week 52: Complete V3.0 regression, compliance sampling, performance test, acceptance report, and gray-release checklist.

## Acceptance Gates

- Ordinary users cannot access contributor/admin flows.
- Contributors can only edit their own drafts or changes-requested submissions.
- Reviewers can only process assigned gates.
- Unpublished packages never appear in the public catalog.
- Rule packs cannot publish until professional, compliance, safety, and regression gates pass.
- Package install/disable cannot bypass safety classification or high-risk blocking.
- Simulated settlement never calls real payment, withdrawal, invoice, or tax workflows.
- `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build` pass.

