# Emberglass Tuning — Part A: Movement & Combat

You are working on a Phaser 3 + TypeScript pixel-art action RPG called "Emberglass".
Working dir: /home/adm-herm/emberglass
CRITICAL: Never use `letterSpacing` property on Phaser Text — it will crash.

## Task 1: Movement & Collision
In src/game/scenes/OverworldScene.ts:
- Verify diagonal movement uses sqrt(2) normalization (multiply by Math.SQRT1_2) — if missing, add it
- Dash should check tile collision BEFORE moving. If dashing into a wall, stop at wall edge. Use the existing map collision layer.
- Dash afterimage trail: replace colored rectangles with semi-transparent copies of the player sprite (use player.body texture tinted with alpha)

## Task 2: Combat Tightness
- Add player iFrames after taking damage: 800ms duration, toggle player.setAlpha(0.3) blinking every 80ms during iFrames
- Add enemy iFrames after being hit: 400ms (prevent stun-locking)
- Verify combo counter resets after no hits for COMBO_WINDOW ms
- Boss phase transitions: add 500ms slow-mo (timeScale 0.3), camera zoom pulse (1.0→1.15→1.0), and phase announcement text

After ALL changes, run: npm run typecheck && npm run build
Also verify: grep -rn letterSpacing src/ returns nothing