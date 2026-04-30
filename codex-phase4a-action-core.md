# Emberglass Phase 4A — Action RPG Core Conversion

## Context
Emberglass is currently a turn-based JRPG (Phaser 3 + React + TypeScript + Vite). We are converting it to a **Diablo-style top-down action RPG** where combat happens directly on the overworld map — no separate battle scenes.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style
- Do NOT change SaveData interface or SaveSystem validation schema
- Keep all existing story/objective/NPC/shop/home systems working
- Use only programmatic graphics (rectangles, circles, arcs, polygons)
- No console.log in production code
- Keep the existing tile-based map but EXPAND it (see Task 1)

## Current Architecture
- `OverworldScene.ts` — tile-based movement, NPC interactions, story progression (~2182 lines)
- `BattleScene.ts` — separate turn-based battle scene
- `CombatSystem.ts` — turn-based combat math (~666 lines)
- `enemies.ts` — enemy data (stats, skills, weaknesses)
- `characters.ts` — player character data
- `SaveSystem.ts` — save/load with stage/objective/party/inventory
- Map: 20×15 tiles, TILE_SIZE=48, PLAYER_SPEED=160

## Task 1: Expand the Map

Change map dimensions and create a larger, more interesting layout:

```typescript
const MAP_WIDTH = 40
const MAP_HEIGHT = 30
```

Create a new MAP_LAYOUT that is 40 wide × 30 tall. The map should have distinct areas:
- **Quay** (top-left): Starting village, walls around perimeter, grass/path tiles, Elder, Guide, Merchant, Home, Chest
- **Field** (top-right): Open grassland with scattered trees, Shrine gate, Shrine interior, Boss tiles
- **Wetlands** (bottom-left): Water tiles mixed with paths, Tide Bell, Watch Lantern, Mural, Ally, Pet
- **Archive** (bottom-center): Dense area, Archive entry, Mid-boss
- **Skywell** (bottom-right): Final area, Final boss, Save point
- **Connecting paths** between areas

Use tile types: W=wall, G=grass, P=path, B=water, F=forest(decorative but walkable), R=rock(unwalkable)

Keep ALL existing tile constants (SAVE_TILE, CHEST_TILE, etc.) but update their coordinates to fit the new 40×30 layout. Place them in logical positions:
- SAVE_TILE near home (quay area)
- CHEST_TILE somewhere in quay
- GUIDE_TILE, ELDER_TILE, MERCHANT_TILE in the village
- HOME_TILE in quay
- SHRINE_GATE_TILE, SHRINE_FONT_TILE, SHRINE_SEAL_TILE in the field/shrine area
- FIELD_BATTLE_TILE — remove this concept (battles happen in real-time now)
- TIDE_BELL_TILE, WATCH_LANTERN_TILE, MURAL_TILE in wetlands
- ALLY_TILE, PET_TILE near wetlands
- ARCHIVE_TILE, MID_BOSS_TILE in archive area
- FINAL_BOSS_TILE in skywell area

## Task 2: Real-Time Player Movement

The player is already tile-based. Convert to smooth pixel movement:

- Remove tile-snapping — player moves freely in pixel space
- Keep WASD/arrow key input
- Add diagonal movement (W+D = NE, etc.)
- Speed remains ~160px/s
- Player collides with wall tiles (check tile at player position)
- Keep the player sprite (or rectangle if no texture)

Add new controls:
- **Space/Click** — Primary attack (swing weapon in facing direction)
- **Shift** — Dash/dodge roll (brief speed burst + invincibility frames, 1.5s cooldown)
- **E key** — Interact (was Enter/Space before, now E for interact since Space=attack)
- Player has a `facing` direction that follows movement direction (already exists)

## Task 3: On-Map Enemies (Enemy Spawns)

Add real-time enemy entities that walk around on the map:

```typescript
type MapEnemy = {
  id: string
  enemyId: string  // references enemies.ts data
  sprite: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc
  hpBar: Phaser.GameObjects.Graphics
  hpBarBg: Phaser.GameObjects.Graphics
  nameText: Phaser.GameObjects.Text
  currentHp: number
  maxHp: number
  currentMp: number
  maxMp: number
  stats: CharacterStats
  x: number
  y: number
  speed: number
  element: string
  weaknesses: string[]
  resists: string[]
  skills: EnemySkill[]
  state: 'idle' | 'chase' | 'attack' | 'hurt' | 'dead'
  aggroRange: number  // pixels — how far they detect player
  attackRange: number  // pixels — how close they need to attack
  attackCooldown: number  // ms between attacks
  lastAttackTime: number
  wanderTimer: number
  wanderTarget: { x: number; y: number } | null
  hitFlashTimer: number
  isBoss: boolean
  dead: boolean
  expReward: number
  goldReward: number
}
```

