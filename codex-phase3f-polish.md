# Emberglass Phase 3F — Final Polish Pass

## Context
Emberglass is a browser JRPG (Phaser 3 + React + TypeScript + Vite). All gameplay systems are in place. This is the final polish pass to make the game feel complete and showcase-ready.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style
- Do NOT change SaveData interface or SaveSystem validation
- Keep all existing systems working
- Use only programmatic graphics
- No console.log in production code

## Task 1: Battle Transition Enhancement (OverworldScene.ts + BattleScene.ts)

Currently the battle transition is a camera fade. Make it more dramatic:

In `startFieldBattle()` in OverworldScene:
- Add a brief screen flash (white, 200ms) before the fade to battle
- Add a horizontal line wipe effect (a white line sweeps across the screen)

In BattleScene `create()`:
- Keep the existing fadeIn but make it slightly slower (400ms → 500ms)

## Task 2: Victory Screen Enhancement (BattleScene.ts)

Enhance the victory card:
- Add a subtle particle burst (8-10 gold particles flying outward) when the victory panel appears
- Make the EXP and gold numbers count up from 0 to the final value over 1.5 seconds (animate the text)
- Add a "Continue" prompt at the bottom that pulses gently

## Task 3: Game Over Screen (BattleScene.ts)

Currently defeat just shows "Defeat..." text and reloads. Make it more impactful:
- Dark red overlay that slowly fades in
- "Defeat" text in large red font, centered
- Smaller subtitle: "The embers dim... but not forever."
- After 2 seconds, auto-transition back with a fade
- No other changes to the defeat flow logic

## Task 4: Menu Polish (OverworldScene.ts)

Enhance the pause menu:
- Add a subtle vignette overlay when menu is open (darken edges)
- Show current play time formatted as "XX:XX" (hours:minutes) — there's already a `saveData.playTime` field
- Show party member names + levels + HP bars in a compact row
- Show gold amount
- Add a "Status" option that shows each party member's stats, equipment, and level progress

The Status screen:
- Semi-transparent panel
- List each party member: Name (Lv.X), HP/MP bars, ATK/DEF/SPD/MAG values
- Below each member, show equipped items (weapon, charm, relic) from saveData
- "Close" button to dismiss

## Task 5: Mini-map (OverworldScene.ts)

Add a small mini-map in the top-right corner showing:
- Current map area (just the 20x10 tile grid)
- Player position as a bright dot
- Save point as a blue dot
- NPCs as small colored dots (guide=green, elder=purple, merchant=yellow, mira=cyan)
- Home tile as an orange dot
- Semi-transparent dark background panel

The mini-map should:
- Be small (160x80 pixels)
- Use 4x4 pixel per tile
- Update each frame
- Be toggle-able with 'M' key (existing menu key — move menu to 'Tab' key, or use a separate mini-map toggle)

Actually, keep 'M' for menu. Add mini-map toggle with 'T' key (or make it always visible in the corner).

## Task 6: Credits / Thanks Screen (TitleScene.ts or new scene)

When the game reaches the ending (homecoming stage complete), after the existing "Thanks for Playing" card, add a simple credits scroll:

- "Emberglass: Covenant of the Skywell"
- "A handcrafted JRPG experience"
- Blank line
- "Game Design & Development" — "Zai & Hermes"
- "Art" — "Programmatic Pixel Art (Pillow)"
- "Music & SFX" — "Web Audio API"
- Blank line
- "Thank you for playing."
- Auto-scroll upward over 8 seconds
- Fade to black, then return to title screen

Find where the completion/demo card is shown and add the credits sequence after it.

## Task 7: Keyboard Shortcut Help Overlay

Add a help overlay accessible by pressing 'H' key in the overworld:
- Show in a centered panel:
  - "WASD / Arrows — Move"
  - "Enter / Space — Interact"
  - "M — Menu"
  - "T — Toggle Map"
  - "H — Help (this screen)"
  - "Esc — Close"
- Dismiss on any key press or click

## Files to Modify
- `src/game/scenes/OverworldScene.ts` — transitions, menu polish, mini-map, help overlay
- `src/game/scenes/BattleScene.ts` — victory screen, game over screen, transition
- `src/game/scenes/TitleScene.ts` — credits scroll (if applicable, or add to OverworldScene)

## Validation
1. `npm run typecheck` — must pass
2. `npm run build` — must succeed
