Polish Emberglass overworld readability again. Work only inside the existing architecture; do NOT rewrite scenes or core systems.

Target file first: src/game/scenes/OverworldScene.ts
Also update qa-runtime.mjs if needed.

Goals:
1. Make each zone visually distinct at a glance: Luma Quay, South Garden/Home, East Field, Moonwake Shrine lane, Verdant Archive, Skywell Approach.
2. Make walkable routes unmistakable with stronger roads, bridges, stairs, arches, signposts, lane edging, or landmark props.
3. Make blocked routes readable before interaction: bigger gate silhouettes, stronger color contrast, obvious barrier shapes, clearer open-vs-closed state.
4. Reduce the “berantakan/dempet” feel without changing the whole engine. Safe local refactor of MAP_LAYOUT and decorative overlays is OK.
5. Preserve all Phase 2 progression, saves, battles, objectives, pet/home/ally flow, and existing deterministic asset pipeline.

Implementation guidance:
- Prefer stronger environmental storytelling over extra text.
- Add visible route landmarks near key transitions (field gate, shrine entry, archive entry, skywell climb).
- If an area opens later, the newly opened path should be visually wider/cleaner than before.
- Keep collision logic coherent with the visuals.
- Update or extend QA assertions so route clarity states are checked, not only toast text.

Validation before finishing:
- npm run typecheck
- npm run build
- npm run demo:check
- git commit with a clear message

DO NOT plan. Edit files now, validate, and commit.