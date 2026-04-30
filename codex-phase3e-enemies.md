# Emberglass Phase 3E — Enemy Expansion & Battle AI

## Context
Emberglass is a browser JRPG (Phaser 3 + React + TypeScript + Vite). Phases 1-3D done including skills, shop, battle items.

Current enemies are basic — they pick a random usable skill each turn. This pass adds more enemy types, smarter AI, and battle variety.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style
- Do NOT change SaveData interface
- Keep all existing battle flow working
- Use only programmatic graphics
- No console.log in production code

## Task 1: New Regular Enemies (enemies.ts)

Add 4 new regular enemy types that can appear in random encounters:

```typescript
// Ice-type glass creature
{ id: 'frost_shard', name: 'Frost Shard', stats: { hp: 42, mp: 15, atk: 11, def: 8, spd: 16, mag: 13 }, skills: [{ id: 'ice_lance', name: 'Ice Lance', element: 'ice', power: 16 }, { id: 'crystallize', name: 'Crystallize', element: 'ice', power: 0 }], weaknesses: ['ember', 'earth'], resists: ['ice', 'wind'], expReward: 28, goldReward: 18 }

// Thunder bird
{ id: 'storm_wisp', name: 'Storm Wisp', stats: { hp: 36, mp: 20, atk: 9, def: 7, spd: 22, mag: 15 }, skills: [{ id: 'spark_chain', name: 'Spark Chain', element: 'thunder', power: 14 }, { id: 'static_field', name: 'Static Field', element: 'thunder', power: 0 }], weaknesses: ['earth'], resists: ['thunder', 'wind'], expReward: 32, goldReward: 22 }

// Dark wisps
{ id: 'hollow_wisp', name: 'Hollow Wisp', stats: { hp: 30, mp: 24, atk: 8, def: 6, spd: 18, mag: 17 }, skills: [{ id: 'void_tap', name: 'Void Tap', element: 'dark', power: 18 }, { id: 'drain', name: 'Drain', element: 'dark', power: 10 }], weaknesses: ['light'], resists: ['dark', 'arcane'], expReward: 35, goldReward: 24 }

// Earth golem
{ id: 'clay_sentinel', name: 'Clay Sentinel', stats: { hp: 68, mp: 10, atk: 15, def: 18, spd: 5, mag: 6 }, skills: [{ id: 'slam', name: 'Slam', element: 'earth', power: 22 }, { id: 'harden', name: 'Harden', element: 'earth', power: 0 }], weaknesses: ['ice', 'wind'], resists: ['earth', 'ember'], expReward: 40, goldReward: 28 }
```

## Task 2: Smarter Enemy AI (CombatSystem.ts)

Replace the random skill selection in `executeEnemyTurn()` with basic AI patterns:

### AI Priority System
```typescript
private chooseEnemySkill(enemy: BattleEntity): Skill {
  const usableSkills = enemy.skills.filter(skill => this.canUseSkill(enemy, skill));
  if (usableSkills.length === 0) return usableSkills[0]; // fallback
  
  const party = this.party.filter(e => e.isAlive);
  const lowestHpAlly = party.reduce((a, b) => a.currentHp / a.maxHp < b.currentHp / b.maxHp ? a : b, party[0]);
  
  // Healer enemies (light element) prioritize healing if any ally < 40% HP
  if (enemy.element === 'light' && usableSkills.some(s => s.type === 'heal')) {
    const allies = this.enemies.filter(e => e.isAlive && e !== enemy && e.currentHp / e.maxHp < 0.4);
    if (allies.length > 0) return usableSkills.find(s => s.type === 'heal')!;
  }
  
  // Buffing enemies use buffs when no buff is active
  if (usableSkills.some(s => s.type === 'buff') && !enemy.statusEffects.has('buff_atk') && !enemy.statusEffects.has('buff_def')) {
    return usableSkills.find(s => s.type === 'buff')!;
  }
  
  // Use strongest damage skill when any party member is below 30% HP (finish them)
  const criticalAlly = party.find(e => e.currentHp / e.maxHp < 0.3);
  if (criticalAlly) {
    const damageSkills = usableSkills.filter(s => s.type === 'physical' || s.type === 'magical');
    if (damageSkills.length > 0) return damageSkills.reduce((a, b) => (b.power > a.power ? b : a));
  }
  
  // Default: weighted random — prefer higher power skills but not always
  return usableSkills[Math.floor(Math.random() * usableSkills.length)];
}
```

Also, for enemy targeting, instead of pure random, enemies should prefer:
- The lowest HP party member (40% of the time)
- Random target (60% of the time)

Update `executeEnemyTurn()` to use these methods.

## Task 3: Random Encounter Variety (OverworldScene.ts)

Currently random encounters always use `['vinecrawler', 'moss_knight']`. Add variety:

When starting a random battle, choose enemy composition based on the current game stage:
- `quay` stage: vinecrawler + moss_knight (existing, easy)
- `field` stage: pick 2 from [vinecrawler, moss_knight, frost_shard, storm_wisp]
- `shrine` stage: pick 2 from [frost_shard, storm_wisp, hollow_wisp, clay_sentinel]
- `archive` stage: pick 2 from [storm_wisp, hollow_wisp, clay_sentinel] (harder)
- `skywell` stage: pick 2 from [hollow_wisp, clay_sentinel] (hardest regular)
- `homecoming`: no random encounters

Also, sometimes (20% chance) spawn 3 enemies instead of 2 in shrine/archive/skywell.

Find where random encounters are triggered in the overworld and modify the enemy selection there.

## Task 4: Status Effect Application for Enemies (BattleScene.ts)

Currently enemies have buff skills (like `harden`, `crystallize`) but the `enemySkillToSkill` method maps all skills with `power: 0` as `type: 'buff'` with `target: 'self'`. This works for self-buffs.

But for enemy debuff attacks (like `drain` which should also heal), enhance the conversion:
- If skill name includes 'drain' → type: 'magical', power: as-is, target: 'single_enemy' (drain is just damage for simplicity)
- If skill name includes 'static' or 'field' → type: 'debuff', target: 'all_enemies' (AOE debuff attempt)

Add `burn` status chance to fire/ember enemy attacks (10% chance, 2 turns).
Add `poison` status chance to dark/earth enemy attacks (8% chance, 3 turns).

## Files to Modify
- `src/game/data/enemies.ts` — new enemy types
- `src/game/systems/CombatSystem.ts` — enemy AI, targeting
- `src/game/scenes/BattleScene.ts` — enemy skill conversion, status effects
- `src/game/scenes/OverworldScene.ts` — encounter variety

## Validation
1. `npm run typecheck` — must pass
2. `npm run build` — must succeed
