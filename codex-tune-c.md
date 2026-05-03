# Emberglass Tuning — Part C: UI/UX & Save System

You are working on a Phaser 3 + TypeScript pixel-art action RPG called "Emberglass".
Working dir: /home/adm-herm/emberglass
CRITICAL: Never use `letterSpacing` property on Phaser Text — it will crash.

## Task 1: Pause Menu (Esc)
The pause menu overlay (this.menuOverlay) should have these working buttons:
- Resume: close menu, unpause timescale
- Settings: open settings panel (if exists)
- Save: trigger save to IndexedDB via SaveSystem.save(), show "Game Saved" text for 2 seconds
- Load: trigger load from SaveSystem.load(), show "Game Loaded" text for 2 seconds
- Quit to Title: this.scene.start('TitleScene')

All buttons must respond to both click AND keyboard (1-5 keys). Each button should highlight on hover.

## Task 2: Settings Panel
If settings panel exists, verify it saves to SaveSystem. It should control:
- Master volume (0-100, affects AudioManager)
- Screen shake toggle (on/off)
- If these don't save/load properly, fix the save/load flow

## Task 3: Death & Victory Screens
- Death screen: red overlay, "You Fell" text, "Load Last Save" button, "Quit to Title" button
- Victory screen (boss kill): gold overlay, "Victory!" text, show XP gained, gold gained, play time
- Both screens should block all input except the buttons

## Task 4: Save System Integrity
In src/game/systems/SaveSystem.ts:
- Auto-save should trigger: after boss defeat, after entering new area (if area tracking exists), every 60 seconds
- Save must store: player position (x,y), HP, MP, level, XP, gold, companion HP, quest progress
- Load must restore ALL of the above
- If save data exists but is corrupted (missing required fields), show "Save data corrupted" and offer new game

After ALL changes, run: npm run typecheck && npm run build
Also verify: grep -rn letterSpacing src/ returns nothing