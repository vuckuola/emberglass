Implement Emberglass Milestone A: premium presentation + combat juice.

Read first:
- docs/plans/2026-04-30-phase3-premium-overhaul.md
- src/game/config.ts
- src/game/scenes/TitleScene.ts
- src/game/scenes/OverworldScene.ts
- src/game/scenes/BattleScene.ts
- qa-runtime.mjs

Do NOT rewrite the architecture. Keep story/progression/save flow intact.

Goals:
1. Make the game feel more premium and showcase-ready at current 960x640 resolution.
2. Upgrade title/overworld/battle presentation.
3. Improve battle impact and readability.
4. Keep runtime QA green; update QA only if a real assertion should change.

Required changes:
- TitleScene: stronger premium hero composition, richer subtitle/call-to-action hierarchy, more elegant menu emphasis.
- OverworldScene: better top HUD hierarchy, nicer area banners/toasts, subtle premium framing, slightly richer ambient feel.
- BattleScene: improve actor spotlighting, command readability, hit impact, target feedback, victory presentation, and boss drama.
- Add only small helper methods/files if needed. No fake backend, no placeholder claims.

Verification before exit:
- npm run typecheck
- npm run build
- node qa-runtime.mjs
- git commit with a clear message

Start writing immediately. Do not just plan.
