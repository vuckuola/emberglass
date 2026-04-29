# Phase 17: Pokémon-Style Visual Overhaul

## Goal
Transform the overworld from a ugly flat green grid to a polished Pokémon-style top-down RPG look. The game currently renders a green-tiled map with white stroke grid lines, tiny sprites at 0.5 scale, and no visual depth. Make it look like a classic GBA Pokémon game (Ruby/Sapphire/Emerald era) but with the existing AI-generated assets.

## What to change

### 1. Map Rendering (createMap) — BIGGEST change
The current `createMap()` loops through 20x15 tiles and draws:
- Green rectangles with white stroke for walkable tiles
- Dark rectangles for walls
- A single tileset image as tileSprite fallback

**Replace with a proper tilemap approach:**

**Tile types (use COLORS, no external assets needed for tiles):**
- `grass` — rich green base, add 2-3 shade variations for visual interest (no grid lines!)
- `path` — sandy/dirt color (#c4a882 or similar), used for walking paths
- `wall` — dark stone/cliff color, solid blocks the player
- `water` — blue animated tiles (optional, add a few water tiles)
- `flower_grass` — grass with tiny colored dots (flowers)

**Map layout — design a proper village layout (Luma Quay):**
Create a 2D array map layout where:
```
W = wall, G = grass, P = path, F = flower grass, . = water
```
Design something that looks like a Pokémon village:
- Border walls around the entire map
- Paths connecting key locations (Elder house, shop area, quay/dock, shrine approach)
- Grass patches in between
- Some flowers near the guide/save point
- Clear open areas around NPCs and interactable objects
- The "interior walls" should look like building walls

**No more white grid lines!** Use subtle tile borders instead. Each tile should have slight color variation for natural feel.

### 2. Sprite Scaling
Currently all sprites use `.setScale(0.5)` which makes them tiny on 48px tiles.

**Change:**
- Player sprite: `.setScale(1.0)` — should fill most of a tile (48x48 tile, sprite is 96x144 so actually use 0.4 or adjust TILE_SIZE to be bigger)
- Actually, better approach: **change TILE_SIZE to 32** and scale sprites to 0.35 for a tighter, more Pokémon-like feel where characters are larger relative to the map. This creates more tiles (30x20) for a bigger-feeling map.
- OR keep 48px tiles but make sprites bigger (0.7 scale)
- **Best approach**: Keep TILE_SIZE=48, use scale 0.65 for characters so they feel substantial. The map will feel more open like a modern Pokémon game.

### 3. drawNpc() improvements
- Remove the floating label text ABOVE the NPC — in Pokémon, you see the name only when you talk to them
- Instead, add a small shadow circle under each NPC
- Increase scale from 0.5 to 0.65
- Remove the bobbing tween (keep it subtle: only 1-2px)

### 4. drawMarker() improvements  
- Scale up from 0.5 to 0.6
- Remove the rotation tween — objects shouldn't spin in Pokémon style
- Keep a subtle scale pulse (0.6 to 0.63, not 0.53)
- Add shadow circles under markers too

### 5. createBackdrop()
- Keep the background image if it loads
- Remove the particle motes or make them much more subtle (alpha 0.06 instead of 0.16)
- The background should NOT be visible through the tilemap if tiles are opaque

### 6. Player improvements
- Remove the playerOutline rectangle — replace with a simple oval shadow
- Make the player slightly bigger (scale 0.65)

### 7. HUD improvements
- Make the objective panel more compact and cleaner
- Use a proper RPG-style box with rounded corners (Phaser doesn't have native rounded rect, but use a dark panel with thin border)
- Area name text: put it at top-center, not top-right

### 8. createTouchControls()
- Make buttons slightly smaller and more transparent
- Move D-pad further down so it doesn't overlap gameplay

## Implementation details

**New map layout array** (20x15, W=wall, G=grass, P=path, F=flower, B=building_wall):
```typescript
const MAP_LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWW',
  'WGGGGPPPPGGGGGPGGGW',
  'WGFGGPPPPGGGGGPGGGW',
  'WGFGGPPPPGGGGWPGGGW',  // Elder area with building wall
  'WGGGGPPPPGGGGWPGGGW',
  'WGGGGGGGGGGGGGGGGGGW',  // Open area
  'WWWWWBBBBGGGGGGGGGGW',  // Building wall (old interior wall)
  'WGGGGGGGGGGGGGGGGGGW',
  'WGFGGGGGGGGGGGGGGPGW',  // Peddler area + path east
  'WGGGGGGGGGGGGGGGWPGW',
  'WGGGGGGGGPPGGGGWWPGW',  // Old interior wall area
  'WGGGGGGGGPPGGGGGGGGW',
  'WGGGGGFGGGPGGGGGFGGW',  // Save point area + flowers
  'WGGGGGGGGPPGGGGGGGGW',
  'WWWWWWWWWWWWWWWWWWWW',
]
```
Adjust this to make a nice village. Key locations:
- Elder at (10, 3) — north, behind building wall at x=13
- Guide at (8, 3) — north path
- Peddler at (6, 9) — west area
- Save point at (5, 5) — central
- Chest at (15, 8) — east
- etc.

**IMPORTANT:** Keep all existing tile positions (SAVE_TILE, ELDER_TILE, etc.) UNCHANGED. The map layout must be designed AROUND those positions. Do NOT move any game objects.

**Tile rendering approach:**
```typescript
// Instead of rectangles with strokes, use filled tiles with slight color variation
const grassColors = [0x3d8b37, 0x4a9944, 0x368232, 0x45913f] // 4 grass shades
const pathColor = 0xc4a882
const wallColor = 0x5a4a3a // Brown/stone wall
const wallTopColor = 0x7a6a5a // Lighter top of wall for 3D effect

// For grass tiles, use: grassColors[(tileX * 7 + tileY * 13) % 4] for deterministic variation
// For walls, draw a slightly raised look (darker bottom, lighter top strip)
```

**DO NOT add new asset files.** Use only colors for tiles. The AI-generated images are only for: characters, NPCs, enemies, objects, icons, backgrounds.

**DO NOT break any existing game logic.** Keep all interactions, dialogues, quest flow, battle transitions, save system, etc. exactly the same. Only change visual rendering.

## Files to modify
1. `src/game/scenes/OverworldScene.ts` — the main target
   - `createMap()` — complete rewrite
   - `drawNpc()` — scale, shadow, remove label, subtle bob
   - `drawMarker()` — scale, shadow, no rotation
   - `createPlayer()` — remove outline rect, use shadow
   - `createBackdrop()` — tone down particles
   - `createHud()` — cleaner, more compact
   - `createTouchControls()` — smaller, repositioned
   - `createObjects()` — remove circles for save point, use a proper sprite/shape

## Verification
After making changes:
1. Run `npx tsc -b` — must pass with no errors
2. Run `npm run build` — must succeed
3. All existing functionality preserved (no game logic changes)
