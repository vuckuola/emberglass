# Emberglass Runtime QA Report

Date: 2026-04-29

## Verification Summary
- `npx tsc --noEmit` ✅
- `npm run build` ✅
- Runtime smoke/integration flow via Playwright (`qa-runtime.mjs`) ✅
- Browser page errors during QA: **0**
- Browser console errors during QA: **0**

## Covered Flows
1. Title scene loads from clean storage
2. Title buttons respond correctly
   - New Game
   - Continue without save
   - Continue with corrupt save data safely blocked
   - Settings
   - Credits
3. Overworld no-op interactions explain next step instead of failing silently
4. Overworld menu open/close via keyboard
5. Field battle gate blocked until marker progression
6. Chest rewards + auto-equip
7. Core overworld interactions
   - Elder
   - Marker
   - Shop
   - Tide Bell
   - Mural
   - Watch Lantern
8. Field battle
   - Attack button click
   - target selection click
   - Item flow
   - Defend flow
   - repeated command/turn-state response remains stable
   - return rewards/objective application
9. Shrine route
   - elder reward unlock
   - shrine gate
   - pilgrim font
10. Boss battle
    - intro messaging
    - Escape blocked by seal
    - Attack flow
    - return rewards/objective application
11. Save point persistence
12. Continue loads persisted save

## Bug Found and Fixed
### BattleScene stale UI references across repeated entries
**Symptom:** browser page error `Cannot read properties of undefined (reading 'sys')` when entering BattleScene again after a previous battle.

**Root cause:** `BattleScene` instance was reused by Phaser, but arrays/maps holding UI object references (`commandTexts`, `optionTexts`, `timelineDots`, `entityViews`) were not reset on `create()`. Second battle reused stale destroyed objects, and `setCommandsEnabled()` touched dead interactive objects.

**Fix applied:** reset transient BattleScene collections/state at the top of `create()` before rebuilding battle UI.

## Phase 18: Showcase Polish (v0.18.0)

### Changes
- OverworldScene: Gold HUD accents, styled toasts with panel + gold border, banner queue system, contextual interaction prompts, menu overlay with gold dividers + diamond decoration, ambient particles (fireflies near skywell + grass leaf motes)
- BattleScene: Entity ellipse shadows, wider HP bars (90px) with 3-color gradient, MP bar track styling, Georgia serif labels, red hit flash, death dissolve particles, victory sparkles, turn indicator pulsing gold glow, polished bottom command panel with gold border + numbered labels (1-5)
- TitleScene: Version updated to v0.18
- Assets: 5 new 1024x1024 concept sheets generated via GPT-5.4-image (9Router), cropped/scaled to replace existing Phase 17 assets: tileset, hero sprite sheet, NPC images, props (chest, shrine gate, lantern), UI panel frame

### Verification
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS
- `qa-runtime.mjs` 32/32 checks: PASS
- Live site: https://vuckuola.github.io/emberglass/
- Commits: `811db22` (polish), `0bed100` (assets)

## Notes
- Build still shows only the known Vite large chunk warning.
- QA script used: `qa-runtime.mjs`
