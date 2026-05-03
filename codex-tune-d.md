# Emberglass Tuning — Part D: Audio & Performance

You are working on a Phaser 3 + TypeScript pixel-art action RPG called "Emberglass".
Working dir: /home/adm-herm/emberglass
CRITICAL: Never use `letterSpacing` property on Phaser Text — it will crash.

## Task 1: Audio Consistency
In src/game/audio/AudioManager.ts and src/game/scenes/OverworldScene.ts:
- Every player attack must play a hit SFX. If using tone/pitch variation, ensure at least 3 pitch variants cycle randomly
- Dash should play a whoosh sound (short noise burst, 100ms)
- Player taking damage: play a hurt tone (low pitch, 200ms) + brief red screen flash (80ms)
- Boss phase change: play a dramatic tone (ascending pitch, 400ms)
- Menu open/close: play a click/tap tone (very short, 30ms)
- ALL audio calls must check AudioManager.getInstance() exists and respect masterVolume setting
- If AudioManager uses Web Audio API tones (no external files), ensure all frequencies are pleasant (use pentatonic scale: C4=262, D4=294, E4=330, G4=392, A4=440, C5=523)

## Task 2: Performance
In src/game/scenes/OverworldScene.ts:
- Object pool damage numbers: create a pool of 15 text objects at scene start, reuse them (show→tween→hide→reuse). Never create new Text objects during gameplay.
- Limit particles: if more than 50 particles exist, remove oldest ones
- Ensure update() loop caches this.time.now once at start (const now = this.time.now) and uses it throughout
- On scene shutdown (SHUTDOWN event), destroy ALL tweens, timers, and particles. Add: this.tweens.killAll(); this.time.removeAllEvents()
- Remove any dead references (destroyed game objects still in arrays)

## Task 3: Final Cleanup
- Search src/game/scenes/ for any remaining `console.log`, `console.warn`, `console.error` — remove them all
- Search src/ for `any` type annotations — replace with proper types
- Search src/ for `letterSpacing` — must be 0 results

After ALL changes, run: npm run typecheck && npm run build
Verify: grep -rn "console.log" src/game/scenes/ returns nothing
Verify: grep -rn letterSpacing src/ returns nothing