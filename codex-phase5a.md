# Phase 5A: Party Companions — Visual + Following

Emberglass is a Phaser 3 action RPG. Currently only Nara (party[0]) is visible on the overworld. Kael and Io exist in saveData.party[1] and [2] but have no sprites. Add them as visible companions.

## Context
- OverworldScene at `src/game/scenes/OverworldScene.ts` (2814 lines)
- Mira companion follows player via `updateMiraCompanion()` — similar pattern for Kael/Io
- Pip pet follows via `updatePetFollower()` — offset follow pattern
- Characters defined in `src/game/data/characters.ts`:
  - Kael: earth element, tank (hp:104, atk:18, def:15), color suggestion: earthy green #5c8a4d
  - Io: light element, healer/mage (hp:74, mp:46, mag:20), color suggestion: light blue #7fb3ff
- `this.saveData.party[0]` = Nara, `[1]` = Kael, `[2]` = Io
- Each party member has: characterId, level, currentHp, currentMp, equipment, skills
- `scaleCharacterStats(character, level)` already exists to calculate stats from level
- `getPlayerCombatStats()` already gets Nara's stats with equipment bonuses

## Tasks

### 1. Add companion type and properties to OverworldScene
Add a `PartyCompanion` type (similar to MapEnemy style):
```
type PartyCompanion = {
  characterId: string
  name: string
  container: Phaser.GameObjects.Container
  body: Phaser.GameObjects.Rectangle
  nameText: Phaser.GameObjects.Text
  hpBar: Phaser.GameObjects.Graphics
  hpBarBg: Phaser.GameObjects.Graphics
  mpBar: Phaser.GameObjects.Graphics
  x: number
  y: number
  partyIndex: number  // 1 or 2
  state: 'follow' | 'idle' | 'dead'
  offsetX: number
  offsetY: number
  attackCooldown: number
  lastAttackTime: number
  hitFlashTimer: number
}
```

Add properties:
- `private companions: PartyCompanion[] = []`
- `private companionHudGraphics?: Phaser.GameObjects.Graphics`

### 2. Create companion sprites in create() method
After the player sprite is created, create Kael and Io containers:
- Kael: green rectangle (30x30) with name text above, in a container
- Io: blue rectangle (26x26) with name text above, in a container
- Each has HP bar (green) and MP bar (blue) graphics objects
- Set depth like player (depth 10.5 for Mira reference)
- Initialize positions from player position + offsets
- Kael offset: slightly behind-left of player (-40, -20)
- Io offset: slightly behind-right of player (-20, -40)
- Draw initial HP/MP bars based on saveData.party[i].currentHp/currentMp and scaled stats

### 3. Add updateCompanions() method called from update()
Similar to updateMiraCompanion but with fixed offsets:
- If companion is dead, show it dimmed (alpha 0.3) and skip
- Otherwise, lerp toward (player.x + offsetX, player.y + offsetY) with factor 0.08
- Clamp positions to map bounds
- Check wall collisions (reuse isWallAtWorld)
- Update HP/MP bars every frame based on saveData.party[partyIndex]
- Call updateCompanionBars() for each companion

### 4. Add updateCompanionBars(companion) method
- Get member = saveData.party[companion.partyIndex]
- Get max stats via scaleCharacterStats
- Draw HP bar (green #4ade80) and MP bar (blue #60a5fa) above companion sprite
- Position bars at companion.x, companion.y - 20 (HP) and -16 (MP)
- Bar width: 32px, height: 3px

### 5. Add companion creation helper: createCompanion(partyIndex)
- Get character data from CHARACTERS[party[partyIndex].characterId]
- Create container, rectangle body, name text, HP/MP bar graphics
- Return PartyCompanion object
- Call this in create() after player setup for indices 1 and 2

### 6. Reset companions in create() method
Add cleanup in the reset block (where other arrays are cleared):
```
this.companions.forEach(c => c.container.destroy())
this.companions = []
```

### 7. Add companions to HUD refreshHud()
Show companion HP in the main HUD text. Extend inventoryText line to include:
"Kael HP:XX/YY Io HP:XX/YY" (compact, after the existing info)

### 8. Update handlePlayerDefeat()
When player dies, also reset companions to follow position (they teleport to save point too).

## CRITICAL RULES
- Do NOT use `letterSpacing` in any text style — Phaser 3.80.1 does NOT support it
- Do NOT upgrade Phaser or React versions
- Keep all companion code IN OverworldScene.ts — do NOT create new files
- Reuse existing methods: isWallAtWorld, worldToTile, tileCenter, scaleCharacterStats, showFloatingText, refreshHud, persist
- Use the exact same Phaser patterns as Mira companion (container + add to scene + setDepth)
- Run `npx tsc --noEmit && npm run build && git add -A && git commit -m "Phase 5A: party companion sprites, following, and HP/MP bars"` when done
