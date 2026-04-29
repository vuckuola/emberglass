import type { CharacterStats, GrowthRates } from '../data/characters'

export class ProgressionSystem {
  static expForLevel(level: number): number {
    return Math.floor(50 * Math.pow(level, 1.5))
  }

  static calculateStats(
    baseStats: CharacterStats,
    growthRates: GrowthRates,
    level: number,
  ): CharacterStats {
    const levels = Math.max(0, level - 1)

    return {
      hp: Math.floor(baseStats.hp + growthRates.hp * levels),
      mp: Math.floor(baseStats.mp + growthRates.mp * levels),
      atk: Math.floor(baseStats.atk + growthRates.atk * levels),
      def: Math.floor(baseStats.def + growthRates.def * levels),
      spd: Math.floor(baseStats.spd + growthRates.spd * levels),
      mag: Math.floor(baseStats.mag + growthRates.mag * levels),
    }
  }

  static getExpToNextLevel(currentExp: number, level: number): number {
    return Math.max(0, this.expForLevel(level + 1) - currentExp)
  }
}
