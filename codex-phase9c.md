# Phase 9C: UI/UX Polish — Controls, HUD Layout, Player Guidance

## Context
Emberglass is a browser action RPG. Core gameplay works, visual polish done. This phase focuses on UI/UX — making the game understandable and intuitive.

## CRITICAL RULES
- Phaser 3.80.1 ONLY — no upgrades
- NO `letterSpacing` in any text style
- NO new npm packages
- DO NOT change scene architecture or save system
- Run `npm run typecheck` and `npm run build` after changes

## Tasks

### 1. Controls Help Overlay
- Show controls hint at bottom of screen on game start (first 10 seconds, then fade out)
- Format: "WASD: Move | Space: Attack | 1-4: Skills | F: Block | Q: Potion | E: Interact"
- Small font, dark background with transparency, positioned at bottom center
- Player can press H to toggle controls help anytime
- Keep it minimal and non-intrusive

### 2. Top-Left HUD Panel
Create a clean HUD panel in top-left corner:
- Character name "Nara Lv.3" with small portrait icon (colored circle)
- HP bar: green with number "104/104"
- MP bar: blue with number "44/44"  
- XP bar: thin purple bar below
- Gold counter: "🪙 60g" to the right
- All in a dark semi-transparent box (rgba background, rounded feel)
- Panel should NOT overlap with gameplay area much (compact)

### 3. Companion Status Indicators
Small companion portraits in top-left below player HUD:
- Kael: green-tinted small circle with "Kael" + mini HP bar
- Io: blue-tinted small circle with "Io" + mini HP bar
- When companion HP < 30%, portrait pulses red
- When companion is in combat, small sword icon next to portrait

### 4. Skill Bar
Bottom-center skill bar:
- 4 slots for skills, each showing:
  - Skill icon (colored square with number 1-4)
  - Cooldown overlay (dark clock sweep effect)
  - MP cost text if not enough MP
- Currently selected skill highlighted
- Keys 1-4 to activate shown below each slot

### 5. Objective Display
- Current objective shown at top-center in a subtle banner
- "▶ Explore Luma Quay and find the Elder"
- Background: dark semi-transparent, small text
- Updates when objective changes
- Brief flash animation when new objective appears

### 6. Toast Improvements
- Toasts currently work but are basic
- Add background panel (dark, rounded corners feel)
- Slight slide-in animation from top
- Different colors for different types:
  - Info: white text
  - Success: green text (item pickup, quest complete)
  - Warning: orange text (low HP, potion needed)
  - Error: red text (can't do that)
- Auto-dismiss after 3 seconds with fade-out

### 7. Mini-Map Enhancement
When M is pressed:
- Show mini-map in bottom-right corner
- Player = green dot
- Companions = blue dots
- Enemies = red dots
- NPCs = yellow dots
- Chests = gold dots
- Semi-transparent dark background
- Small (120x90px), non-intrusive
- Press M again to hide

### 8. Death/Revive Screen
When player dies:
- Red vignette overlay fades in
- "DEFEATED" text in center
- "Reviving at skywell..." text below
- 2 second wait, then fade back to game
- Player revives at last save crystal position with 50% HP

## Files to modify
- `src/game/scenes/OverworldScene.ts` — all UI/UX changes
- `src/game/scenes/TitleScene.ts` — if controls help needs pre-loading

## Validation
```bash
npm run typecheck
npm run build
grep -rn "letterSpacing" src/ && echo "FAIL" || echo "OK"
```
