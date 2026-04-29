Create all data files for the JRPG game "Emberglass: Covenant of the Skywell" in src/game/data/.

**characters.ts:**
```typescript
export interface CharacterStats {
  hp: number; mp: number; atk: number; def: number; spd: number; mag: number;
}
export interface GrowthRates {
  hp: number; mp: number; atk: number; def: number; spd: number; mag: number;
}
export interface Character {
  id: string; name: string; role: string;
  baseStats: CharacterStats;
  growthRates: GrowthRates;
  element: string;
  startingSkills: string[];
  portraitPath: string;
  spritesheetPath: string;
}
```
Define 3 characters:
- nara: "Nara", role: "Cartographer", balanced (atk 12, def 8, spd 10, mag 10, hp 120, mp 40), element "wind", skills ["slash", "cartograph", "windslash", "resonance_nara"]
- kael: "Kael", role: "Shrine-Guard", tank (atk 14, def 14, spd 7, mag 6, hp 160, mp 25), element "ember", skills ["emberslash", "fortify", "counterstance", "resonance_kael"]  
- io: "Io", role: "Machine-Oracle", support (atk 6, def 7, spd 12, mag 16, hp 90, mp 60), element "arcane", skills ["arcanebolt", "diagnose", "overclock", "resonance_io"]

Export const CHARACTERS: Character[] and CHARACTERS_BY_ID record.

**skills.ts:**
```typescript
export type SkillType = 'physical' | 'magical' | 'heal' | 'buff' | 'debuff';
export type TargetType = 'single_enemy' | 'all_enemies' | 'self' | 'single_ally' | 'all_allies';
export type Element = 'neutral' | 'wind' | 'ember' | 'arcane' | 'ice' | 'thunder' | 'earth' | 'light' | 'dark';
export interface Skill {
  id: string; name: string; type: SkillType; element: Element;
  mpCost: number; power: number; target: TargetType;
  description: string; isResonance: boolean;
}
```
Define 18 skills total including 3 resonance ultimates. Include basic_attack (power 10, no mp) and defend (power 0, self, buff_def). Make resonance skills cost 0 mp but require resonance=100. Power ranges: normal 8-25, resonance 50-80.

Export const SKILLS: Skill[] and SKILLS_BY_ID record.

**items.ts:**
```typescript
export type ItemType = 'consumable' | 'weapon' | 'charm' | 'relic' | 'key';
export interface ItemEffect { stat?: string; value?: number; healHp?: number; healMp?: number; cureStatus?: string; }
export interface Item {
  id: string; name: string; type: ItemType;
  effect: ItemEffect; value: number; description: string;
}
```
Define 15 items:
- Consumables: health_potion (heal 50hp), mana_potion (heal 30mp), health_elixir (heal 150hp), mana_elixir (heal 80mp), revive_crystal (revive KO ally with 25% hp), antidote, burn_salve
- Weapons: cartographer_staff (+5atk), ember_blade (+8atk), oracle_core (+3atk +6mag)
- Charms: wind_charm (+10spd), ember_charm (+10def), arcane_charm (+10mag)
- Relics: skywell_shard (resonance+20%), glass_lens (crit+15%)
- Key: lighthouse_key

Export const ITEMS: Item[] and ITEMS_BY_ID record.

**enemies.ts:**
```typescript
export interface EnemySkill { id: string; name: string; power: number; element: string; chance: number; }
export type EnemyBehavior = 'aggressive' | 'cautious' | 'support';
export interface Enemy {
  id: string; name: string; region: string;
  stats: CharacterStats;
  skills: EnemySkill[];
  weaknesses: string[]; resists: string[];
  expReward: number; goldReward: number;
  spritePath: string; behavior: EnemyBehavior;
}
```
Define 16 enemies, 4 per region:
- verdant: vinecrawler (hp 45), moss_knight (hp 70), sporefiend (hp 55), archive_guardian (hp 90)
- mirrordrift: glass_scorpion (hp 60), sand_wraith (hp 80), mirror_phantom (hp 65), dune_sentinel (hp 100)
- thunderveil: storm_imp (hp 55), volt_crawler (hp 75), thunder_hawk (hp 85), crystal_golem (hp 110)
- skywell: emberglass_wisp (hp 70), memory_phantom (hp 95), void_walker (hp 120), skywell_guardian (hp 130)

Each has 2-3 skills, 1-2 weaknesses, 1 resist, appropriate rewards.

**bosses.ts:**
```typescript
export interface BossPhase { hpThreshold: number; newSkill?: EnemySkill; behaviorChange?: string; }
export interface Boss {
  id: string; name: string; region: string;
  stats: CharacterStats; phases: BossPhase[];
  skills: EnemySkill[];
  weaknesses: string[]; resists: string[];
  expReward: number; goldReward: number;
  spritePath: string; introDialogue: string[];
}
```
Define 4 bosses:
- thornheart: hp 350, verdant, 2 phases (at 50% gains "entangle" skill), weakness fire
- refraction_queen: hp 450, mirrordrift, 2 phases (at 60% creates mirror), weakness earth
- storm_seraph: hp 550, thunderveil, 3 phases (at 66% charges, at 33% lightning arena), weakness ice
- cartographers_lie: hp 800, skywell, 3 phases (at 66% map distort, at 33% memory erase), weakness arcane

Export arrays and ID records for all.

After creating ALL files, run `npx tsc --noEmit` and fix any errors.
