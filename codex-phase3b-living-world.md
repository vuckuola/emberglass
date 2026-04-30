# Emberglass Phase 3B — Living World Expansion

## Context
Emberglass is a browser JRPG (Phaser 3 + React + TypeScript + Vite). We just completed Milestone A (premium presentation + combat juice). Now implement **Milestone B: living world expansion**.

The game currently has:
- 20x15 tile overworld with 6 areas (Luma Quay, home strip, East Field, Moonwake Shrine, Verdant Archive, Skywell approach)
- NPCs: Guide Rin, Elder Maelin, Peddler, Mira (recruitable ally), Pip (pet emberfox)
- Home restoration loop: warmth → garden → workshop (3 stages)
- 5 battles including 2 bosses
- Toast/banner system for events and area transitions
- Route ribbons, landmark arches, gate blockers for gated areas

## What feels "dead" right now (what to fix)

### 1. NPC reactions are static — they only speak on player interaction
**Fix:** Add ambient NPC idle behaviors:
- Guide Rin should have a subtle pacing tween (2 tiles back and forth along a short path) when idle
- Peddler should have a "browsing" head-bob or side-to-side sway
- Elder Maelin should stay mostly still but have a rare slow lean/shuffle
- Mira (once recruited) should occasionally turn to face the player when player is within 3 tiles
- These should be lightweight tweens using the existing `this.tweens` API — no physics or pathfinding needed

### 2. Home restoration feels text-only — no visual payoff on the map
**Fix:** Add visual home upgrade indicators:
- When `home.warmth = 1`: draw a warm-orange glow/shadow beneath the HOME_TILE and change tile tint to warm amber
- When `home.garden = 1`: add small green circles/dots around HOME_TILE representing planted herbs
- When `home.workshop = 1`: add a small golden lens/diamond shape above HOME_TILE
- These visual indicators must persist across scene refreshes (re-drawn in create() based on saveData.home state)
- Add a small "Home" label text near HOME_TILE that shows progress like "Home 1/3", "Home 2/3", "Home 3/3"

### 3. No ambient world beats — the overworld feels lifeless between events
**Fix:** Add ambient world touches:
- Floating ember particles: 5-8 small orange/yellow circles that drift slowly upward across the map, wrapping from bottom to top. Use tweens with random delays/durations (3000-7000ms). Alpha 0.2-0.5. Destroy and recreate on loop or use yoyo with wrap.
- Water shimmer: tiles marked 'B' in MAP_LAYOUT should have a subtle pulsing alpha overlay (0.03-0.08 range, sine wave, 2000ms cycle) using a single rectangle overlay per water tile group
- Area label pop: when player enters a new area zone for the first time in a session, briefly show the area name in a large semi-transparent text (like "LUMA QUAY", "EAST FIELD") that fades after 2 seconds. Track lastArea in a local variable, compute zone from player tile position

### 4. Walking feels flat — no footstep feedback or directional dust
**Fix:** Add subtle walk feedback:
- When the player sprite is in walk animation (isMoving), spawn a tiny dust puff (small grey circle, alpha 0.3, scale up 0.5→1.5, fade out over 300ms) at the player's feet every ~300ms
- Use a simple timer check in the update loop — no need for a Phaser particle system

### 5. Mira has no visible presence after recruitment
**Fix:** Add a Mira companion sprite that follows the player:
- After `mira_recruited` flag is set, draw a small companion indicator (colored circle + label "Mira") that follows 1 tile behind the player (opposite of facing direction), lerping toward target position
- Use the existing pet follower pattern (`this.petFollower`) as reference but make Mira follow on the opposite side from Pip
- Mira indicator should only appear when both mira_recruited flag is set and the player is NOT in a battle/busy state

### 6. Pet Pip is just a plain orange circle — needs more character
**Fix:** Upgrade Pip's visual:
- Replace plain circle with a more expressive shape: draw 2 triangles for ears and a small white circle for a nose/mouth area on top of the orange body
- Add a small bobbing animation when idle (slightly faster than current 780ms — try 600ms with a larger range)
- When player is moving, Pip should have a "gallop" effect — slightly larger bounce amplitude

### 7. The signpost interaction is just a single toast — make it more useful
**Fix:** Expand signpost into a multi-line directional guide:
- Instead of one long toast, show 2-3 sequential toasts (200ms apart) listing discovered routes:
  - "◄ North: Elder Maelin's quarters"
  - "► East: Guardian Field → Moonwake Shrine"  
  - "▼ South: Home, Bell Thicket, Verdant Archive"
  - Only show routes the player has actually discovered (based on flags)

### 8. Endgame completion card is generic — make it feel earned
**Fix:** Improve `showDemoCompletionCard()`:
- Show play time if available (from saveData.playTime or a simple elapsed timer)
- List key milestones achieved: "Shrine purified", "Thornheart felled", "Skywell restored"
- Show party final levels
- Add a warm glow background effect

## Architecture rules
- ALL changes go in `src/game/scenes/OverworldScene.ts` unless a new helper is clearly needed
- Do NOT rewrite existing systems (SaveSystem, BattleScene, BootScene, etc.)
- Keep existing MAP_LAYOUT, tile positions, interaction flow, objective system, battle triggers intact
- Use Phaser tweens for animations — no physics, no particle emitters
- New visual elements must be depth-sorted properly (use setDepth consistently)
- All new elements drawn in create() must be stored on `this` (e.g. `this.emberParticles = [...]`) so they can be cleaned up
- Preserve existing showToast/showEventBanner/showAreaBanner methods
- If you add new methods, follow existing naming conventions (camelCase, descriptive)

## Validation
After all changes:
1. Run `npx tsc --noEmit` — must pass with zero errors
2. Run `npm run build` — must succeed (chunk-size warning is OK)
3. Run `node qa-runtime.mjs` — must pass
4. Check that existing NPC interactions, home restoration, battle triggers, save/load, menu, and route gating all still function correctly
5. Do NOT change battle flow, save schema, or objective text constants

## Files to modify
- `src/game/scenes/OverworldScene.ts` — primary target for all living-world changes
- `qa-runtime.mjs` — add/update QA assertions for new features if needed

## Files to NOT modify
- `src/game/systems/SaveSystem.ts` — no save schema changes
- `src/game/scenes/BattleScene.ts` — no battle changes
- `src/game/scenes/BootScene.ts` — no asset loading changes
- `src/game/data/*.ts` — no data changes
- `scripts/generate_assets.py` — no asset generation changes
- `src/game/config.ts` — no config changes
