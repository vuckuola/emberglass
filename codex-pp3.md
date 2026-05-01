# Patch Pack 3: Memorable Demo — Onboarding, Boss, Audio, Mobile, Micro-Polish

You are working on `src/game/scenes/OverworldScene.ts`, `src/game/scenes/TitleScene.ts`, and `src/game/audio/AudioManager.ts`.

## Task 1: First 60 Seconds Onboarding

### 1A. Contextual Hint System
Add a hint system that teaches controls progressively:

```typescript
private shownHints: Set<string> = new Set()
private hintContainer?: Phaser.GameObjects.Container
```

Hints to show (in order, only once each):
1. **"WASD to move"** — show immediately when game starts, fade after 5 seconds or when player moves
2. **"Space to attack"** — show when first enemy is nearby (within 200px), fade after first attack
3. **"Shift to dash"** — show after 10 seconds of movement, fade after first dash
4. **"F to block"** — show after first time player takes damage, fade after first block
5. **"Q for potion / E to interact"** — show after first enemy kill, fade after 8 seconds
6. **"1-4 for skills"** — show after reaching level 2 or first skill use

Each hint:
- Bottom-center of screen, above the control prompt bar
- Small dark panel with gold accent (#ffd36e)
- Fade in over 200ms, display for 4 seconds, fade out over 300ms
- 960×30px max width, centered
- 12px font, white text
- Don't overlap with other hints (queue if needed)

### 1B. First Enemy is Easy
The first enemy the player encounters should:
- Be clearly visible from the starting area (spawn one weak enemy near the path)
- Have lower HP than normal (50% of base)
- Move slowly
- Give a satisfying first kill (bigger damage number, bigger particles, brief slow-mo on kill)

### 1C. First Chest is Visible
Ensure the first treasure chest is within 10-15 seconds of walking from spawn. If the chest is too far, move its position closer to the starting path.

### 1D. Progressive Control Display
The bottom prompt text should update based on what the player has learned:
- Start: `"WASD: Move | Space: Attack"`
- After first attack: `"WASD: Move | Space: Attack | Shift: Dash | F: Block"`
- After first interact: full `CONTROLS_SHORT`

## Task 2: Boss Phase Pacing

### 2A. Boss Phase Thresholds
The current boss has threshold-based phase changes. Ensure these follow the 70/40/15 pattern:

```typescript
const BOSS_PHASE_THRESHOLDS = [
  { hpPercent: 1.0, phase: 1, label: 'Guardian awakens' },
  { hpPercent: 0.70, phase: 2, label: 'Guardian channels power' },
  { hpPercent: 0.40, phase: 3, label: 'Guardian shatters the seal' },
  { hpPercent: 0.15, phase: 4, label: 'Last stand' },
]
```

### 2B. Boss Telegraph System
Each boss attack must have a visible tell:

**Light attack (300-450ms tell):**
- Red flash on boss sprite before lunging
- Brief pause (80ms) before attack hitbox activates

**Heavy attack (600-850ms tell):**
- Boss rises slightly (sprite scale 1.1)
- Ground crack effect (orange line) in attack direction
- Sound cue: low rumble

**AoE attack (900-1200ms tell):**
- Circle indicator on ground (red/orange) grows from boss position
- Duration indicator: ring pulses 2 times before damage

**Phase transition (1.0-1.5s invuln):**
- Boss becomes semi-transparent
- Brief camera zoom-out
- Phase label appears ("Phase 2", "Phase 3", etc.)
- Music layer changes

### 2C. Boss Punish Window
After every big attack, boss should be stationary for 0.8-1.4 seconds. During this time:
- Boss has subtle "exhausted" visual (slight droop, dimmer)
- Player can deal free damage

### 2D. Boss Intro Cinematic
When boss battle starts:
1. Camera zooms to 1.15× focused on boss
2. Boss name appears in large text: "Moonwake Guardian"
3. Boss does a slow attack animation (no damage)
4. Camera zooms back to normal
5. Battle music layer kicks in
6. Total duration: ~2.5 seconds

### 2E. Boss Death Payoff
When boss dies:
1. Time slow (timeScale 0.3 for 1 second)
2. Boss explodes in element-colored particles (20+ particles)
3. Screen flash (brief white, 100ms)
4. Victory music sting
5. Loot drops with arc animation
6. Victory panel appears after 2-3 seconds (not immediately)
7. Camera slowly zooms out to show full arena

## Task 3: Audio Variation & Polish

### 3A. SFX Pitch Variation
In AudioManager, when playing any SFX:
- Add random pitch variation: ±4% (0.96 to 1.04)
- Don't repeat the exact same pitch more than 2 times in a row
- Store last 2 pitch values, ensure new one is different

### 3B. Hit SFX Variations
Add 3 pitch variations for hit sounds:
- Normal hit: base pitch
- Critical hit: pitch × 1.15
- Weakness hit: pitch × 1.08 + different tone

### 3C. Music Duck on Hit
When player hits enemy, briefly duck music volume by 15% for 80ms, then restore.

### 3D. Low HP Heartbeat
When player HP < 30%:
- Add subtle low-frequency pulse to ambient (every 1.5 seconds)
- Volume increases as HP decreases
- Stops when HP recovers above 30%

### 3E. Pause Audio
When game is paused (Esc/menu open):
- Apply low-pass filter to music (don't stop it)
- Reduce volume to 40%
- Resume normally when unpaused

### 3F. Death Audio
When player dies:
- Fade all audio over 0.5 seconds
- Don't stop abruptly

## Task 4: Mobile Touch Polish

### 4A. Button Size
Minimum touch button size: 52×52px (target: 56-64px).
Check existing touch controls in `createTouchControls()` and ensure all buttons meet this minimum.

### 4B. Button Spacing
Minimum 10px between buttons.

### 4C. Button Press Feedback
When touch button is pressed:
- Scale down to 0.94 (already partly implemented, verify)
- Brief color flash
- Haptic feedback if available (navigator.vibrate)

### 4D. Auto-Aim on Mobile
When attacking via touch (no pointer direction):
- Auto-aim at nearest enemy within attack range
- If no enemy nearby, attack in facing direction

### 4E. Skill Targeting Forgiveness
On mobile, skill targeting should have 20% larger hit radius.

### 4F. Prevent Page Scroll/Zoom
Ensure game canvas has:
```css
touch-action: none;
-webkit-touch-callout: none;
user-select: none;
```
Check index.html for these styles.

### 4G. Pause on Tab Hidden
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) this.pauseGame()
})
```

### 4H. Audio Context Resume
After tab becomes visible again:
```typescript
if (audioManager.context?.state === 'suspended') audioManager.resume()
```

## Task 5: Micro-Polish

### 5A. Title Screen Idle Animation
Title screen already has embers and aurora (good). Add:
- Subtle breathing pulse on the title text (already exists via tween)
- "Press Start" blinking timing: 1.2s on, 0.8s off (smooth sine, not harsh blink)
- Menu cursor has soft glow (already exists)

### 5B. Button Hover Polish
All interactive buttons should:
- Scale 1.05 on hover (already implemented for title)
- Color change on hover (already implemented)
- Sound on hover (ui_blip, already implemented for title)
- Ensure menu/shop/help buttons also have hover SFX

### 5C. Transition Fade
All scene transitions should be 200-300ms (not longer).
Check existing transitions and ensure they're within this range.

### 5D. Area Name Display
Area name banner appears for 1.5 seconds, then fades.
Verify existing timing is in the 1.2-1.8 second range.

### 5E. Objective Complete Sting
When an objective is completed:
- Play a short positive SFX (use existing 'objective_complete' or similar)
- Brief green flash on objective text
- Text updates to next objective after 1 second delay

### 5F. NPC Turns to Player
When player is within interact range of NPC, the NPC should face the player.
Check existing createProceduralNpc and add facing logic.

### 5G. Player Turns to NPC During Dialogue
When interacting with NPC, player should face the NPC.
Already partially implemented via `updateFacingFromVector`.

### 5H. Chest Anticipation
When opening a chest:
- 200ms anticipation (chest shakes slightly)
- Then opens with reward

### 5I. Loot Arc
Gold drops should have a small arc trajectory:
```typescript
this.tweens.add({
  targets: loot,
  y: loot.y - 20, // arc up
  duration: 300,
  ease: 'Sine.easeOut',
  yoyo: true,
})
```

### 5J. Enemy Death Dissolve
Enemy death should:
- Sprite scale to 1.3 while fading to 0 (dissolve)
- 5-8 element-colored particles burst outward
- Duration: 400-600ms

### 5K. Credits Skip
Ensure credits can be skipped with Esc or Enter.
Check existing credits rollout.

### 5L. Demo Complete CTA
After game completion (homecoming stage):
- Show "Demo Complete" panel
- Options: "Replay" (reset save, go to title), "Credits"
- Clean, polished panel with gold accent

## Task 6: Performance

### 6A. Object Pooling
For frequently created/destroyed objects:
- Damage numbers: pool of 20, reuse
- Particles: pool of 50, reuse
- Don't create new objects every frame

### 6B. Particle Limit
On mobile (detect via touch support):
- Limit active particles to 30
- Reduce particle count per effect by 50%

### 6C. Lazy Scene Loading
Boss assets should only be needed when boss battle starts (already handled by procedural generation).

### 6D. FPS Monitoring
Add FPS display in DEV_MODE only:
```typescript
if (DEV_MODE) {
  this.fpsText = this.add.text(8, this.scale.height - 20, '', { color: '#86efac', fontSize: '11px' }).setScrollFactor(0).setDepth(200)
}
// In update:
if (DEV_MODE && this.fpsText) this.fpsText.setText(`FPS: ${this.game.loop.actualFps.toFixed(0)}`)
```

## Verification
1. `npm run typecheck` must pass
2. `npm run build` must pass (0 warnings)
3. No `letterSpacing` in src
4. Hints show progressively and only once
5. Boss has 4-phase pacing with telegraphs
6. Audio has pitch variation
7. Touch buttons are 52+ px
8. All transitions are 200-300ms
9. Object pooling is implemented for damage numbers
10. Credits are skippable

## Critical Rules
- DO NOT change map layout, tile types, or tile rendering
- DO NOT change combat damage formulas or enemy base stats
- DO NOT change quest logic or story content
- DO NOT break existing save compatibility (SaveData interface unchanged)
- All new features must integrate with existing systems
- Keep procedural asset generation approach