Spawn enemies based on the current game stage:
- `quay` stage: spawn 3-4 weak enemies in field area
- `field` stage: spawn 5-6 enemies (mix of easy/medium)
- `shrine` stage: spawn 6-8 enemies + shrine guardian (boss) near shrine tiles
- `archive` stage: spawn 8-10 enemies + mid-boss near archive
- `skywell` stage: spawn 8-10 enemies + final boss near skywell
- `homecoming`: no enemies

Enemies should:
- Wander randomly when player is far away (pick random nearby tile, walk to it, pause, repeat)
- Chase player when within aggroRange (200px for regular, 250px for bosses)
- Attack when within attackRange (50px)
- Have a brief attack animation (red flash on player or weapon swing visual)
- Drop items when killed

## Task 4: Real-Time Combat System

Add combat directly to OverworldScene (DO NOT use BattleScene for regular combat):

### Player Attack
When Space is pressed:
1. Create a "weapon swing" visual — a small arc/rectangle in facing direction, lasts 200ms
2. Check if any enemy's center is within the swing hitbox (60px range, 90° arc in facing direction)
3. If hit: calculate damage using `ATK * 1.5 - target.DEF * 0.5` (simplified real-time formula)
4. Enemy flashes white when hit, HP bar updates
5. Show damage number floating up from enemy position

### Enemy Attack
When enemy is in attack state and cooldown is ready:
1. Brief wind-up visual (enemy tints red for 300ms)
2. Deal damage to player: `enemy.ATK * 1.2 - player.DEF * 0.4`
3. Player screen flashes red briefly (100ms)
4. Player HP updates on HUD

### Player Stats
- Use saveData.party[0].currentHp as player HP
- ATK = party[0] base ATK + equipment bonuses
- DEF = party[0] base DEF + equipment bonuses
- Show HP bar below or above the player sprite
- When HP reaches 0, show "Defeat" overlay and respawn at save point (keep gold/items)

### Dash/Dodge
When Shift is pressed and cooldown is 0:
- Player moves 2× speed for 300ms in facing direction
- During dash, player is invulnerable (alpha flashes)
- 1.5 second cooldown
- Visual: brief afterimage trail (2-3 fading copies)

### Item Use (Q key)
- Press Q to use health potion from inventory (if available)
- Heals 50 HP
- Removes 1 health_potion from inventory
- Brief green flash on player
- Show "+50 HP" floating text

## Task 5: Enemy HP Bars & Damage Numbers

For each enemy on the map:
- Small HP bar above their sprite (20px wide, 3px tall)
- Green when >50% HP, yellow 25-50%, red <25%
- Name text above HP bar (small, 10px)

Damage numbers:
- When enemy takes damage, show number floating upward from their position
- White text for normal damage, yellow for critical (>1.5× average), red for player damage
- Numbers fade out and drift upward over 1 second, then destroy
- Use this.add.text() with a tween for the float effect

## Task 6: Boss Fights

Boss enemies (shrine guardian, thornheart, cartographer's lie) should:
- Be larger sprites (1.5× size)
- Have unique colors (guardian=blue, thornheart=green, cartographer=purple)
- Spawn only when triggered by story (approach their tile while that objective is active)
- Have a brief intro (camera zoom + name banner)
- Drop unique loot
- When defeated, advance the story objective just like the old battle system did

Keep the old boss battle IDs for story tracking but handle the result in overworld directly.

## Task 7: Update HUD

Modify the existing HUD to show action RPG info:
- Player HP bar (prominent, top-left)
- Player MP bar (below HP)
- Level display
- Gold display
- Active quest/objective
- Enemy kill count (optional, nice to have)
- Remove turn-based references

## Task 8: Disable Old Battle Scene

Keep BattleScene.ts file but:
- Remove the scene from scene registration if it's added in game config, OR
- Simply don't call `this.scene.start('BattleScene')` anymore
- Remove `startFieldBattle()`, `startShrineGuardianBattle()`, etc. methods from OverworldScene
- Remove `RANDOM_ENCOUNTER_POOLS` (enemies now spawn on map)
- Keep `RANDOM_ENCOUNTER_POOLS` data in enemies.ts for reference but the spawning logic changes

## Files to Modify
- `src/game/scenes/OverworldScene.ts` — major rewrite: map expansion, enemies, combat, HUD
- `src/game/systems/CombatSystem.ts` — add real-time damage calculation method
- `src/game/data/enemies.ts` — add spawn position data per enemy type

## Files to NOT Modify
- `src/game/systems/SaveSystem.ts` — do not change save schema
- `src/game/scenes/TitleScene.ts` — do not change
- `src/game/scenes/BattleScene.ts` — leave file but stop using it
- `scripts/generate_assets.py` — do not change

## Validation
1. `npm run typecheck` — must pass
2. `npm run build` — must succeed
3. The game should start and show the overworld with enemies walking around
4. Player should be able to move, attack enemies, and see damage numbers
5. Killing all enemies should still advance objectives (boss kills)
