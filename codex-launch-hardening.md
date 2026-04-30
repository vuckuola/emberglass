Harden Emberglass for launch as a static GitHub Pages app. Do not invent backend infrastructure.

Read first:
- README.md
- DEPLOY_DEMO.md
- package.json
- src/main.tsx
- src/game/systems/SaveSystem.ts
- .github/workflows/deploy.yml

Implement only what fits the current static architecture:
1. Add a static health endpoint/file under public/ so deploys can be checked cheaply.
2. Add a launch-readiness script that validates the built static artifact (index, health file, generated assets, manifest, key bundle references) and fails loudly when broken.
3. Add lightweight browser crash diagnostics: capture window error/unhandledrejection info into a bounded localStorage buffer or similar, no remote backend required. Keep it safe and tiny.
4. Document the 25-item launch checklist honestly for this repo: implemented vs not applicable vs future backend requirement. Save it in docs/launch/.
5. Add a concise incident runbook for this static demo in docs/launch/.
6. Wire package.json scripts and docs so the hardening checks are part of pre-launch workflow.

Constraints:
- No backend/server/API additions.
- Keep existing gameplay, save data, and deploy flow intact.
- No fake alerting or fake queues; mark those as future backend concerns instead.

Validation before finishing:
- npm run typecheck
- npm run build
- npm run demo:check
- run the new launch-readiness script successfully
- commit with a clear message

DO NOT plan. Edit, validate, and commit now.