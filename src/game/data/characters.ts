import type { Skill } from './skills'

export interface CharacterStats {
  hp: number
  mp: number
  atk: number
  def: number
  spd: number
  mag: number
}

export interface GrowthRates {
  hp: number
  mp: number
  atk: number
  def: number
  spd: number
  mag: number
}

export interface CharacterData {
  id: string
  name: string
  baseStats: CharacterStats
  growth: GrowthRates
  element: Skill['element']
  skills: Skill[]
}

export const CHARACTERS: Record<string, CharacterData> = {
  nara: {
    id: 'nara',
    name: 'Nara',
    baseStats: { hp: 86, mp: 34, atk: 14, def: 10, spd: 14, mag: 16 },
    growth: { hp: 9, mp: 5, atk: 2, def: 2, spd: 2, mag: 3 },
    element: 'ember',
    skills: [
      {
        id: 'emberglass_strike',
        name: 'Emberglass Strike',
        type: 'physical',
        element: 'ember',
        mpCost: 0,
        power: 18,
        target: 'single_enemy',
        description: 'A quick blade strike wreathed in emberlight.',
        isResonance: false,
      },
      {
        id: 'skywell_spark',
        name: 'Skywell Spark',
        type: 'magical',
        element: 'arcane',
        mpCost: 5,
        power: 22,
        target: 'single_enemy',
        description: 'A focused burst of Skywell energy.',
        isResonance: false,
      },
      {
        id: 'emberglass_resonance',
        name: 'Emberglass Nova',
        type: 'magical',
        element: 'ember',
        mpCost: 0,
        power: 42,
        target: 'all_enemies',
        description: 'Unleash stored emberlight in a devastating wave.',
        isResonance: true,
      },
    ],
  },
  kael: {
    id: 'kael',
    name: 'Kael',
    baseStats: { hp: 104, mp: 22, atk: 18, def: 15, spd: 9, mag: 8 },
    growth: { hp: 12, mp: 3, atk: 3, def: 3, spd: 1, mag: 1 },
    element: 'earth',
    skills: [
      {
        id: 'iron_cleave',
        name: 'Iron Cleave',
        type: 'physical',
        element: 'neutral',
        mpCost: 0,
        power: 20,
        target: 'single_enemy',
        description: 'A heavy weapon swing.',
        isResonance: false,
      },
      {
        id: 'guard_break',
        name: 'Guard Break',
        type: 'physical',
        element: 'earth',
        mpCost: 4,
        power: 24,
        target: 'single_enemy',
        description: 'A crushing strike that can stagger a foe.',
        isResonance: false,
        statusEffect: 'staggered',
        statusChance: 0.2,
        duration: 1,
      },
      {
        id: 'tectonic_resonance',
        name: 'Tectonic Slam',
        type: 'physical',
        element: 'earth',
        mpCost: 0,
        power: 38,
        target: 'all_enemies',
        description: 'Channel seismic force through the earth.',
        isResonance: true,
      },
    ],
  },
  io: {
    id: 'io',
    name: 'Io',
    baseStats: { hp: 74, mp: 46, atk: 9, def: 9, spd: 12, mag: 20 },
    growth: { hp: 7, mp: 6, atk: 1, def: 2, spd: 2, mag: 4 },
    element: 'light',
    skills: [
      {
        id: 'lumen_bolt',
        name: 'Lumen Bolt',
        type: 'magical',
        element: 'light',
        mpCost: 0,
        power: 17,
        target: 'single_enemy',
        description: 'A precise beam of blue-white light.',
        isResonance: false,
      },
      {
        id: 'mend',
        name: 'Mend',
        type: 'heal',
        element: 'light',
        mpCost: 6,
        power: 24,
        target: 'single_ally',
        description: 'Restore a small amount of health.',
        isResonance: false,
      },
      {
        id: 'lumen_resonance',
        name: 'Lumen Restoration',
        type: 'heal',
        element: 'light',
        mpCost: 0,
        power: 50,
        target: 'all_allies',
        description: 'Channel stored light to heal all allies.',
        isResonance: true,
      },
    ],
  },
}
