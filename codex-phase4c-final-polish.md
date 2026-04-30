# Emberglass Phase 4C — Final Action RPG Polish

## Context
Phase 4A converted turn-based JRPG to Diablo-style action RPG. Phase 4B added skills, block, dash, item drops, death/respawn. The game works: 40×30 map, WASD movement, click/space attack, 1-2-3 skills, SHIFT block, Q potion, enemies spawn & chase, loot drops on ground.

## Your Task
Add the following polish features to `src/game/scenes/OverworldScene.ts`. Do NOT rewrite — ADD to existing code surgically.

### 1. Minimap (toggle M key)
- Top-right corner, semi-transparent box
- Dots: white = player, red = enemies, green = NPCs, yellow = loot
- Shows nearby area (radius ~20 tiles)
- Toggle with M key, default hidden
- Size: ~120×90 px, border

### 2. Region-based enemy spawns
- Enemies near quay (left side): mostly Ash Slime, Frost Shard (easier)
- Enemies near field (center): mix of enemies (medium)
- Enemies near archive/skywell (right): Storm Wisp, Hollow Wisp, Clay Sentinel (harder)
- Update `spawnEnemiesForStage()` to consider player position / map region

### 3. Boss encounters
- When stage requires boss fight (e.g., `field_marker_battle`, `archive_battle`), spawn a BIG boss enemy:
  - 3× normal sprite size, unique color tint (red glow)
  - 5× HP, 2× damage, slower movement
  - Health bar at top of screen (like Dark Souls boss bar)
  - Name displayed above HP bar
  - On kill: big explosion, screen shake, advance story
- Boss types: use existing enemy data but scale up. Field boss = big Clay Sentinel, Archive boss = big Storm Wisp.

### 4. Experience bar + level indicator
- Below HP/MP bars
- Thin bar showing XP progress to next level
- Level number displayed
- Flash effect on level up (already exists from 4B, just add the bar)

### 5. Treasure chests in the map
- Place 3-5 treasure chests in the map (at specific tile positions)
- Visual: brown box with gold trim (rectangle with details)
- Walk up + press E to open
- Random loot: gold, potion, equipment, wind charm
- One-time open per save (track in saveData.flags)
- Opening animation: lid opens (sprite y offset), sparkle particles

### 6. Pip the pet companion
- Small glowing orb that follows the player with slight delay (lerp)
- Circles around player when idle
- Color: warm amber (#f2d16b)
- Size: ~6px radius
- Depth: below player

## Technical constraints
- Only modify `src/game/scenes/OverworldScene.ts` unless absolutely necessary
- Keep existing code working — this is additive
- All pixel art must be programmatic (Phaser graphics primitives)
- TypeScript strict mode — no `any` unless existing code already uses it
- Run `npx tsc --noEmit` after changes to verify types
- Run `npm run build` to verify build

## Do NOT
- Add new scene files
- Change the title screen
- Modify CombatSystem.ts (it's deprecated)
- Add audio (no audio files exist for these actions)
- Use external assets
