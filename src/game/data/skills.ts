export type SkillType = 'physical' | 'magical' | 'heal' | 'buff' | 'debuff'

export type TargetType =
  | 'single_enemy'
  | 'all_enemies'
  | 'self'
  | 'single_ally'
  | 'all_allies'

export type Element =
  | 'neutral'
  | 'wind'
  | 'ember'
  | 'arcane'
  | 'ice'
  | 'thunder'
  | 'earth'
  | 'light'
  | 'dark'

export interface Skill {
  id: string
  name: string
  type: SkillType
  element: Element
  mpCost: number
  power: number
  target: TargetType
  description: string
  isResonance: boolean
  statusEffect?: string
  statusChance?: number
  duration?: number
}
