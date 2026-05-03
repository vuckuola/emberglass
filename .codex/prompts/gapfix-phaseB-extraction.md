# Emberglass Gap Fix — Phase B: OverworldScene Module Extraction

## Context
Emberglass is a browser Action RPG at ~/emberglass. The main game scene `OverworldScene.ts`
is 4277 lines with 364 `this.*` references across 242 methods. Every feature (combat, enemies,
companions, NPCs, map, UI, audio, camera, etc.) is crammed into one file. Any edit risks
breaking unrelated systems.

## CRITICAL RULES
- Do NOT use `letterSpacing` — Phaser 3.80.1 does not support it
- Do NOT upgrade Phaser or React
- Do NOT modify `vite.config.ts`
- Do NOT import `BattleScene` (deleted)
- The extraction MUST be behavioral-identical — zero gameplay changes
- Export all extracted classes/functions and import them in OverworldScene
- OverworldScene must still be the single Phaser.Scene — modules are helpers, not scenes
- Use `this.showToast()` for messages — only ONE toast at a time
- All existing QA tests (qa-runtime.mjs) must still pass after extraction

## Task: Extract OverworldScene into Modules

Extract the following systems from OverworldScene.ts into separate files under `src/game/systems/`:

### 1. `src/game/systems/MapRenderer.ts`
Extract all map-related methods:
- `createMap()` — tile rendering, TILE_DEFS lookup
- `renderTile()` — per-type tile dispatch
- `drawTileBorders()` — smooth transitions between tile types
- `drawGrassTile()`, `drawWaterTile()`, `drawWallTile()`, `drawPathTile()`, etc.
- `drawBridgeTile()`, `drawShrineDetails()`
- `checkGateOverrides()` — shrine gate/boss barriers
- Any map constants (MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_DEFS)

The class should accept a Phaser.Scene reference and provide a `render(scene: Phaser.Scene)` method.

### 2. `src/game/systems/EnemyManager.ts`
Extract all enemy-related logic:
- Enemy spawning (`spawnEnemiesForRegion()`, `spawnEnemy()`)
- Enemy updates (`updateMapEnemies()`, enemy AI movement)
- Enemy combat (`damageEnemy()`, `performPlayerAttack()`)
- Enemy visual creation (`createEnemyVisual()`, enemy Container sprites)
- Enemy stagger, flash, death animations
- MapEnemy type definition
- Enemy spawn exclusion zone constants
- Boss encounter logic (spawn, phases, death)

### 3. `src/game/systems/CompanionManager.ts`
Extract companion system:
- Companion creation/update (`createCompanion()`, `updateCompanions()`)
- Companion combat AI (Kael melee, Io healer/mage)
- Companion visual sprites
- Companion HP/MP bars
- Companion death/revive logic
- Companion auto-revive timer (PP4)

### 4. `src/game/systems/UIManager.ts`
Extract all HUD and overlay creation:
- HUD panel (HP, MP, XP bars, level display)
- Skill bar (1-4 slots with cooldown indicators)
- Minimap (`miniMap` overlay)
- Toast system (`showToast()`)
- Pause overlay creation
- Death screen
- Victory screen
- Boss HP bar
- Objective banner
- Controls help overlay (H key)

### 5. `src/game/systems/NPCManager.ts`
Extract NPC-related logic:
- NPC creation (`createProceduralNpc()`)
- NPC interactions (dialogue, shops)
- NPC face-player behavior
- NPC type definitions

### Architecture Pattern
Each manager class should:
1. Accept the parent OverworldScene as a constructor parameter (typed as `Phaser.Scene` or a minimal interface)
2. Store a reference to the scene for accessing game objects
3. Expose public methods that OverworldScene calls
4. Manage its own internal state
5. NOT directly modify other managers' state — communicate through the scene

Example:
```typescript
export class MapRenderer {
  private scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  render(): void {
    // All map creation logic
  }
  
  getWallSet(): Set<string> {
    return this.walls
  }
}
```

### OverworldScene Integration
After extraction, OverworldScene.ts should:
1. Import all managers
2. Instantiate them in `create()`
3. Call manager methods from `update()` and event handlers
4. Keep only: scene lifecycle (create, update, init), input handling, camera, and coordination between managers
5. Target: reduce OverworldScene.ts to under 1000 lines

### Files to Create
1. `src/game/systems/MapRenderer.ts`
2. `src/game/systems/EnemyManager.ts`
3. `src/game/systems/CompanionManager.ts`
4. `src/game/systems/UIManager.ts`
5. `src/game/systems/NPCManager.ts`

### Files to Modify
1. `src/game/scenes/OverworldScene.ts` — import managers, delegate to them, remove extracted code

## Validation
```bash
npx tsc --noEmit
npm run build
grep -rn "letterSpacing" src/
wc -l src/game/scenes/OverworldScene.ts  # Target: under 1000 lines
```

## IMPORTANT
This is a REFACTOR ONLY. Zero gameplay changes. Zero visual changes. The game must play
identically before and after extraction. Test by verifying all existing methods still exist
(even if delegated) and all `this.*` state is properly accessible.
