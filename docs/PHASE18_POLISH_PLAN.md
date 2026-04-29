# Phase 18: Showcase Polish + Public Demo Hardening

You are taking over the existing Emberglass repo as a senior Phaser/React/Vite game engineer.

## Hard Constraints
- GitHub Pages compatible, base path `/emberglass/`
- No backend, no paid services, no copyrighted assets
- Keep keyboard, mouse, and touch controls working
- Keep the existing demo route playable end-to-end
- Keep bundle size reasonable
- Do NOT break the QA flow (32 checks in qa-runtime.mjs)

## Top 10 Issues Hurting Game Feel

1. **HUD looks debug-ish**: The objective panel at top-left uses plain rectangle + text. Needs a proper JRPG-style border/frame with the cozy fantasy palette.

2. **Toast/dialogue system is flat**: `showToast()` uses a plain text with backgroundColor. Needs a proper dialogue box with speaker name, border decoration, and a "press to continue" indicator for multi-line dialogue.

3. **Map feels like a grid test**: All grass/path/wall tiles are uniform flat rectangles. No grass variation, no shadows under objects, no ambient detail.

4. **No screen transitions**: Scene transitions use only `cameras.main.fadeIn/fadeOut`. Missing is a proper wipe/iris effect for battle transitions, and a subtle white-flash for pickups.

5. **Battle UI lacks drama**: Entity view rectangles are plain colored blocks. HP/MP bars are tiny. Command buttons lack framing. No enemy shake on hit, no death dissolve, no victory sparkle burst.

6. **No ambient particles in overworld**: The backdrop has only 12 tiny motes. Need fireflies/embers near the skywell, gentle leaf particles in grass, shimmer on water tiles.

7. **Interaction prompt too verbose**: Bottom prompt shows full "Move WASD/Arrows or touch pad • Interact Enter/Space/ACT • Menu M/Esc" at all times. Should be contextual and compact.

8. **Menu is functional but ugly**: The menu overlay uses a plain bordered rectangle. Needs visual hierarchy with sections, header decoration, and better spacing.

9. **Version string on title says "v0.1"**: Should say "v0.18" and the title scene needs a more polished "Press any key to start" feel before menu appears.

10. **Area banners/event banners overlap**: showAreaBanner and showEventBanner can stack. Need queueing or dismissal logic.

## Files to Touch
- `src/game/scenes/OverworldScene.ts` — map, HUD, toasts, dialogue, particles, transitions
- `src/game/scenes/BattleScene.ts` — entity views, HP bars, command panel, hit feedback
- `src/game/scenes/TitleScene.ts` — version text, polish existing elements
- `src/game/config.ts` — no changes expected
- `docs/PHASE18_POLISH_PLAN.md` — this file

## Risk List
- R1: Changing HUD layout could break QA text detection → keep text content identical, only change visual framing
- R2: Adding particle systems could impact performance on low-end → keep particle count under 30
- R3: Changing dialogue toast structure could break QA text matching → ensure showToast still produces detectable text
- R4: OverworldScene.ts is 1031 lines already → keep edits focused, extract helper functions if needed

## Acceptance Criteria
- All 32 QA checks still pass
- `npm run typecheck` passes
- `npm run build` passes
- HUD has a decorative JRPG-style border/frame
- Toast/dialogue appears in a styled box, not raw text
- Battle HP bars are readable (wider, with background track)
- At least one ambient particle system active in overworld
- Title version text says "v0.18"
- Interaction prompt is contextual (shorter when near nothing)
- Area/event banners don't overlap

## Implementation Notes

