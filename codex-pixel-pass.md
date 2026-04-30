You are in /home/adm-herm/emberglass.

Goal: replace the fake passive PNG look with a deterministic pixel-art asset pipeline that feels like a real web JRPG. Keep the stack stable and secure: DO NOT upgrade to Phaser 4 or React 19.

Do the work immediately. Do not spend time planning.

Tasks:
1. Rewrite/upgrade scripts/generate_assets.py so it generates a cohesive SNES/GBA-like asset pack with one restrained fantasy palette using Pillow only. No external image APIs. Preserve the existing generated asset filenames already used by the game.
2. Update the asset loading/integration so character assets are real sprite sheets, not static pasted portraits. The player in OverworldScene must animate while moving and face the movement direction. NPCs should at least feel alive (idle or simple 2-frame motion) when generated assets exist.
3. Integrate tileset_ember_quay into overworld map rendering so grass/path/water/walls feel like real stage tiles, while preserving current map layout, collisions, quest markers, and progression.
4. Keep battle scene, UI, save/load, and existing quest flow working.
5. Add a deterministic validation path for the asset generator (script or tests) that checks file existence and expected dimensions.

Constraints:
- Keep filenames under public/assets/generated compatible with existing game references, or update references safely if you must.
- Favor clear deterministic pixel art over ambitious but broken visuals.
- No mock data, no placeholder TODO output.
- Maintain latest stable safe stack already in repo.

Validation before finish:
- run the generator
- npm run typecheck
- npm run build
- npm run demo:check if practical; otherwise run the strongest available validation and explain any blocker in the commit message

If validation passes, commit your work with a clear message.