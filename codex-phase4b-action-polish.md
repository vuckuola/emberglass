# Emberglass Phase 4B — Action RPG Polish: Skills, Drops, Block

## Context
Emberglass is now a Diablo-style action RPG (Phase 4A done). Combat is real-time on the overworld. We need polish passes.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style
- Do NOT change SaveData interface or SaveSystem validation
- Keep all existing systems working
- Use only programmatic graphics
- No console.log in production code

## Task 1: Ground Loot Drops (Visual Items on Map)

When an enemy dies and drops an item (currently just adds to inventory), instead spawn a visible loot orb on the ground:

```typescript
type GroundLoot = {
  x: number
  y: number
  itemId: string
  quantity: number
  sprite: Phaser.GameObjects.Arc  // glowing orb
  label: Phaser.GameObjects.Text  // item name
  bobTween: Phaser.Tweens.Tween
}
```

- When enemy dies and Math.random() < 0.35 (current drop rate), spawn a golden glowing orb at enemy death position
- Orb bobs up and down gently (tween y ±3px)
- If player walks within 40px, auto-pickup: add to inventory, show "+1 Health Potion" floating text, destroy orb
- Gold drops: always drop a smaller yellow orb showing "+Xg" that auto-pickups on proximity
- Also drop EXP orbs (blue) that give EXP on pickup

Ground loot should persist for 15 seconds then fade out and destroy if not picked up.

## Task 2: Skill Usage (Number Keys)

Player should be able to use skills in real-time:

- Press 1-4 to use equipped skill
- Each skill has an MP cost and cooldown
- Show skill cooldown indicators on HUD
- Skill effects:
  - **Ember Slash (1)**: Wider arc attack, 2× damage, costs 8 MP, 3s cooldown
  - **Tidal Heal (2)**: Heal 30% HP, costs 12 MP, 6s cooldown, green flash
  - **Stone Guard (3)**: Reduce incoming damage by 50% for 4 seconds, costs 10 MP, 8s cooldown
  - **Wind Step (4)**: Teleport 120px in facing direction, costs 6 MP, 2s cooldown

Show MP cost on skill icons. Gray out skills when not enough MP or on cooldown.

Use the skills from `characters.ts` data but add a `realtimeEffect` mapping for action RPG use.

## Task 3: Block/Defend Mechanic

Add a block mechanic:
- Hold **F key** to block
- While blocking: player moves at 40% speed, takes 60% less damage
- Visual: blue shield arc in front of player
- Can't attack while blocking (Space disabled during block)
- Brief "block" visual when successfully blocking enemy hit (shield flash)

## Task 4: Enemy Respawn System

After all enemies in a stage are killed:
- Wait 30 seconds
- Respawn enemies at their original spawn positions
- Don't respawn bosses (they stay dead once killed, story-flagged)
- Show a brief area notification: "New threats emerge..."

Add a respawn timer that starts when the last non-boss enemy dies.

## Task 5: HUD Enhancement

Update the HUD (already has HP/MP bars, gold, objective) to show:
- **Skill bar**: 4 skill slots at bottom-center with icons (colored circles with number), MP cost, cooldown overlay
- **Kill counter**: small "Kills: X" display
- **Mini-map**: already exists, keep as-is
- **Level indicator**: show current level next to HP bar

## Task 6: Visual Feedback Polish

Add these juice effects:
- **Screen shake** on big hits (boss attacks) — brief 3px shake for 200ms
- **Combo counter**: if player hits multiple enemies within 2 seconds, show "x2", "x3" etc.
- **Enemy death explosion**: 5-6 small particles burst outward from enemy position when killed
- **Level up effect**: when player gains enough EXP to level up, brief golden glow around player + "LEVEL UP!" floating text
- **Damage direction indicator**: show a small arrow pointing toward attacker when player takes damage

## Files to Modify
- `src/game/scenes/OverworldScene.ts` — main target for all changes
- `src/game/systems/CombatSystem.ts` — add block damage reduction, skill cooldown logic

## Validation
1. `npm run typecheck` — must pass
2. `npm run build` — must succeed
