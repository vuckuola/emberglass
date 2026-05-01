# Patch Pack 2: Premium Game Feel — Movement, Combat, Camera, Parry, HP Bars, Loot

You are working on `src/game/scenes/OverworldScene.ts`.

## Task 1: Movement Tuning

### 1A. Walk Speed
Change `PLAYER_SPEED` from 160 to 175 (target: 170-180 range).

### 1B. Dash Tuning
Current values (line ~3270-3272):
```
dashUntil = this.time.now + 200    // active time
nextDashAt = this.time.now + 1500  // total cooldown
dash multiplier = 2.5               // in update()
```

Change to:
```typescript
const DASH_ACTIVE_MS = 140          // active dash time (target: 130-160ms)
const DASH_COOLDOWN_MS = 450        // total cooldown (active + recovery)
const DASH_MULTIPLIER = 2.25        // speed boost during dash (target: 2.15-2.35)
const DASH_INVULN_MS = 90           // invulnerability during dash start (target: 80-120ms)
```

Add these as class-level constants. Replace the hardcoded values in the dash method.
The dash recovery is `DASH_COOLDOWN_MS - DASH_ACTIVE_MS = 310ms`.
Implement dash after-hit cancel: if player attacks within the recovery window and 60% of recovery has passed, cancel the remaining cooldown.

### 1C. Block Movement Speed
Change block speed multiplier from 0.4 to 0.58 (target: 55-65%).
Find: `(dashing ? 2.5 : 1) * (this.isBlocking ? 0.4 : 1)`
Replace with: `(dashing ? DASH_MULTIPLIER : 1) * (this.isBlocking ? 0.58 : 1)`

### 1D. Input Buffer System
Add an input buffer system for attack, dash, and interact:
```typescript
private inputBuffer: { action: string; time: number } | null = null
private readonly INPUT_BUFFER_MS = 100  // 100ms buffer for attack/dash
private readonly INTERACT_BUFFER_MS = 150  // 150ms buffer for interact
```

In the update loop, when Space is pressed but player can't attack (cooldown), store the action in the buffer.
On next frame when attack becomes available, consume the buffer automatically.
Same for dash (Shift) and interact (E).

### 1E. Dash Dust Puff
When dash starts, create 2-3 small circle particles at player's feet that fade out over 200ms.
```typescript
// In dash method, after setting dashUntil:
for (let i = 0; i < 3; i++) {
  const dust = this.add.circle(
    this.player.x + Phaser.Math.Between(-8, 8),
    this.player.y + 16 + Phaser.Math.Between(-4, 4),
    Phaser.Math.Between(3, 6), 0x8b7355, 0.6
  ).setDepth(9)
  this.tweens.add({
    targets: dust,
    alpha: 0, scaleX: 1.5, scaleY: 0.5,
    duration: 200 + i * 40,
    onComplete: () => dust.destroy()
  })
}
```

### 1F. Dash Afterimage
During dash, create a semi-transparent afterimage every 40ms:
```typescript
// In update, when dashing:
if (dashing && this.time.now % 40 < 20 && this.player) {
  const ghost = this.add.image(this.player.x, this.player.y, this.player.texture?.key || '', this.player.frame?.name || 0)
    .setAlpha(0.2).setTint(0x9ff3ff).setDepth(10)
  this.tweens.add({
    targets: ghost,
    alpha: 0, duration: 200,
    onComplete: () => ghost.destroy()
  })
}
```

### 1G. Obstacle Slide on Dash
When player collides with wall during dash, instead of stopping dead:
- Create spark particles (2-3 small orange circles at collision point)
- Reduce dash speed by 50% for remaining dash duration
- Small camera nudge away from wall

## Task 2: Attack Feel Tuning

### 2A. Attack Timing
Current: `nextPlayerAttackAt = this.time.now + 320` (total cooldown)
Target: Light attack total 260-320ms, hitbox active 70-120ms after input.

Change to:
```typescript
const ATTACK_TOTAL_MS = 300           // total attack cooldown (target: 260-320)
const ATTACK_HITBOX_DELAY_MS = 90     // hitbox becomes active after this delay
const ATTACK_RECOVERY_MS = 130        // recovery after hitbox window closes
const COMBO_WINDOW_MS = 150           // combo window before recovery ends
const HITSTOP_LIGHT_MS = 30           // light hit hitstop (target: 24-36)
const HITSTOP_HEAVY_MS = 55           // heavy/skill hit hitstop (target: 45-70)
```

