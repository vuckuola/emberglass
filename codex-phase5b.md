# Phase 5B: Companion Combat AI

Emberglass Phase 5A added Kael and Io as visible companions following the player. Now add combat AI so they actually fight alongside Nara.

## Context
- `PartyCompanion` type already exists with: characterId, name, container, body, hpBar, etc.
- `this.companions: PartyCompanion[]` — array of 2 companions (Kael index 1, Io index 2)
- `this.mapEnemies: MapEnemy[]` — all enemies on the map
- `this.saveData.party[partyIndex]` — party member data (currentHp, currentMp, skills)
- `CombatSystem.calculateRealtimePlayerDamage(atk, def)` — damage formula
- `CombatSystem.canUseRealtimeSkill(mp, cost, now, readyAt)` — skill check
- `CHARACTERS[id]` — character data with skills, baseStats, growth
- `scaleCharacterStats(character, level)` — stat calculation
- `damageEnemy(enemy, multiplier)` — existing method damages an enemy
- `killEnemy(enemy)` — existing method handles enemy death
- Kael: tank, earth element, melee (Iron Cleave skill)
- Io: healer/mage, light element, ranged (Mend heals, Lumen Bolt attacks)

## Tasks

### 1. Add companion AI state machine to updateCompanions()
For each non-dead companion, add AI behavior after following logic:

**Kael AI (partyIndex 1):**
- Find nearest alive enemy within aggro range (180px)
- If enemy in range: move toward it (chase state), attack when within 50px
- Attack = create a small arc swing visual (reuse performPlayerAttack pattern but smaller)
- Damage = CombatSystem.calculateRealtimePlayerDamage(kaelAtk, enemy.def)
- Attack cooldown: 1200ms
- If no enemy nearby: follow player (follow state)

**Io AI (partyIndex 2):**
- HEAL PRIORITY: If any party member (Nara, Kael, or Io) below 50% HP and Io has MP >= 6:
  - Heal lowest HP party member (restore ~24 HP based on Mend skill power)
  - Show green "+XX" floating text on healed target
  - Deduct MP from saveData.party[2].currentMp
  - Cooldown: 3000ms
- ATTACK: If no heal needed, find nearest enemy within 200px:
  - Create a small light projectile visual (blue circle that moves toward enemy)
  - Damage = CombatSystem.calculateRealtimePlayerDamage(ioMag, enemy.def) * 0.7
  - Cooldown: 2000ms
- If no target: follow player

### 2. Enemies can target companions
In `updateMapEnemies()`, modify enemy targeting:
- 30% chance per enemy to target nearest companion instead of player
- If targeting companion, enemy chases companion.x/y instead of player
- If enemy attacks companion: damage goes to saveData.party[companion.partyIndex].currentHp
- Show floating damage text on companion
- If companion HP <= 0: set companion.state = 'dead', dim the sprite, show "Kael Down!" toast
- Companion stays dead until player uses save crystal (auto-revive at save point) or Io heals them

### 3. Companion auto-revive at save point
In the save point check (checkSavePoint), also revive dead companions:
- Set companion.state = 'follow'
- Restore HP to 50% of max
- Show toast "Kael/Io restored at save crystal"

### 4. Update killEnemy() for shared XP
Currently only party[0] gets XP. Modify to distribute XP to all party members:
- Each party member gets the same exp from battleRewards
- Level up check should apply to all party members, not just Nara
- Show toast for companion level ups too

### 5. Add companion skill cooldown tracking
Add to PartyCompanion type:
- `lastSkillTime: number` — tracks skill cooldown
- `lastHealTime: number` — tracks heal cooldown (Io only)

### 6. Persist companion HP/MP after combat
After companion attacks or takes damage, call `this.persist()` to save state.
Already handled if we modify saveData.party directly and call persist.

### 7. Visual feedback for companion attacks
- Kael attack: orange-brown arc swing (similar to player but smaller, 0.8 opacity)
- Io attack: blue projectile (small circle tweening toward enemy)
- Io heal: green sparkle on healed target
- Companion hit flash: briefly turn white when damaged (like enemies)

## CRITICAL RULES
- Do NOT use `letterSpacing` — Phaser 3.80.1 does NOT support it
- Do NOT create new files — all changes in OverworldScene.ts
- Import CombatSystem is already at top of file
- Reuse existing damageEnemy() for companion attacks — just pass the companion's ATK
- Be careful with circular references — companions reference enemies, enemies reference player
- Run `npx tsc --noEmit && npm run build && git add -A && git commit -m "Phase 5B: companion combat AI — Kael melee tank, Io healer/mage"`
