## Task: Rewrite Emberglass asset integration to use new AI-generated sprites

### Context
We just regenerated all game assets with new AI-generated fantasy art at proper resolutions. The code still uses colored rectangles as fallbacks and all NPCs share one spritesheet. Fix all of this.

### Files to modify

#### 1. `src/game/assets/generatedAssets.ts`
Replace the ENTIRE file with updated asset mappings. The new assets are:

**Heroes (spritesheet 384x144, frameWidth:96, frameHeight:144):**
- `hero_nara_sheet.png` → key: `generated.hero.nara`
- `hero_kael_sheet.png` → key: `generated.hero.kael`
- `hero_io_sheet.png` → key: `generated.hero.io`

**NPCs (single frame 96x144, loaded as image NOT spritesheet):**
- `npc_guide_rin.png` → key: `generated.npc.guideRin`
- `npc_elder_maelin.png` → key: `generated.npc.elderMaelin`
- `npc_peddler.png` → key: `generated.npc.peddler`
- Keep `npc_luma_elder_sheet.png` → key: `generated.npc.lumaElder` (spritesheet 384x144, frameWidth:96, frameHeight:144) for backward compat

**Objects (96x96 each):**
- `object_signpost.png` → key: `generated.object.signpost`
- `object_tide_bell.png` → key: `generated.object.tideBell`
- `object_mural.png` → key: `generated.object.mural`
- `object_watch_lantern.png` → key: `generated.object.watchLantern`
- `object_shrine_gate.png` → key: `generated.object.shrineGate`
- `object_pilgrim_font.png` → key: `generated.object.pilgrimFont`
- `object_inner_seal.png` → key: `generated.object.innerSeal`
- `object_ruin_marker.png` → key: `generated.object.ruinMarker`
- `object_guardian_field.png` → key: `generated.object.guardianField`
- `object_chest.png` → key: `generated.object.chest`

**Enemies (192x192):**
- Same keys as before, same filenames

**Icons (64x64):**
- Same keys as before, same filenames

**Tileset (512x512):**
- `tileset_ember_quay.png` → key: `generated.tileset.emberQuay`

**Backgrounds (960x640):**
- Same keys as before, same filenames

**UI (640x192):**
- `ui_panel_frame.png` → key: `generated.ui.panel`

The GENERATED_ASSETS object should have this structure:
```typescript
export const GENERATED_ASSETS = {
  heroes: { nara: 'generated.hero.nara', kael: 'generated.hero.kael', io: 'generated.hero.io' },
  npcs: { guideRin: 'generated.npc.guideRin', elderMaelin: 'generated.npc.elderMaelin', peddler: 'generated.npc.peddler' },
  npc: 'generated.npc.lumaElder', // backward compat
  enemies: { vinecrawler: '...', moss_knight: '...', sporefiend: '...', archive_guardian: '...' },
  icons: { potion: '...', ether: '...', emberShard: '...' },
  objects: { signpost: '...', tideBell: '...', mural: '...', watchLantern: '...', shrineGate: '...', pilgrimFont: '...', innerSeal: '...', ruinMarker: '...', guardianField: '...', chest: '...' },
  tileset: 'generated.tileset.emberQuay',
  overworldBg: 'generated.bg.overworld',
  battleBg: 'generated.bg.battle',
  uiPanel: 'generated.ui.panel',
  chest: 'generated.object.chest',
} as const
```

Keep `hasTexture()` and `preloadGeneratedAssets()` functions. Update preload to:
- Load hero spritesheets with frameWidth:96, frameHeight:144
- Load NPC images (guideRin, elderMaelin, peddler) as plain images (NOT spritesheet)
- Load npc_luma_elder_sheet as spritesheet frameWidth:96, frameHeight:144
- Load all new object images
- Keep enemy/icon/tileset/bg/ui loads the same
- Remove the old `tileset_ember_quay_16.png` reference, use `tileset_ember_quay.png`
- BASE path stays: `import.meta.env.BASE_URL + 'assets/generated/'`

#### 2. `src/game/scenes/OverworldScene.ts`

