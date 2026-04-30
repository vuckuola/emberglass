# Phase 9A: Visual Polish — Premium Pixel Art Feel

## Context
Emberglass is a browser action RPG (Phaser 3.80.1 + TypeScript + Vite). All core systems work: real-time combat, companion AI, skills, save/load, PWA. But visuals need significant polish to feel like a "top-tier pixel art web game."

## CRITICAL RULES
- Phaser 3.80.1 ONLY — no upgrades
- NO `letterSpacing` in any text style (Phaser 3 does not support it)
- NO new npm packages
- DO NOT change scene architecture or game flow
- DO NOT modify SaveSystem, manifest.json, sw.js, or vite.config.ts
- Keep all existing controls and input bindings
- Run `npm run typecheck` and `npm run build` after changes

## Task: Visual Polish

### 1. Better Companion Sprites (OverworldScene.ts)
Companions currently use plain `this.add.rectangle()` (30x30 green/blue boxes). Replace with actual sprite-based visuals:

- Use `this.add.sprite(0, 0, 'generated.hero.kael', 0)` for Kael and `this.add.sprite(0, 0, 'generated.hero.io', 0)` for Io
- If the texture keys don't exist in cache, add `this.load.spritesheet('generated.hero.kael', 'assets/generated/hero_kael_sheet.png', { frameWidth: 96, frameHeight: 144 })` in BootScene or preload section
- Scale companions to 0.5x (48x72) so they're smaller than the player
- Add walk animation: flipX based on movement direction (like the player)
- Add idle bobbing animation (subtle sine wave on y)
- Keep existing companion body for hitbox (setVisible(false) on the rectangle, keep for physics)

### 2. Damage Numbers Enhancement
- Player damage: WHITE text that floats up and fades, with slight random x offset (-10 to +10)
- Critical hits: LARGER text (16px instead of 11px), GOLD color with slight shake
- Enemy damage: RED text
- Healing: GREEN text with "+" prefix
- All damage numbers should have a dark outline/shadow for readability

### 3. Kill Effects Improvement
When an enemy dies:
- Burst of 8-12 colored particles (match enemy element color) that expand outward and fade
- Brief white flash on the enemy sprite (100ms)
- Camera shake: 3px for normal, 6px for boss kills
- Gold popup: show "+Xg" text in gold color near kill position

### 4. HUD Polish
The HUD bars above the player are functional but basic. Improve:
- HP bar: green gradient (bright green → dark green) with a thin white highlight on top edge
- MP bar: blue gradient (bright blue → dark blue) with highlight
- Add tiny HP/MP text below bars showing "104/104" and "44/44"
- When HP drops below 30%, bar pulses red briefly
- Objective text: add subtle shadow/background for readability

### 5. Enemy Visual Polish
- Add subtle idle animation: slight scale pulse (0.98 → 1.02 → 0.98) over 1.5s
- When enemy takes damage: brief white flash (tint to 0xffffff for 80ms)
- Boss enemies: add a subtle red aura glow (circle behind sprite, low alpha)
- Enemy HP bars: add dark background bar behind the green HP fill

### 6. Player Attack Visual
- Show a visible swing arc when attacking (Space key): brief arc shape in front of player, matching facing direction
- Color: bright cyan/white, 150ms duration, fades out
- Add slight screen shake (2px) on each player attack hit

## Files to modify
- `src/game/scenes/OverworldScene.ts` — companion sprites, damage numbers, kill effects, HUD, enemy polish, attack visual
- `src/game/scenes/BootScene.ts` — if spritesheet preload needed for companions
- `scripts/generate_assets.py` — if better companion spritesheet generation needed

## Validation
```bash
npm run typecheck
npm run build
grep -rn "letterSpacing" src/ && echo "FAIL" || echo "OK"
```
