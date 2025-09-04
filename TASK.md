e‑Taca — Corporate‑grade MVP: Execution Plan (Single‑Task Windows)

Scope: This file tracks the end‑to‑end implementation plan derived from `e-taca-corporate-mvp-plan-complete.md` and `e-taca-plan.md`. Each task below is executed in isolation (one context window per task). Acceptance criteria and tests are listed for each.

Conventions
- Primary stack: .NET API + Next.js frontend
- Security: OWASP/PCI SAQ A; no card data stored; strict headers; no secrets in logs
- Payments (Fiserv/Polcard HPP): HMAC‑SHA256 (Base64), `currency=985`, `Europe/Warsaw` `txndatetime`, exclude `transactionNotificationURL` from signature
- Testing: unit + integration + E2E (Playwright); ≥90% coverage of critical logic

Checklist Legend
- [ ] todo
- [x] done
- [~] in progress

Master Tasks (one window each)
1) Project Orchestration and Documentation
- [ ] Create/update `.env.example` for frontend and backend
- [ ] Update `README.md` (dev/staging/prod run, migrations, deploy)
- [ ] Add architecture diagram, payment sequence, ERD
- [ ] Add incident response and key rotation runbooks

2) Payments — Parameter Builder and Signature
- [ ] Implement Fiserv HPP parameter builder
  - Acceptance: produces fields: `chargetotal`, `checkoutoption`, `currency`, `hash_algorithm`, `oid`, `responseFailURL`, `responseSuccessURL`, `storename`, `timezone`, `txndatetime`, `txntype`
  - Acceptance: `txntype=sale`, `checkoutoption=combinedpage` (or configured)
- [ ] Compute signature HMAC‑SHA256 using secret key; output Base64
- [ ] Ensure `transactionNotificationURL` is NOT part of the signature
- [ ] Unit tests: happy path + wrong key + missing field + order change

3) Payments — Timezone and Currency Enforcement
- [ ] `txndatetime` in `Europe/Warsaw` (format `YYYY:MM:DD-HH:mm:ss`)
- [ ] `currency=985` (PLN) numeric ISO 4217
- [ ] Validation and unit tests for both

4) Payments — Success/Fail URLs and Env Config
- [ ] Parameterize Success/Fail URLs via environment
- [ ] Replace any `localhost` placeholders in staging/prod builds
- [ ] E2E asserts redirect to correct domain paths

5) Payments — Webhook and Idempotency
- [ ] Implement webhook endpoint (auth/validation as per provider)
- [ ] Idempotent updates by `oid`/external id; store provider status
- [ ] Update donation entity status transitions; audit log entry
- [ ] Integration tests: duplicate delivery, out‑of‑order events

6) Security Hardening
- [ ] Strict headers (CSP, X‑Frame‑Options, X‑Content‑Type‑Options, Referrer‑Policy, HSTS)
- [ ] Remove/redact any sensitive logging; structured logs only
- [ ] Rate limiting on login/auth endpoints
- [ ] Basic ZAP/SAST scan and remediate criticals

7) Frontend UX/DX
- [ ] Mobile polish (hit targets ≥44px, spacing, Polish translations)
- [ ] Accessibility pass (alt texts, focus states, contrasts)
- [ ] Privacy policy and consent links/UI

8) Ops and Monitoring
- [ ] Health endpoints (liveness/readiness)
- [ ] Basic uptime alerting (ping/API) and centralized logs
- [ ] Apply DB performance indexes and verify via EXPLAIN

9) Data Exports
- [ ] CSV/PDF exports (if feasible now); otherwise stub with TODO

10) Staging Demo Prep
- [ ] Seed demo org and goals; generate QR codes
- [ ] Dry‑run live demo path (smartphone); screenshots for handbook

Testing Plan (summarized)
- Unit: HMAC/signature, param validation, timezone/currency formatting, status transitions
- Integration: webhook idempotency and status updates, redirect URLs
- E2E (Playwright): registration → activation → goal → QR → payment (SUCCESS/DECLINED/CANCELLED) → confirmation → panel visibility
- Performance: 100 parallel donations; API TTFB < 500 ms

Acceptance Gate (must be true before release)
- [ ] E2E: all 3 outcomes pass; no critical errors
- [ ] Hash correct; `transactionNotificationURL` not included in signature
- [ ] `txndatetime` Europe/Warsaw; `currency=985`
- [ ] Webhook idempotent; statuses persisted; audit log present
- [ ] Success/Fail URLs in correct domain; thank‑you/error pages ready
- [ ] OWASP/PCI scan without criticals; no secrets in logs
- [ ] Monitoring/backup in place

Discovered During Work
- Use this section to append newly identified tasks with date stamps.