**Rewrite `drawMarker()` (line ~270):**
Change from colored rectangle to sprite image. New signature:
```typescript
private drawMarker(tile: { x: number; y: number }, assetKey: string, label: string) {
  const x = this.tileCenter(tile.x)
  const y = this.tileCenter(tile.y)
  const marker = hasTexture(this, assetKey)
    ? this.add.image(x, y, assetKey).setScale(0.5).setDepth(3)
    : this.add.rectangle(x, y, 34, 34, 0x888888, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
  this.tweens.add({ targets: marker, angle: 2, scale: hasTexture(this, assetKey) ? 0.53 : 1.06, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })
  this.add.text(x, y - 30, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
}
```

**Rewrite `drawNpc()` (line ~262):**
Change from single tinted spritesheet to unique NPC sprites:
```typescript
private drawNpc(tile: { x: number; y: number }, assetKey: string, label: string) {
  const x = this.tileCenter(tile.x)
  const y = this.tileCenter(tile.y)
  const npc = hasTexture(this, assetKey)
    ? this.add.image(x, y, assetKey).setScale(0.5).setDepth(4)
    : this.add.rectangle(x, y, 34, 44, 0x888888).setStrokeStyle(2, 0xffffff, 0.45).setDepth(4)
  this.tweens.add({ targets: npc, y: npc.y - 3, yoyo: true, repeat: -1, duration: 1400 + tile.x * 45, ease: 'Sine.easeInOut' })
  this.add.text(x, y - 36, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
}
```

**Update `createObjects()` (line ~236-251):**
Change all drawNpc calls to pass asset keys instead of colors:
```typescript
this.drawChest()
this.drawNpc(GUIDE_TILE, GENERATED_ASSETS.npcs.guideRin, 'Guide Rin')
this.drawNpc(ELDER_TILE, GENERATED_ASSETS.npcs.elderMaelin, 'Elder')
this.drawNpc(MERCHANT_TILE, GENERATED_ASSETS.npcs.peddler, 'Peddler')
this.drawMarker(MARKER_TILE, GENERATED_ASSETS.objects.ruinMarker, 'Ruin Marker')
this.drawMarker(SIGNPOST_TILE, GENERATED_ASSETS.objects.signpost, 'Signpost')
this.drawMarker(TIDE_BELL_TILE, GENERATED_ASSETS.objects.tideBell, 'Tide Bell')
this.drawMarker(MURAL_TILE, GENERATED_ASSETS.objects.mural, 'Glass Mural')
this.drawMarker(WATCH_LANTERN_TILE, GENERATED_ASSETS.objects.watchLantern, 'Watch Lantern')
this.drawMarker(SHRINE_GATE_TILE, GENERATED_ASSETS.objects.shrineGate, 'Shrine Gate')
if (this.flag('shrine_gate_seen')) {
  this.drawMarker(SHRINE_FONT_TILE, GENERATED_ASSETS.objects.pilgrimFont, 'Pilgrim Font')
  this.drawMarker(SHRINE_SEAL_TILE, GENERATED_ASSETS.objects.innerSeal, this.flag('shrine_guardian_won') ? 'Awakened Seal' : 'Inner Seal')
}
this.drawMarker(FIELD_BATTLE_TILE, GENERATED_ASSETS.objects.guardianField, this.flag('field_battle_won') ? 'Cleared Field' : 'Guardian Field')
```

**Update `drawChest()` (line ~253):**
Change to use `GENERATED_ASSETS.objects.chest` instead of `GENERATED_ASSETS.chest`. Scale to 0.5.

**Update `createPlayer()` (line ~276):**
The hero spritesheets now have frameWidth:96, frameHeight:144. Keep using GENERATED_ASSETS.heroes.nara but set scale to 0.5. Keep the rectangle fallback.

**Remove conditional color logic from drawMarker calls:**
The old code passed dynamic colors (like `this.flag('slice_complete') ? 0x9ff36e : 0x5d536d`). The new drawMarker no longer takes color. Just pass the asset key and label. For conditional labels (like Awakened Seal vs Inner Seal), keep the ternary on the label string only.

### Rules
- Do NOT change any game logic, battle system, save system, dialogue, or audio
- Only change: asset key mappings, drawMarker/drawNpc/drawChest/createPlayer rendering, and preload
- Keep all fallback rectangles as fallbacks (hasTexture checks)
- Make sure TypeScript compiles with `npx tsc -b`
- Keep the `GENERATED_ASSETS.chest` alias pointing to `GENERATED_ASSETS.objects.chest` for any other code that references it
