# Emberglass Tuning — Part B: Enemies & Companions

You are working on a Phaser 3 + TypeScript pixel-art action RPG called "Emberglass".
Working dir: /home/adm-herm/emberglass
CRITICAL: Never use `letterSpacing` property on Phaser Text — it will crash.

## Task 1: Enemy AI
In src/game/scenes/OverworldScene.ts:
- Enemies should have a brief "aggro telegraph" before attacking: set enemy.body fillStyle to red for 200ms, then attack
- If there are ranged enemies, they should keep distance (150-250px) from player and create a projectile (small colored circle that moves toward player position at time of firing)
- Boss should have distinct attack patterns per phase:
  - Phase 1 (HP 100-70%): slow melee charge toward player
  - Phase 2 (HP 70-40%): melee + area shockwave (expanding circle that damages player if in range)
  - Phase 3 (HP 40-15%): area shockwave + summon 2 weak minions at edges
  - Phase 4 (HP 15-0%): rage mode — 1.5x attack speed, red tint, faster movement
- Dead enemies drop loot (gold coins as small yellow circles) that magnetize to player within 48px

## Task 2: Companion Polish (Kael tank + Io healer)
- Kael should smoothly walk toward nearest enemy (move at PLAYER_SPEED * 0.85), not teleport. Attack when within 30px.
- Io should show a green expanding ring (radius 0→40→destroy, 600ms) when healing a party member
- Both companions should have small HP bars (2px high, 24px wide) above their sprites
- If companion HP reaches 0: play kneel animation (tint gray, scale.y 0.7), then auto-revive after 8 seconds (restore to 50% HP, flash white)

After ALL changes, run: npm run typecheck && npm run build
Also verify: grep -rn letterSpacing src/ returns nothing