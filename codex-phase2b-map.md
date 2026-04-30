Polish Emberglass overworld map readability and progression clarity without rewriting the whole architecture.

Repo: /home/adm-herm/emberglass
Main file to inspect first: src/game/scenes/OverworldScene.ts
Also update qa-runtime.mjs if progression/gating expectations change.

Problems to fix:
1. Current map feels messy / abstract.
2. Player cannot clearly tell where they can go next.
3. Obstacles/blockers are not visually obvious.
4. Areas do not feel distinct enough.

Implement a focused map polish pass:
- Keep one scene if easier, but make it FEEL like multiple connected areas: Luma Quay, South Garden/Home strip, East Field, Moonwake Shrine lane, Verdant Archive lane, Skywell approach.
- Replace abstract/random blocker feeling with obvious geography: cliffs, hedges, fences, fallen bridge, root walls, shrine gate, archive overgrowth, skywell barrier.
- Rework MAP_LAYOUT and object positions so routes are readable and progression is legible.
- Add clear visual blockers and openable chokepoints tied to flags/progression.
- Add subtle area labels / gateway signage / path language so players understand where to go.
- Improve prompt/toast text when a route is blocked so it explains why.
- Keep save/battle/story systems intact.
- Preserve deterministic asset pipeline and existing gameplay beats.
- Do not break current Phase 2 route.

Also:
- strengthen interaction prompts around blocked routes
- ensure final routes visually open after milestones
- update runtime QA to assert at least one blocked-route message and one newly opened route state if needed

Validation before finishing:
- npm run typecheck
- npm run build
- npm run demo:check
- commit changes

Use Codex GPT-5.5 via current repo conventions. DO NOT plan endlessly; modify files directly.