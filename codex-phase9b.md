# Phase 9B: Game Feel & Juice — Make It Satisfying

## Context
Emberglass is a browser action RPG (Phaser 3.80.1 + TypeScript + Vite). Visuals are being polished in Phase 9A. This phase focuses on GAME FEEL — making every action feel satisfying and responsive.

## CRITICAL RULES
- Phaser 3.80.1 ONLY — no upgrades
- NO `letterSpacing` in any text style
- NO new npm packages
- DO NOT change scene architecture, save system, or chunk splitting
- Keep all existing controls (WASD, Space, 1-4, F=block, Q=potion, E=interact, M=minimap)
- Run `npm run typecheck` and `npm run build` after changes

## Tasks

### 1. Dash Enhancement
Current: `dashUntil` timer sets speed multiplier but no visual feedback.
Improve:
- Add afterimage effect: when dashing, spawn 3-4 semi-transparent copies of player sprite at 80ms intervals along dash path (alpha 0.4 → 0.2 → 0.1 → 0)
- Brief zoom out: camera zoom to 1.03 then back to 1.0 during dash (200ms)
- Add trail particles: small cyan/white particles along dash path
- Dash cooldown indicator: subtle UI element or flash when dash is ready again
- Speed boost feel: make the dash clearly faster (2.5x speed for 200ms)

### 2. Attack Hitstop (Impact Freeze)
When player attack hits an enemy:
- Freeze game for 30ms (set physics.timeScale = 0 briefly, or pause tweens)
- This creates a satisfying "crunch" feel
- Only on actual hits, not whiffs
- Boss hits: 50ms hitstop

### 3. Screen Shake Tuning
- Player attack hit: 2px shake, 100ms duration, ease-out
- Enemy death: 4px shake, 200ms
- Boss death: 8px shake, 400ms, with slow-mo (timeScale 0.3 for 300ms)
- Player taking damage: 3px shake, 150ms
- Combo milestone (every 5 kills): 5px shake + brief slow-mo
- Use `this.cameras.main.shake(duration, intensity)` — keep values subtle

### 4. Combo System Display
- Track consecutive kills within 3-second window
- Display combo counter in top-right: "3x COMBO" style
- Color tiers: white (1-2), yellow (3-4), orange (5-7), red (8+)
- At combo milestones (5, 10, 15): show floating text "UNSTOPPABLE!", "LEGENDARY!", etc.
- Combo resets after 3s without a kill
- Each combo level slightly boosts damage: +5% per combo tier

### 5. Loot Pickup Feel
When player walks near dropped loot:
- Magnetic pull: items accelerate toward player (ease-in)
- Brief +1 flash on gold counter
- Subtle "ding" visual effect (expanding circle at pickup point)
- Auto-pickup range: 60px

### 6. Level Up Celebration
When party gains enough XP to level:
- Golden flash across screen (full-screen overlay, alpha 0.3, 500ms)
- "LEVEL UP!" text in center, large, gold, with upward float and fade
- All party members get brief golden glow (tint overlay)
- +1 to all stats with visible stat comparison "ATK +2, DEF +1"
- Brief pause (200ms) for impact

### 7. Companion Combat VFX
- Kael attack: brief red/orange slash arc in front of him
- Io heal: soft green glow pulse on healed target
- Io Lumen Bolt: small blue projectile visual (circle moving from Io to target)
- Companion damage taken: brief red tint flash

## Files to modify
- `src/game/scenes/OverworldScene.ts` — all game feel changes

## Validation
```bash
npm run typecheck
npm run build
grep -rn "letterSpacing" src/ && echo "FAIL" || echo "OK"
```
