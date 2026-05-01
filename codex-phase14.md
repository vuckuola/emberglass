# Phase 14: Unified Scalable Sizing System + UI/UX Consistency Audit

## Goal
Make ALL game entities (hero, NPCs, companions, enemies, objects) use a UNIFIED scale system, and make ALL UI panels responsive to screen size. No element should overflow, overlap, or look mis-sized.

## Context
- File: src/game/scenes/OverworldScene.ts (3655 lines)
- Game world: 40×30 tiles × 48px = 1920×1440px
- Screen: this.scale.width × this.scale.height (typically 960×640 game canvas)
- TILE_SIZE = 48

## Current Problems (MUST FIX ALL)

### 1. Entity Scale Inconsistency
Currently scales are scattered and inconsistent:
- Hero (Nara): `setScale(0.72)` on 96×144 sheet = 69×104px
- NPC sprites: `setScale(0.55)` on 96×144 sheet = 53×79px (line 983)
- Companion sprites (Kael/Io): `setScale(0.58)` on 96×144 sheet = 56×83px (line 1158)
- Object markers: `setScale(0.6)` then tween to 0.63 (line 1073)
- Enemy sprites: `setScale(0.5)` initially, varies per type (line 2744)

**FIX**: Create a shared scale constant system:
```typescript
// At top of class or as module constants
const ENTITY_SCALE = {
  hero: 0.72,        // Player character — largest, most visible
  npc: 0.65,         // NPCs — slightly smaller than hero
  companion: 0.62,   // Party companions — between hero and NPC
  enemy: 0.55,       // Regular enemies
  bossEnemy: 0.75,   // Boss enemies — larger than hero
  object: 0.6,       // Map objects/markers
}
```

### 2. NPC Sprite Scale Too Small
Line 983: `this.add.sprite(x, y, assetKey, 0).setScale(0.55)`
NPCs at 0.55 look tiny compared to hero at 0.72. They should be at least 0.65.

### 3. DrawNpc Procedural NPC Size
Lines 991-1013: createProceduralNpc creates body rectangles with hardcoded sizes:
- Body: `22×30` or `26×34` (elder) — fine but not aligned with sprite scale
- Head: ellipse `15×16`
- Legs: rectangles `5×12`

These procedural NPCs should match the visual size of the PNG sprite at ENTITY_SCALE.npc.

### 4. Companion Container Size
Lines 1138-1170: createCompanion has:
- Body rectangle: `32×32` (line 1151)
- Aura circle: radius 20 (line 1155)
- Name text at y=-25

The body rect 32×32 at scale 0.58 looks inconsistent. Should match the companion sprite scale.

### 5. UI Panels NOT Responsive
All UI uses hardcoded pixel widths/heights:

| Panel | Line | Hardcoded Size | Problem |
|-------|------|---------------|---------|
| Shop panel | 2313 | 500×380 | Doesn't scale to screen |
| Menu panel | 2387 | 700×500 | Doesn't scale to screen |
| Skill overlay | 2428 | 760×500 | Doesn't scale to screen |
| Victory panel | 2268 | 780×250 | Doesn't scale to screen |
| Toast panel | 2184 | Math.min(msg*9+48, 740) | Capped at 740, may still overflow |
| Reward toast | 2201 | 760×48 | Fixed width |
| Area banner | 2212 | 580×84 | Fixed width |
| Area banner text | 2214 | fontSize 26px | May overflow on small screens |
| Credits panel | 2279 | fontSize 25px | Hardcoded |

**FIX**: Create a responsive helper:
```typescript
private uiWidth(fraction: number, maxPx: number = 800): number {
  return Math.min(this.scale.width * fraction, maxPx)
}
private uiHeight(fraction: number, maxPx: number = 600): number {
  return Math.min(this.scale.height * fraction, maxPx)
}
```

Then use it for ALL panels:
- Shop: `uiWidth(0.52, 500)` × `uiHeight(0.6, 380)`
- Menu: `uiWidth(0.73, 700)` × `uiHeight(0.78, 500)`
- etc.

### 6. Toast Message Overflow
Line 2184-2185:
```typescript
const panelW = Math.min(message.length * 9 + 48, 740)
const panelH = Math.max(Math.ceil(message.length / 70) * 22 + 32, 40)
```
Some NPC dialogue messages are very long (150+ chars). The wordWrap width is `panelW - 32`. With panelW=740, that's 708px — fine. But the panelH calculation uses `message.length / 70` which doesn't account for actual word wrapping. Long messages can overflow the panel.

**FIX**: Calculate panel height more accurately or just make it generous.

### 7. NPC Name Labels Position
NPC name labels (if any) should be above the NPC sprite, centered, with consistent offset. Currently NPCs don't have visible name labels in the overworld (only inside dialogue).

### 8. Objective Panel Fixed Width
Line 1507: `this.add.rectangle(..., 430, 32, ...)`
Fixed 430px width doesn't adapt to screen.

### 9. Prompt Text at Bottom
Line 1517: Fixed text with fixed fontSize 12px. May overlap with touch controls on mobile.

### 10. HP/MP Bars Position
Lines 1523-1524: Floating HP/MP bars use fontSize 9px — very small. Should be at least 10-11px for readability.

## Implementation Requirements

1. **Create ENTITY_SCALE constants** at module level (near top of file, after imports)
2. **Create uiWidth/uiHeight helpers** as private methods
3. **Replace ALL hardcoded scale values** with ENTITY_SCALE references:
   - Line 983: NPC sprite 0.55 → ENTITY_SCALE.npc
   - Line 1073: Object marker 0.6 → ENTITY_SCALE.object (and tween target 0.63 → ENTITY_SCALE.object * 1.05)
   - Line 1080: Hero sprite 0.72 → ENTITY_SCALE.hero
   - Line 1158: Companion sprite 0.58 → ENTITY_SCALE.companion
   - Enemy scales: use ENTITY_SCALE.enemy and ENTITY_SCALE.bossEnemy
4. **Replace ALL hardcoded UI panel sizes** with uiWidth/uiHeight calls
5. **Fix toast panel height calculation** to be more generous (add +20px buffer)
6. **Fix HP/MP bar font size** from 9px to 10px
7. **Ensure NPC procedural bodies match visual size** of ENTITY_SCALE.npc sprites
8. **Ensure companion containers match visual size** of ENTITY_SCALE.companion sprites

## Verification
1. `npm run typecheck` must pass
2. `npm run build` must pass
3. No `letterSpacing` in src
4. All scale values in OverworldScene must reference ENTITY_SCALE or be mathematically derived from it
5. No UI panel uses a hardcoded width > 80% of screen width

## Critical Rules
- Do NOT change TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, or any game logic
- Do NOT change combat formulas, damage, or enemy AI
- ONLY change: scale constants, UI sizing, font sizes for readability
- Keep the game visually the same — just consistent and properly sized
- All existing functionality must work exactly as before
