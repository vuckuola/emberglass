# Phase 5B: Companion Combat AI

Add combat AI so Kael and Io fight alongside Nara. PartyCompanion type and sprites already exist from Phase 5A.

## Current State (DO NOT recreate these)
- `PartyCompanion` type at line 150 with: characterId, name, container, body, hpBar, hpBarBg, mpBar, x, y, partyIndex, state, offsetX, offsetY, attackCooldown, lastAttackTime, hitFlashTimer
- `this.companions: PartyCompanion[]` at line 217
- `createCompanion(partyIndex)` at line 968 — already creates sprites
- `updateCompanions()` at line 1012 — currently only handles following. ADD combat AI HERE
- `updateCompanionBars(companion)` at line 1036 — draws HP/MP bars
- `this.mapEnemies: MapEnemy[]` — all enemies
- `CombatSystem.calculateRealtimePlayerDamage(atk, def)` — damage formula
- `showFloatingText(x, y, text, color)` — floating damage numbers
- `persist()` — auto-saves to localStorage
- `killEnemy(enemy)` — handles enemy death + loot + XP
- `refreshHud()` — updates HUD text
- Kael = party[1], earth tank, green sprite (30x30)
- Io = party[2], light healer, blue sprite (26x26)

## Tasks

### 1. Add lastSkillTime to PartyCompanion type (line 150 area)
Add `lastSkillTime: number` to the type, init to 0 in createCompanion.

### 2. Modify updateCompanions() — add combat AI after follow logic
For each non-dead companion, AFTER the existing follow code:

**Kael (characterId === 'kael'):**
- Find nearest alive enemy within 180px using Phaser.Math.Distance.Between
- If enemy found and distance <= 50: attack it (if cooldown ready)
  - Create small orange arc swing visual at enemy position (Phaser.Math.Angle.Between to get angle)
  - Damage = CombatSystem.calculateRealtimePlayerDamage(kaelAtk, enemy.stats.def)
  - Use kael's scaled stats: scaleCharacterStats(CHARACTERS.kael, member.level).atk
  - Apply damage: enemy.currentHp -= damage, flash white, check death
  - Show floating text with damage
  - Set lastAttackTime = this.time.now
- If enemy found but distance > 50: move toward enemy (lerp x/y toward enemy, skip follow offset)
- If no enemy: normal follow behavior (existing code)

**Io (characterId === 'io'):**
- HEAL FIRST: Check all party members (indices 0,1,2). Find whoever has lowest HP ratio (currentHp/maxHp)
- If lowest HP ratio < 0.5 AND io.currentMp >= 6 AND time.now - lastSkillTime > 3000:
  - Heal that member: currentHp = min(maxHp, currentHp + 24)
  - Deduct 6 MP from io
  - Show green "+24" floating text at healed target position
  - Set lastSkillTime = this.time.now
  - Call persist()
  - If healed companion was dead (HP was 0), set state to 'follow', alpha to 1
- ATTACK: If no heal needed, find nearest enemy within 200px:
  - Create blue circle projectile visual tweened toward enemy (duration 300ms)
  - On tween complete: deal damage = CombatSystem.calculateRealtimePlayerDamage(ioMag, enemy.def) * 0.7
  - ioMag from scaleCharacterStats(CHARACTERS.io, member.level).mag
  - Show floating damage text
  - Set lastAttackTime = this.time.now
- If no target: normal follow behavior

### 3. Enemies can hit companions
In `updateMapEnemies()` method, modify enemy targeting:
- 30% of enemies should target nearest companion instead of player
- Add helper: `private getNearestCompanion(enemy: MapEnemy): PartyCompanion | null`
- When targeting companion: chase companion.x/y, try attack at range
- If enemy attacks companion: damage goes to saveData.party[companion.partyIndex].currentHp
- Show damage text, flash companion body white briefly (setFillStyle white, reset after 120ms)
- If companion HP <= 0: companion.state = 'dead', container alpha 0.3, showToast "Kael/Io falls!"
- STILL check player too — 70% of enemies target player as before

### 4. Revive companions at save crystal
In `checkSavePoint()` method, after existing save logic, add:
- this.companions.forEach: if dead, revive to 50% HP, state = 'follow', alpha = 1
- showToast if any companion was revived

### 5. Shared XP on kill
In `killEnemy()`, the XP already goes to battleRewards.exp. The level-up logic uses this.
Current code only checks party[0] level. Modify to check ALL party members.
Find where level-ups are calculated and loop through all 3 party members.

### 6. Call persist() after companion combat actions
After companion attacks, takes damage, or heals — call this.persist() to save state.

## CRITICAL RULES
- Do NOT use `letterSpacing` — Phaser 3.80.1 does NOT support it
- Do NOT create new files — all changes in OverworldScene.ts only
- Do NOT modify the PartyCompanion type fields that already exist (only ADD lastSkillTime)
- Do NOT recreate createCompanion or updateCompanionBars — they work fine
- Reuse ALL existing methods: scaleCharacterStats, CombatSystem.calculateRealtimePlayerDamage, showFloatingText, persist, refreshHud, isWallAtWorld
- Kill enemy death check: if enemy.currentHp <= 0, call killEnemy(enemy) — same as player attacks
- Run `npx tsc --noEmit && npm run build && git add -A && git commit -m "Phase 5B: companion combat AI — Kael melee tank, Io healer/mage, shared XP"`
