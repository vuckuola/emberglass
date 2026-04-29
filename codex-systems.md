Create the combat system and save system for the JRPG.

**src/game/systems/CombatSystem.ts:**
Full turn-based combat engine as a class. Import types from ../data/skills and ../data/characters.

```typescript
import { CharacterStats } from '../data/characters';
import { Skill, SkillType, TargetType, Element } from '../data/skills';

export type BattleState = 'selecting_action' | 'selecting_target' | 'executing' | 'enemy_turn' | 'victory' | 'defeat' | 'escaped';

export class BattleEntity {
  id: string; name: string; isPlayer: boolean;
  stats: CharacterStats; currentHp: number; currentMp: number;
  maxHp: number; maxMp: number;
  stagger: number; resonance: number;
  statusEffects: Map<string, number>; // status -> turns remaining
  skills: Skill[];
  constructor(data: any) { /* assign all fields */ }
}

export class CombatResult {
  damage: number; healed: boolean; missed: boolean; critical: boolean; effectiveness: string;
}

export class CombatSystem {
  party: BattleEntity[];
  enemies: BattleEntity[];
  turnOrder: BattleEntity[];
  currentEntity: BattleEntity;
  state: BattleState;
  selectedSkill: Skill | null;
  
  // Element effectiveness chart
  private effectiveness: Record<string, string[]> = {
    wind: ['earth'], ember: ['ice', 'wind'], arcane: ['thunder'],
    ice: ['wind', 'earth'], thunder: ['arcane'], earth: ['ember', 'thunder'],
    light: ['dark'], dark: ['light']
  };

  constructor(party: BattleEntity[], enemies: BattleEntity[]) { /* init */ }
  
  calculateTurnOrder(): BattleEntity[] {
    // Sort all entities by spd stat, highest first. Shuffle ties.
    return [...this.party, ...this.enemies].sort((a, b) => b.stats.spd - a.stats.spd + Math.random() * 2 - 1);
  }
  
  calculateDamage(attacker: BattleEntity, defender: BattleEntity, skill: Skill): CombatResult {
    // Formula: skill.power * (attacker.stats.atk / defender.stats.def) * elementMultiplier * (0.9 + Math.random() * 0.2)
    // For magical: use mag instead of atk, defender.mag for defense
    // Element multiplier: 1.5 if super effective, 0.5 if resisted, 1.0 otherwise
    // Critical: 10% chance, 1.5x damage
    // Return CombatResult
  }
  
  applyDamage(target: BattleEntity, result: CombatResult): void {
    target.currentHp = Math.max(0, target.currentHp - result.damage);
    // Add stagger: 15 + result.damage * 0.1
    // Check stagger >= 100: target skips next turn, reset stagger
  }
  
  isWeakTo(target: BattleEntity, element: Element): boolean { /* check */ }
  
  processStatusEffects(entity: BattleEntity): void {
    // poison: -5hp per turn, decrement turns
    // burn: -8hp per turn
    // stun: skip turn, decrement
    // freeze: 50% chance to thaw, else skip
    // buff_atk/buff_def: +20% to stat, decrement
  }
  
  canEscape(): boolean { return Math.random() > 0.3; }
  
  getReward(): { exp: number; gold: number; } {
    return this.enemies.reduce((acc, e) => ({ exp: acc.exp + 50, gold: acc.gold + 20 }), { exp: 0, gold: 0 });
  }
  
  checkBattleEnd(): 'victory' | 'defeat' | null {
    if (this.enemies.every(e => e.currentHp <= 0)) return 'victory';
    if (this.party.every(e => e.currentHp <= 0)) return 'defeat';
    return null;
  }
}
```

Make ALL methods fully implemented with real logic. No stubs.

**src/game/systems/SaveSystem.ts:**
```typescript
export interface SaveData {
  version: number;
  timestamp: number;
  slot: number;
  party: Array<{
    characterId: string; level: number; currentHp: number; currentMp: number;
    equipment: { weapon: string | null; charm: string | null; relic: string | null };
    skills: string[];
  }>;
  inventory: Array<{ itemId: string; quantity: number }>;
  gold: number;
  position: { mapId: string; x: number; y: number };
  quests: Record<string, string>; // questId -> status
  flags: Record<string, boolean>;
  playTime: number;
}

export class SaveSystem {
  static readonly SAVE_VERSION = 1;
  static readonly MAX_SLOTS = 3;
  
  static save(slot: number, data: SaveData): boolean {
    try {
      data.slot = slot; data.timestamp = Date.now();
      localStorage.setItem(`emberglass_save_${slot}`, JSON.stringify(data));
      return true;
    } catch { return false; }
  }
  
  static load(slot: number): SaveData | null {
    try {
      const raw = localStorage.getItem(`emberglass_save_${slot}`);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return SaveSystem.validate(data) ? data : null;
    } catch { return null; }
  }
  
  static validate(data: any): data is SaveData {
    // Check version, party array, inventory array, position object, etc.
    // Return false if any required field missing or wrong type
    // Be lenient — extra fields are ok, missing optional fields get defaults
    return typeof data?.version === 'number' && Array.isArray(data?.party);
  }
  
  static delete(slot: number): void { localStorage.removeItem(`emberglass_save_${slot}`); }
  
  static getSlotInfo(slot: number): { exists: boolean; timestamp?: number; playTime?: number; mapName?: string } | null {
    const data = this.load(slot);
    if (!data) return null;
    return { exists: true, timestamp: data.timestamp, playTime: data.playTime };
  }
  
  static autoSave(data: SaveData): boolean { return this.save(0, data); } // slot 0 = auto
}
```

**src/game/systems/ProgressionSystem.ts:**
```typescript
export class ProgressionSystem {
  static expForLevel(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.5)); // exponential curve
  }
  
  static calculateStats(baseStats: CharacterStats, growthRates: any, level: number): CharacterStats {
    // Each level adds growthRate to base. Level 1 = base stats.
    const levels = level - 1;
    return {
      hp: Math.floor(baseStats.hp + growthRates.hp * levels),
      mp: Math.floor(baseStats.mp + growthRates.mp * levels),
      atk: Math.floor(baseStats.atk + growthRates.atk * levels),
      def: Math.floor(baseStats.def + growthRates.def * levels),
      spd: Math.floor(baseStats.spd + growthRates.spd * levels),
      mag: Math.floor(baseStats.mag + growthRates.mag * levels),
    };
  }
  
  static getExpToNextLevel(currentExp: number, level: number): number {
    return this.expForLevel(level + 1) - currentExp;
  }
}
```

After creating all files, run `npx tsc --noEmit` and fix errors.
