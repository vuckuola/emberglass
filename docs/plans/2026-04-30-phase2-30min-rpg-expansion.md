# Emberglass Phase 2 Implementation Plan

> **For Hermes:** Use subagent-driven-development + Codex passes to implement this plan in validated chunks.

**Goal:** Turn Emberglass into a more complete 30-minute showcase JRPG with a stronger story line, recruitable friend/companion beats, a pet, a simple home-building/restoration loop, multiple stages, better bosses, and upgraded asset/content polish.

**Architecture:** Keep Phaser 3 + TypeScript + Vite. Expand the current vertical slice by layering structured progression on top of the existing save/battle/overworld systems instead of rewriting the game. Use deterministic Pillow-generated assets and a small number of focused scenes/maps/state machines so the result stays testable and deployable.

**Tech Stack:** Phaser 3, TypeScript, Vite, Playwright QA, Pillow asset generator, Codex GPT-5.5 via 9Router.

---

## Target experience
- Playtime target: **~30 minutes** for a first clear
- Story arc: intro village problem → recruit friend → earn pet companion → restore ruined home/base → cross 3+ stages → defeat mid boss + final boss → return to rebuilt home epilogue
- Systems target:
  - stronger quest/objective flow
  - more NPC dialogue variety
  - recruitable ally/friend progression
  - pet follower with simple support utility
  - home restoration with 2-3 upgrades
  - multi-stage exploration and boss gates
  - better item/equipment/stage/boss content
  - updated QA/runtime validation for the new path

## Execution phases

### Phase 2A — Story + progression foundation
**Objective:** Expand save data, quest flags, story beats, and map/stage progression so the game supports a 30-minute route.

**Files likely touched:**
- `src/game/systems/SaveSystem.ts`
- `src/game/scenes/TitleScene.ts`
- `src/game/scenes/OverworldScene.ts`
- `src/game/scenes/BattleScene.ts`
- `src/game/data/characters.ts`
- `src/game/data/enemies.ts`
- `src/game/data/bosses.ts`
- `src/game/data/items.ts`
- `qa-runtime.mjs`

**Deliverables:**
- New narrative arc and objective chain
- At least 3 major stage zones / progression areas
- Recruitable friend beat
- Pet unlock beat
- Home restoration state saved in save data
- New bosses/enemy encounters and reward hooks

### Phase 2B — Asset/content expansion
**Objective:** Upgrade generated assets and scene presentation to match the larger game slice.

**Files likely touched:**
- `scripts/generate_assets.py`
- `public/assets/generated/*`
- `src/game/assets/generatedAssets.ts`
- `src/game/scenes/OverworldScene.ts`
- `src/game/scenes/BattleScene.ts`

**Deliverables:**
- More character/NPC variants
- Pet sprite and house/building assets
- More stage tiles/props/markers
- More enemy/boss/item visuals
- Stronger stage identity per area

### Phase 2C — QA, balance, deploy
**Objective:** Ensure the full expanded loop is stable and ship it.

**Deliverables:**
- Typecheck/build/demo QA all pass
- Runtime script updated for the longer route
- GitHub Pages deploy success
- Live asset verification

## Constraints
- Preserve current stable stack; no Phaser 4 / React 19 rewrite
- Keep deterministic asset pipeline
- No fake analytics or mock data framing
- Use Codex for substantial code changes
- Keep the slice polished enough to demo, not just technically bigger

## Verification checklist
- `python3 scripts/generate_assets.py --validate`
- `npm run typecheck`
- `npm run build`
- `npm run demo:check`
- GitHub Actions Pages deploy success
- Live asset hash check for at least one updated Phase 2 asset
