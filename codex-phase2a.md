Phase 2A for Emberglass. DO NOT plan — start writing immediately.

Repo: /home/adm-herm/emberglass
Goal: turn the current 15-minute slice into a ~30-minute browser JRPG with stronger story progression.

Read first:
- src/game/scenes/OverworldScene.ts
- src/game/scenes/BattleScene.ts
- src/game/systems/SaveSystem.ts
- src/game/data/characters.ts
- src/game/data/items.ts
- src/game/data/enemies.ts
- src/game/data/bosses.ts
- qa-runtime.mjs
- docs/plans/2026-04-30-phase2-30min-rpg-expansion.md

Implement in this pass:
1. Expand story line into a clear 30-minute route with multiple stages/areas and stronger objective chain.
2. Add a recruitable friend/companion beat that feels like meeting a real ally, not a menu toggle.
3. Add a pet system: unlock one pet companion, show it in overworld, and let it provide one simple gameplay benefit.
4. Add a small home/base restoration loop with 2-3 upgrades saved in save data; use it as an emotional hub and progression payoff.
5. Add several new encounters including at least one mid-boss and one final boss.
6. Expand items/equipment/rewards so progression feels meaningful.
7. Update title/continue/save behavior if needed for new progression data.
8. Update runtime QA to validate the expanded route, story flags, pet unlock, home restoration, and final clear.

Rules:
- Keep Phaser 3 + TypeScript + Vite.
- Preserve existing systems unless a targeted extension is needed.
- Keep code deterministic and testable.
- Keep asset references compatible with later asset-polish pass.
- You may add new data/system files if useful.

Before finishing run:
- npm run typecheck
- npm run build
- npm run demo:check
- git add -A
- git commit -m "Expand Emberglass into a 30-minute JRPG slice"

If validation fails, fix it before commit.