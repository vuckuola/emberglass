# Emberglass Static Launch Audit

This document maps the 25-item launch checklist against Emberglass **as it exists today**: a **static Phaser/React/Vite build deployed to GitHub Pages**.

## Architecture baseline
- Delivery model: static assets only (`dist/`)
- Host: GitHub Pages
- CDN layer: GitHub Pages / Fastly edge cache
- Server-side API: none
- Database: none
- Upload pipeline: none
- Background jobs: none
- Persistent game state: browser `localStorage` only

## Status legend
- **Implemented** — handled in the current repo/runtime model
- **N/A (static)** — not relevant because this app has no backend/service layer
- **Future backend requirement** — not needed for the current static demo, but mandatory if Emberglass grows into a multi-user/service-backed product

| # | Checklist item | Status | Emberglass note |
|---|---|---|---|
| 1 | Load testing before launch | **Future backend requirement** | Current demo is a static site, so origin load behavior is mostly GitHub Pages/CDN territory. For future backend/API launch, real load testing becomes mandatory. |
| 2 | Session data stored in server memory | **N/A (static)** | No server sessions; save/settings live in browser `localStorage`. |
| 3 | File uploads going directly to app server | **N/A (static)** | No uploads in current demo. |
| 4 | Synchronous email sending in API routes | **N/A (static)** | No email system or API routes exist. |
| 5 | No queue system for background tasks | **N/A (static)** | No backend jobs/tasks exist. |
| 6 | Hardcoded secrets in deployment scripts | **Implemented** | GitHub Pages deploy uses OIDC/pages permissions only; no secrets are committed for the static deploy path. |
| 7 | Single database with no read replica | **N/A (static)** | No database exists. |
| 8 | No CDN in front of static assets | **Implemented** | GitHub Pages serves the built assets through edge caching/CDN. |
| 9 | DB migrations running automatically on app start | **N/A (static)** | No database or migrations exist. |
| 10 | No database backup ever tested with a restore | **N/A (static)** | No database exists. Browser save data is local-only and non-authoritative. |
| 11 | Unindexed foreign key columns | **N/A (static)** | No relational database exists. |
| 12 | No rate limiting anywhere | **N/A (static)** | No write/API surface exists in this demo. |
| 13 | API responses with no compression | **Implemented** | Production hosting is static and edge-served; compression is expected from the host/CDN rather than app code. |
| 14 | No error alerting configured | **Future backend requirement** | This repo now captures client runtime diagnostics locally for debugging, but has no remote alerting service by design. |
| 15 | Transactions not used for multi-step writes | **N/A (static)** | No database transactions or server writes exist. |
| 16 | Health check endpoint missing | **Implemented for static deploy probe** | `public/healthz.json` ships in `dist/` as a cheap deploy verification target. It proves static artifact availability, not full client boot/runtime success. |
| 17 | Memory leaks in long-running processes | **Future backend requirement** | For this static demo, the main long-lived process is the browser tab. Runtime QA exists, but server-side memory-leak handling is only relevant once services exist. |
| 18 | No graceful shutdown handling | **N/A (static)** | GitHub Pages serves static files; there is no app server to drain. |
| 19 | Dependent on a third-party API with no fallback | **Implemented** | The shipped demo has no live third-party runtime dependency. |
| 20 | All logs written to local disk | **N/A (static)** | No server logs exist. Client diagnostics are intentionally stored locally in browser storage. |
| 21 | No circuit breaker on external calls | **N/A (static)** | No runtime external API calls exist. |
| 22 | Unparameterized search queries | **N/A (static)** | No backend search/database layer exists. |
| 23 | No connection timeout on outbound HTTP calls | **N/A (static)** | No runtime outbound server HTTP calls exist. |
| 24 | WebSockets not handled by a stateful service | **N/A (static)** | No realtime socket layer exists. |
| 25 | No runbook for common incidents | **Implemented** | See `docs/launch/INCIDENT_RUNBOOK.md`. |

## Concrete safeguards added for the static launch path
1. **Static health probe** — `public/healthz.json`
2. **Artifact integrity check** — `scripts/check-launch-readiness.mjs`
3. **Launch scripts**
   - `npm run launch:artifact-check`
   - `npm run launch:check`
   - `npm run ship:strict`
4. **GitHub Pages workflow gate** — deploy workflow now runs the artifact check before publishing
5. **Browser crash diagnostics** — `src/diagnostics/runtimeDiagnostics.ts` installs global `error` and `unhandledrejection` capture into a bounded local buffer

## What must happen before any future backend launch
If Emberglass evolves beyond static hosting, the following checklist items immediately become active engineering work: **1, 4, 5, 7, 9, 10, 12, 14, 15, 17, 18, 21, 23, 24**.

That future version should not launch until those are implemented against the actual backend topology.
