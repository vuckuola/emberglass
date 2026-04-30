# Emberglass Static Demo Incident Runbook

This runbook is for the **current static GitHub Pages deployment**, not a future backend product.

## Primary live URL
- `https://vuckuola.github.io/emberglass/`
- Health probe: `https://vuckuola.github.io/emberglass/healthz.json`

## Pre-launch commands
```bash
npm ci
npm run ship:strict
npm run demo:preview
```

## Incident 1 — Site loads but screen is blank
### Checks
1. Open browser devtools and reload once.
2. Check whether `index.html` loads and whether the hashed JS/CSS assets return `200`.
3. Verify the health file:
   - `curl -s https://vuckuola.github.io/emberglass/healthz.json`
4. Run local reproduction:
   - `npm run demo:preview`
   - open local preview

### Likely causes
- Broken hashed bundle reference
- Partial deploy / stale cache window
- Runtime error during boot

### Actions
1. Run locally:
   - `npm run ship:strict`
2. If local passes, hard-refresh the live page / retry after CDN cache window.
3. If local fails, inspect latest commit diff and rollback if needed.

## Incident 2 — New deploy succeeded but live still looks old
### Checks
1. Confirm latest commit on `main`.
2. Confirm GitHub Actions Pages workflow conclusion is `success`.
3. Fetch live HTML and inspect hashed asset names.

### Actions
1. Wait through cache TTL window.
2. Compare local built asset hashes vs live HTML asset hashes.
3. If mismatch persists, re-run deploy by pushing a no-op/docs change or manual workflow dispatch.

## Incident 3 — Save/continue appears broken
### Checks
1. Remember the demo uses browser `localStorage`, not a cloud save.
2. Test in the same browser/profile first.
3. Inspect local save presence:
   - devtools → Application → Local Storage
   - key pattern: `emberglass_save_0`

### Actions
1. If save data is corrupt, use title-screen reset (`R`) or clear local storage.
2. Re-run `node qa-runtime.mjs` locally to verify title/new game/continue flow.
3. Treat cross-device save expectations as unsupported in the current static build.

## Incident 4 — Runtime crash during gameplay
### Checks
1. Open devtools console.
2. Inspect local diagnostics buffer from the browser console:
   ```js
   window.__EMBERGLASS_DIAGNOSTICS__?.list()
   ```
3. Export captured diagnostics if needed:
   ```js
   window.__EMBERGLASS_DIAGNOSTICS__?.exportJson()
   ```

### Actions
1. Capture the diagnostic JSON and offending route/interaction.
2. Reproduce locally with `npm run demo:preview`.
3. Run:
   - `npm run typecheck`
   - `npm run build`
   - `node qa-runtime.mjs`
4. Fix, re-run `npm run ship:strict`, then redeploy.

## Incident 5 — Asset 404s after publish
### Checks
1. Run local artifact verification:
   - `npm run launch:check`
2. Confirm `dist/assets/generated/asset-manifest.json` exists.
3. Check live root HTML and referenced assets.

### Actions
1. If artifact check fails locally, do not redeploy — fix build integrity first.
2. If local is good but live 404s, wait for Pages/CDN propagation and re-check.
3. If still broken, inspect workflow artifact contents and latest deploy commit.

## Incident 6 — Audio does not start
### Checks
1. Browser audio often requires a user gesture.
2. Click/tap once inside the page.
3. Test on Chrome/Edge first.

### Actions
1. Confirm issue after a user gesture, not before.
2. Treat autoplay-only failure as browser policy, not server incident.

## Rollback rule
If a public deploy is broken and the fix is not obvious within minutes:
1. Identify last known good commit.
2. Revert to that commit on `main`.
3. Let Pages redeploy the known-good static artifact.
4. Continue debugging on top of the reverted branch state locally.

## Definition of launch-ready for this static demo
A build is considered safe to publish only if all pass:
```bash
npm run demo:check
npm run launch:artifact-check
```