### 1. HUD Polish (OverworldScene.createHud)
- Replace the plain rectangle with a panel that has:
  - Semi-transparent dark background with a golden border (#f3e1b0)
  - A small decorative corner accent (tiny L-shapes in gold)
  - The word "Objective:" in gold (#f0c040), rest in white
- Keep all text positions, sizes, and content the same (QA depends on this)
- Make the area name panel (top center) match this style

### 2. Dialogue Box (showToast replacement)
- Keep the `showToast(message)` API unchanged — QA calls it and checks text
- But internally, render it with:
  - A panel: dark background (#0a0a2ecc), rounded corners (use a rectangle), gold border (#d4a84b)
  - Left accent stripe (thin gold rectangle on the left side)
  - A small triangle/arrow at bottom center pointing to the prompt area
  - Fade in from slightly below, hold, then fade out upward
- The existing `showRewardToast()` and `showEventBanner()` can stay similar but use the same border palette

### 3. Battle UI Polish (BattleScene)
- Entity views:
  - Make HP bar wider (100px instead of 80px), 10px tall, with dark track behind
  - Add entity shadow (dark ellipse below each entity)
  - Add a subtle pulsing outline on the active turn entity
- Bottom panel:
  - Add gold border on the command panel (matching overworld HUD style)
  - Add small number labels (1-5) before each command
  - Gray out disabled commands more obviously
- Hit feedback (already partially exists, enhance):
  - On enemy death: shrink + fade out + dissolve particles (2-3 small white circles that scatter)
  - On player hit: brief red tint flash on the entity sprite/rect
- Victory card: add sparkle particles (4-5 gold circles that float up)

### 4. Ambient Particles (OverworldScene)
Add after createBackdrop():
```typescript
private createAmbientParticles() {
  // Fireflies near skywell (tiles 4-6, 4-6)
  for (let i = 0; i < 6; i++) {
    const fx = Phaser.Math.Between(SAVE_TILE.x * TILE_SIZE - 48, SAVE_TILE.x * TILE_SIZE + 48);
    const fy = Phaser.Math.Between(SAVE_TILE.y * TILE_SIZE - 48, SAVE_TILE.y * TILE_SIZE + 48);
    const glow = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 3), 0x9ff3ff, Phaser.Math.FloatBetween(0.15, 0.35)).setDepth(5);
    this.tweens.add({
      targets: glow,
      x: fx + Phaser.Math.Between(-20, 20),
      y: fy + Phaser.Math.Between(-30, -10),
      alpha: 0.05,
      yoyo: true, repeat: -1,
      duration: Phaser.Math.Between(2500, 4500),
      ease: 'Sine.easeInOut',
    });
  }
  // Grass leaf particles (random across grass tiles)
  for (let i = 0; i < 8; i++) {
    const gx = Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48);
    const gy = Phaser.Math.Between(48, MAP_HEIGHT * TILE_SIZE - 48);
    const leaf = this.add.circle(gx, gy, 1.5, 0x6abf5e, 0.12).setDepth(0.3);
    this.tweens.add({
      targets: leaf,
      x: gx + Phaser.Math.Between(-12, 12),
      y: gy + Phaser.Math.Between(-16, 16),
      alpha: 0.02,
      yoyo: true, repeat: -1,
      duration: Phaser.Math.Between(3000, 5000),
      delay: Phaser.Math.Between(0, 2000),
      ease: 'Sine.easeInOut',
    });
  }
}
```

### 5. Interaction Prompt (updateInteractionPrompt)
- When near nothing: show "WASD/Arrows: Move • Enter/Space: Interact" only
- When near an interactable: show just the action + "[Enter]" — e.g. "Talk to Elder Maelin [Enter]"
- This keeps it shorter and contextual

### 6. Title Scene Polish
- Change version text from "v0.1" to "v0.18"
- Add a gentle "Press any key" text that pulses below the menu, fading after first input

### 7. Menu Overlay Polish (openMenu)
- Add section dividers (thin gold lines) between Objective, Status, Inventory
- Add a small title decoration (a centered gold diamond before "Emberglass Menu")
- Keep all text content identical

### 8. Banner Queue System
- Add a simple `bannerQueue: Array<{destroy: () => void}>` 
- Before showing a new area/event banner, dismiss any existing one
- In showAreaBanner/showEventBanner, call `this.dismissBanners()` first
```typescript
private activeBanners: Phaser.GameObjects.GameObject[] = [];
private dismissBanners() {
  this.activeBanners.forEach(b => { b.destroy(); });
  this.activeBanners = [];
}
```
Then push all created game objects into `this.activeBanners` and clear them on completion.

### 9. Version Bump
- Update `package.json` version from "0.15.0" to "0.18.0"
- Update title scene version text to "v0.18"

## Priority Order
1. Version bump (trivial, do first)
2. HUD polish
3. Dialogue/toast polish
4. Battle UI polish
5. Ambient particles
6. Interaction prompt cleanup
7. Title scene tweaks
8. Menu overlay polish
9. Banner queue system
10. Run full checks

Do NOT add new files. All changes go into existing files.
Do NOT change function signatures that QA calls (showToast, openMenu, closeMenu, etc.).
Do NOT change text content that QA asserts against.
Make ALL edits in a single pass. Return the complete modified files.
