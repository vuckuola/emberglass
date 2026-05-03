# Emberglass Gap Fix — Phase A: New Game+ System + First-Combat Tutorial

## Context
Emberglass is a browser Action RPG (Phaser 3 + React 18 + TypeScript) at ~/emberglass.
Deployed to GitHub Pages. The game has 5 stages (quay, field, shrine, archive, skywell),
~30 min of content, but NO replay motivation and NO guided tutorial.

## CRITICAL RULES
- Do NOT use `letterSpacing` in any Phaser text style — Phaser 3.80.1 does not support it
- Do NOT upgrade Phaser or React — stay on Phaser 3.80.1 and React 18
- Do NOT modify `vite.config.ts` chunk splitting
- Do NOT add any import of `BattleScene` (deleted)
- All new code goes in existing files unless a new file is clearly needed
- Use `this.showToast()` for all in-game messages — only ONE toast at a time
- SaveSystem is at `src/game/systems/SaveSystem.ts` — uses IndexedDB + localStorage
- AudioManager is at `src/game/audio/AudioManager.ts` — fully procedural Web Audio
- Controls are defined in `src/game/controls.ts` as the `CONTROLS` constant
- `OverworldScene.ts` is the main game scene (~4277 lines)

## Task 1: New Game+ (NG+) System

### SaveData Extension
Add to `SaveData` interface in `SaveSystem.ts`:
```typescript
ngPlusLevel: number  // 0 = normal, 1 = NG+, 2 = NG++, etc.
gameCompleted: boolean
completionTimestamp: number | null
```

### TitleScene Integration
In `src/game/scenes/TitleScene.ts`:
- After "New Game", check if any save has `gameCompleted: true`
- If yes, show a "New Game+" button alongside "New Game" that starts with NG+ bonuses
- NG+ button text: "New Game+" with ember-colored styling
- "Continue" still loads latest save as normal

### NG+ Mechanics in OverworldScene
When starting NG+:
1. All party members keep their level, skills, and equipment from the completed save
2. Enemy HP multiplier: `1 + (ngPlusLevel * 0.5)` — NG+ = 1.5x, NG++ = 2.0x
3. Enemy damage multiplier: `1 + (ngPlusLevel * 0.3)` — NG+ = 1.3x, NG++ = 1.6x
4. Gold rewards multiplied by `1 + (ngPlusLevel * 0.5)`
5. XP rewards same (since NG+ enemies are harder, XP rate is naturally faster relative to level)
6. New enemy spawn patterns — shuffle enemy positions per stage on each NG+ cycle
7. Show "New Game+" banner when entering the overworld for the first time
8. Stage transition checks still work the same way
9. When NG+ is completed again, increment ngPlusLevel and allow NG++ etc.

### NG+ Boss Variants
- In each stage, the boss gains a new mechanic per NG+ level:
  - NG+: Boss attacks 20% faster, gains 1 additional attack pattern
  - NG+++: Boss has a "rage mode" at 50% HP instead of 15%
- Keep it simple — just stat multipliers and speed changes, no new boss scenes

### Implementation Notes
- Store `ngPlusLevel` in SaveData, persist via existing SaveSystem
- When player completes skywell boss in NG+, show "NG+ Complete!" toast, unlock next NG+ level
- The `stage` field in SaveData already tracks progression, no change needed
- Use `scene.showToast()` for all NG+ related messages
- Apply enemy multipliers in the existing enemy spawn/combat functions

## Task 2: First-Combat Tutorial (Guided, Not Hints)

### Design Philosophy
Replace the passive hint system (WASD→Space→Shift→F→Q/E→1-4 progressive hints) with an
ACTIVE guided combat tutorial for the first session only. Players learn by doing, not reading.

### Tutorial Flow
When a NEW game starts (not NG+, not loaded save):

1. **Step 1: "Defeat the training enemy"**
   - Spawn 1 weak enemy (50% HP of normal) directly in front of the player at Luma Quay
   - Show a pulsing overlay text: "Press SPACE to attack" (center-bottom, 2s duration, auto-repeat)
   - Player must kill the enemy with Space only
   - On kill: gold sparkle + toast "Well done! Hold SHIFT to dash."
   - This enemy should be visually distinct (glowing blue outline) to signal "this is training"

2. **Step 2: "Dash through the enemy"**
   - Spawn 1 normal enemy
   - Show overlay: "Hold SHIFT + move to dash"
   - Player must dash through/kill the enemy
   - On kill: toast "Hold F to block attacks."

3. **Step 3: "Block and counter"**
   - Spawn 1 enemy that attacks the player
   - Show overlay: "Hold F to block — time it right for a parry!"
   - Player must survive 10 seconds OR kill the enemy
   - On success: toast "You're ready. Explore freely!"
   - Remove all tutorial overlays

### Implementation Notes
- Track tutorial state with a `tutorialState` field: 'none' | 'step1-kill' | 'step2-dash' | 'step3-block' | 'complete'
- Store in SaveData flags: `flags.tutorialCompleted = true`
- Only trigger tutorial when `!saveData.flags.tutorialCompleted`
- Tutorial enemies should be tagged so they don't drop real loot
- The pulsing overlay text should be centered-bottom, large font, gold color, fading in/out
- Do NOT disable normal game mechanics during tutorial — the player can still move freely
- After tutorial completes, the existing progressive hint system (PP3 onboarding) can still show
  controls for skills/items that weren't covered (1-4, Q, E, etc.)
- The `showFirstSessionGuide()` method in OverworldScene handles initial quest guidance — 
  keep it but delay it until after tutorial completes

### Files to Modify
1. `src/game/systems/SaveSystem.ts` — SaveData interface + NG+ fields
2. `src/game/scenes/TitleScene.ts` — NG+ button on title screen
3. `src/game/scenes/OverworldScene.ts` — NG+ multipliers, tutorial system, enemy spawning
4. `src/game/data/enemies.ts` — If needed for NG+ enemy variants

## Validation
After all changes, run:
```bash
npx tsc --noEmit
npm run build
grep -rn "letterSpacing" src/  # MUST return nothing
```