The attack should be split into phases:
1. **Anticipation** (0-90ms): player starts swing animation, no hitbox yet
2. **Contact** (90-210ms): hitbox is active, check for enemies in arc
3. **Recovery** (210-300ms): can cancel into combo at 150ms mark

Implement this with a state machine:
```typescript
private attackState: 'idle' | 'anticipation' | 'contact' | 'recovery' = 'idle'
private attackStartTime = 0
```

### 2B. Slash Arc Visual Improvement
Current slash is a single arc. Improve:
- Make slash thicker and more visible
- Add a "trail" that follows the arc angle
- Color: bright white core (#f8fdff) with cyan tint (#9ff3ff) edge
- On miss: add whoosh dust effect (small gray particles)
- On hit: add enemy-specific particles (fire for ember, ice for frost, etc.)

### 2C. Damage Number Improvement
Current damage numbers are simple text. Improve:
- Add gravity/ease to damage numbers (float up, slow down, fade)
- Critical hits: bigger font, gold color (#ffd36e), slight screen nudge
- Weakness hits: show "WEAK" text below damage number in cyan
- Resisted hits: smaller font, gray color (#74788f)
- Numbers should start at enemy position, float up ~30px, fade over 800ms

### 2D. Hit Flash + Squash
When enemy is hit:
- Flash white for 50ms (already exists as `hitFlashTimer = 80`)
- Reduce to 50ms
- Add squash effect: scale enemy sprite to (1.15, 0.85) then bounce back to (1, 1) over 100ms
- On critical: bigger squash (1.25, 0.75)

### 2E. Camera Micro-nudge on Hit
Replace `this.cameras.main.shake(100, 0.002)` with a proper camera nudge:
```typescript
// Light hit:
this.cameras.main.shake(80, 0.008)  // target: 0.006-0.010, 70-100ms

// Heavy/skill hit:
this.cameras.main.shake(140, 0.018)  // target: 0.014-0.022, 120-180ms

// Boss hit:
this.cameras.main.shake(160, 0.022)  // target: 0.014-0.022
```

### 2F. Miss Feedback
When attack hits no enemy:
- Play whoosh SFX (different from hit SFX)
- Create small dust puff in attack direction
- Show no damage number

## Task 3: Camera Tuning

### 3A. Follow Lerp
Current: `this.cameras.main.startFollow(this.player, true, 0.12, 0.12)`
Change to: `this.cameras.main.startFollow(this.player, true, 0.1, 0.1)` (target: 0.1-0.18)

### 3B. Camera Lookahead
Add subtle camera offset based on facing direction:
```typescript
// In update(), after player movement:
const lookAheadX = this.facing === 'right' ? 22 : this.facing === 'left' ? -22 : 0
const lookAheadY = this.facing === 'down' ? 14 : this.facing === 'up' ? -14 : 0
const targetOffsetX = this.player.x + lookAheadX
const targetOffsetY = this.player.y + lookAheadY
// Smoothly interpolate camera deadzone offset
this.cameras.main.setFollowOffset(
  Phaser.Math.Linear(this.cameras.main.followOffset.x, lookAheadX, 0.08),
  Phaser.Math.Linear(this.cameras.main.followOffset.y, lookAheadY, 0.08)
)
```

### 3C. Low HP Camera Breathing
When player HP < 30% of max HP:
```typescript
if (heroHp / heroMaxHp < 0.3) {
  const breathe = Math.sin(this.time.now * 0.002) * 0.015
  this.cameras.main.setZoom(1 + breathe)
}
```
Very subtle — just enough to create tension.

### 3D. Boss Phase Camera Effects
These already exist partially. Enhance:
- Boss phase transition: zoom to 1.12 (already exists at 1.15, keep it)
- Boss arena start: zoom to 0.95 briefly, then back to 1.0

### 3E. Deadzone
The camera should not move for very small player movements. Phaser's startFollow with `roundPixels: true` already helps. Add a deadzone:
```typescript
this.cameras.main.setDeadzone(40, 28)  // 40×28px deadzone
```

## Task 4: Parry / Perfect Block System

### 4A. Parry Window
Add perfect block mechanic:
```typescript
const PARRY_WINDOW_MS = 140          // perfect block window (target: 120-160ms)
const PARRY_STAGGER_MS = 2000        // enemy stagger on perfect block
const PARRY_REWARD_MANA = 5          // mana restored on perfect block
const PARRY_SLOW_MO_MS = 80          // slow-motion duration
```

### 4B. Implementation
When player is blocking (F held) and enemy attack lands within PARRY_WINDOW_MS of block start:
1. Show "PING" visual — expanding cyan ring at player position
2. Play special parry SFX (use existing SFX with higher pitch)
3. Stagger enemy for PARRY_STAGGER_MS
4. Restore PARRY_REWARD_MANA MP
5. Brief slow-motion effect (reduce timeScale to 0.3 for PARRY_SLOW_MO_MS)
6. Perfect block text "PERFECT" floats up in gold

### 4C. Failed Block
Normal block (not within parry window):
- Reduce damage by 60% (current: 60% reduction — keep)
- Shield arc visual shrinks slightly
- Normal block SFX

### 4D. Shield Ring Visual
- Normal block: shield arc visible at full size
- Near parry window: shield arc pulses brighter
- Perfect block: shield arc flashes bright cyan + expanding ring
- After perfect block: shield arc fades to show cooldown

### 4E. Block Start Tracking
Track when block was started:
```typescript
private blockStartTime = 0
```
Set when `isBlocking` transitions from false to true. Use for parry window calculation.

## Task 5: Smooth HP Bars

### 5A. Delayed Damage Bar
Add a "trailing" HP bar that shows the previous HP value, slowly catching up:
```typescript
// On HP change, set target HP immediately, but visual HP lerps
private visualHp = heroMaxHp
private visualHpTarget = heroMaxHp
```

In update:
```typescript
if (this.visualHp > this.visualHpTarget) {
  this.visualHp = Math.max(this.visualHpTarget, this.visualHp - (this.visualHp - this.visualHpTarget) * 0.03)
}
```

The trailing bar color: darker red (#991b1b) behind the current HP bar.
Delay: ~300ms for the visual to catch up (at 60fps, 0.03 lerp factor).

### 5B. Same for Enemy HP Bars
Enemy HP bars should have the same trailing effect.

### 5C. Low HP Warning
When player HP < 30%: HP bar pulses red with a subtle glow.

## Task 6: Loot Magnet

### 6A. Pickup Range
Gold and items dropped by enemies should have a magnetic attraction when player is within 48px:
```typescript
// In update, for each loot pickup:
const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, loot.x, loot.y)
if (dist < 48) {
  // Move loot toward player
  const angle = Phaser.Math.Angle.Between(loot.x, loot.y, this.player.x, this.player.y)
  loot.x += Math.cos(angle) * 3
  loot.y += Math.sin(angle) * 3
}
if (dist < 16) {
  // Collect
  this.collectLoot(loot)
}
```

### 6B. Loot Visual
Gold drops should have a small sparkle/spin animation. Use existing tween system.

## Task 7: Cooldown Visual Polish

### 7A. Skill Cooldown Radial
Skill cooldowns already have radial graphics. Improve:
- Show remaining seconds text when cooldown > 3s
- When skill becomes available, flash the icon briefly
- When skill is pressed while on cooldown: shake the icon + gray overlay

### 7B. Dash Ready Indicator
Current dash ready text pulses. Improve:
- Show "DASH" text near player (above head) that fades in/out
- Small cooldown ring around player when dash is recharging
- Don't show text at all — just a subtle visual cue

## Verification
1. `npm run typecheck` must pass
2. `npm run build` must pass
3. No `letterSpacing` in src
4. All new constants are defined at class level (not magic numbers)
5. Input buffer works for attack, dash, and interact
6. Dash has dust puff + afterimage
7. Camera has lookahead + deadzone
8. Parry system has visual/audio feedback
9. HP bars have trailing effect
10. Loot magnet attracts pickups within 48px

## Critical Rules
- DO NOT change map layout, tile rendering, NPC dialogue, quest logic, or story text
- DO NOT change enemy stats, spawn positions, or boss patterns (that's Patch Pack 3)
- ONLY change: movement values, attack timing, camera behavior, parry system, HP bar visuals, loot pickup
- Keep all existing functionality working
- All new features must not break existing combat, exploration, or UI
