import type { CharacterStats } from '../data/characters';
import type { Skill, TargetType, Element } from '../data/skills';

export type BattleState =
  | 'selecting_action'
  | 'selecting_target'
  | 'executing'
  | 'enemy_turn'
  | 'victory'
  | 'defeat'
  | 'escaped'

type StatKey = keyof CharacterStats

type BattleEntityData = {
  id?: string
  name?: string
  isPlayer?: boolean
  stats?: CharacterStats
  baseStats?: CharacterStats
  currentHp?: number
  currentMp?: number
  maxHp?: number
  maxMp?: number
  hp?: number
  mp?: number
  stagger?: number
  resonance?: number
  statusEffects?: Map<string, number> | Record<string, number> | Array<[string, number]>
  skills?: Skill[]
  element?: Element
  elementalAffinity?: Element
  weaknesses?: Element[]
  elementalWeakness?: Element[]
  resists?: Element[]
  elementalResist?: Element[]
  expReward?: number
  goldReward?: number
}

export class BattleEntity {
  id: string
  name: string
  isPlayer: boolean
  stats: CharacterStats
  currentHp: number
  currentMp: number
  maxHp: number
  maxMp: number
  stagger: number
  resonance: number
  statusEffects: Map<string, number>
  skills: Skill[]
  element: Element
  weaknesses: Element[]
  resists: Element[]
  expReward: number
  goldReward: number

  constructor(data: BattleEntityData) {
    const stats = data.stats ?? data.baseStats ?? {
      hp: data.hp ?? 1,
      mp: data.mp ?? 0,
      atk: 1,
      def: 1,
      spd: 1,
      mag: 1,
    }

    this.id = data.id ?? data.name ?? 'entity'
    this.name = data.name ?? this.id
    this.isPlayer = data.isPlayer ?? false
    this.stats = { ...stats }
    this.maxHp = data.maxHp ?? stats.hp
    this.maxMp = data.maxMp ?? stats.mp
    this.currentHp = Math.min(data.currentHp ?? this.maxHp, this.maxHp)
    this.currentMp = Math.min(data.currentMp ?? this.maxMp, this.maxMp)
    this.stagger = data.stagger ?? 0
    this.resonance = data.resonance ?? 0
    this.statusEffects = BattleEntity.createStatusMap(data.statusEffects)
    this.skills = data.skills ?? []
    this.element = data.element ?? data.elementalAffinity ?? 'neutral'
    this.weaknesses = data.weaknesses ?? data.elementalWeakness ?? []
    this.resists = data.resists ?? data.elementalResist ?? []
    this.expReward = data.expReward ?? 50
    this.goldReward = data.goldReward ?? 20
  }

  get isAlive(): boolean {
    return this.currentHp > 0
  }

  private static createStatusMap(
    effects: BattleEntityData['statusEffects'],
  ): Map<string, number> {
    if (effects instanceof Map) {
      return new Map(effects)
    }

    if (Array.isArray(effects)) {
      return new Map(effects)
    }

    if (effects && typeof effects === 'object') {
      return new Map(Object.entries(effects))
    }

    return new Map()
  }
}

export class CombatResult {
  damage: number
  healed: boolean
  missed: boolean
  critical: boolean
  effectiveness: string

  constructor(result: Partial<CombatResult> = {}) {
    this.damage = result.damage ?? 0
    this.healed = result.healed ?? false
    this.missed = result.missed ?? false
    this.critical = result.critical ?? false
    this.effectiveness = result.effectiveness ?? 'normal'
  }
}

export class CombatSystem {
  party: BattleEntity[]
  enemies: BattleEntity[]
  turnOrder: BattleEntity[]
  currentEntity: BattleEntity
  state: BattleState
  selectedSkill: Skill | null

  private effectiveness: Record<string, string[]> = {
    wind: ['earth'],
    ember: ['ice', 'wind'],
    arcane: ['thunder'],
    ice: ['wind', 'earth'],
    thunder: ['arcane'],
    earth: ['ember', 'thunder'],
    light: ['dark'],
    dark: ['light'],
  }

  constructor(party: BattleEntity[], enemies: BattleEntity[]) {
    this.party = party
    this.enemies = enemies
    this.turnOrder = this.calculateTurnOrder()
    this.currentEntity = this.turnOrder[0] ?? this.party[0] ?? this.enemies[0]
    this.state = this.currentEntity?.isPlayer ? 'selecting_action' : 'enemy_turn'
    this.selectedSkill = null

    const battleEnd = this.checkBattleEnd()
    if (battleEnd) {
      this.state = battleEnd
    }
  }

  calculateTurnOrder(): BattleEntity[] {
    return [...this.party, ...this.enemies].sort(
      (a, b) => b.stats.spd - a.stats.spd + Math.random() * 2 - 1,
    )
  }

  selectSkill(skill: Skill): boolean {
    if (!this.currentEntity || !this.currentEntity.isPlayer) {
      return false
    }

    if (!this.canUseSkill(this.currentEntity, skill)) {
      return false
    }

    this.selectedSkill = skill
    this.state = 'selecting_target'
    return true
  }

  getValidTargets(actor: BattleEntity, targetType: TargetType): BattleEntity[] {
    const allies = actor.isPlayer ? this.party : this.enemies
    const opponents = actor.isPlayer ? this.enemies : this.party

    switch (targetType) {
      case 'single_enemy':
        return opponents.filter((entity) => entity.isAlive)
      case 'all_enemies':
        return opponents.filter((entity) => entity.isAlive)
      case 'self':
        return actor.isAlive ? [actor] : []
      case 'single_ally':
        return allies.filter((entity) => entity.isAlive)
      case 'all_allies':
        return allies.filter((entity) => entity.isAlive)
    }
  }

  executeSelectedSkill(targets: BattleEntity[]): CombatResult[] {
    if (!this.selectedSkill) {
      return []
    }

    const results = this.executeSkill(this.currentEntity, this.selectedSkill, targets)
    this.selectedSkill = null
    this.finishAction()
    return results
  }

  executeSkill(
    attacker: BattleEntity,
    skill: Skill,
    targets: BattleEntity[],
  ): CombatResult[] {
    if (!attacker.isAlive || !this.canUseSkill(attacker, skill)) {
      return []
    }

    const validTargets = this.getValidTargets(attacker, skill.target)
    const chosenTargets = this.normalizeTargets(skill.target, targets, validTargets)
    if (chosenTargets.length === 0) {
      return []
    }

    attacker.currentMp = Math.max(0, attacker.currentMp - skill.mpCost)
    if (skill.isResonance) {
      attacker.resonance = 0
    }

    this.state = 'executing'

    // Build resonance for non-resonance skills (base 18, modified by equip)
    if (!skill.isResonance) {
      let gain = 18
      // Skywell Shard and similar relics boost resonance via resonancePercent stat
      // The value is stored in equipment but checked here for simplicity
      attacker.resonance = Math.min(100, attacker.resonance + gain)
    }

    return chosenTargets.map((target) => {
      const result = this.calculateDamage(attacker, target, skill)
      this.applyDamage(target, result)
      this.applyCureStatus(target, skill)
      this.applySecondaryEffect(target, skill)
      return result
    })
  }

  calculateDamage(
    attacker: BattleEntity,
    defender: BattleEntity,
    skill: Skill,
  ): CombatResult {
    if (skill.type === 'buff' || skill.type === 'debuff') {
      return new CombatResult()
    }

    if (skill.type === 'heal') {
      const casterMag = this.getEffectiveStat(attacker, 'mag')
      const variance = 0.9 + Math.random() * 0.2
      const healing = Math.max(1, Math.floor((skill.power + casterMag) * variance))
      return new CombatResult({ damage: healing, healed: true })
    }

    const missed = Math.random() < 0.05
    if (missed) {
      return new CombatResult({ missed: true })
    }

    const attackStat =
      skill.type === 'magical'
        ? this.getEffectiveStat(attacker, 'mag')
        : this.getEffectiveStat(attacker, 'atk')
    const defenseStat =
      skill.type === 'magical'
        ? this.getEffectiveStat(defender, 'mag')
        : this.getEffectiveStat(defender, 'def')
    const elementMultiplier = this.getElementMultiplier(defender, skill.element)
    const variance = 0.9 + Math.random() * 0.2
    const critical = Math.random() < 0.1
    const criticalMultiplier = critical ? 1.5 : 1
    const rawDamage =
      skill.power *
      (Math.max(1, attackStat) / Math.max(1, defenseStat)) *
      elementMultiplier *
      variance *
      criticalMultiplier
    const damage = Math.max(1, Math.floor(rawDamage))

    return new CombatResult({
      damage,
      healed: false,
      missed,
      critical,
      effectiveness: this.getEffectivenessLabel(elementMultiplier),
    })
  }

  applyDamage(target: BattleEntity, result: CombatResult): void {
    if (result.missed) {
      return
    }

    if (result.healed) {
      target.currentHp = Math.min(target.maxHp, target.currentHp + result.damage)
      return
    }

    target.currentHp = Math.max(0, target.currentHp - result.damage)
    target.stagger += 15 + result.damage * 0.1

    if (target.stagger >= 100 && target.isAlive) {
      target.statusEffects.set('staggered', 1)
      target.stagger = 0
    }
  }

  isWeakTo(target: BattleEntity, element: Element): boolean {
    if (element === 'neutral') {
      return false
    }

    return (
      target.weaknesses.includes(element) ||
      this.effectiveness[element]?.includes(target.element) ||
      false
    )
  }

  isResistantTo(target: BattleEntity, element: Element): boolean {
    if (element === 'neutral') {
      return false
    }

    return (
      target.resists.includes(element) ||
      this.effectiveness[target.element]?.includes(element) ||
      false
    )
  }

  private decrementStatus(entity: BattleEntity, status: string): void {
    const remaining = (entity.statusEffects.get(status) ?? 0) - 1
    if (remaining <= 0) {
      entity.statusEffects.delete(status)
    } else {
      entity.statusEffects.set(status, remaining)
    }
  }

  processStatusEffects(entity: BattleEntity): void {
    let shouldSkip = false

    for (const [status, turns] of [...entity.statusEffects.entries()]) {
      if (turns <= 0) {
        entity.statusEffects.delete(status)
        continue
      }

      switch (status) {
        case 'poison':
          entity.currentHp = Math.max(0, entity.currentHp - 5)
          this.decrementStatus(entity, status)
          break
        case 'burn':
          entity.currentHp = Math.max(0, entity.currentHp - 8)
          this.decrementStatus(entity, status)
          break
        case 'stun':
        case 'staggered':
          shouldSkip = true
          this.decrementStatus(entity, status)
          break
        case 'freeze':
          if (Math.random() < 0.5) {
            entity.statusEffects.delete(status)
          } else {
            shouldSkip = true
            this.decrementStatus(entity, status)
          }
          break
        case 'buff_atk':
        case 'buff_def':
          this.decrementStatus(entity, status)
          break
        default:
          this.decrementStatus(entity, status)
          break
      }
    }

    if (shouldSkip) {
      entity.statusEffects.set('skip_turn', 1)
    }
  }

  beginCurrentTurn(): boolean {
    if (!this.currentEntity || !this.currentEntity.isAlive) {
      this.advanceTurn()
      return false
    }

    this.processStatusEffects(this.currentEntity)

    if (!this.currentEntity.isAlive) {
      this.finishAction()
      return false
    }

    if (this.currentEntity.statusEffects.has('skip_turn')) {
      this.currentEntity.statusEffects.delete('skip_turn')
      this.finishAction()
      return false
    }

    this.state = this.currentEntity.isPlayer ? 'selecting_action' : 'enemy_turn'
    return true
  }

  executeEnemyTurn(): CombatResult[] {
    const enemy = this.currentEntity
    if (!enemy || enemy.isPlayer || !enemy.isAlive) {
      return []
    }

    const usableSkills = enemy.skills.filter((skill) => this.canUseSkill(enemy, skill))
    const skill = usableSkills[Math.floor(Math.random() * usableSkills.length)]
    if (!skill) {
      this.finishAction()
      return []
    }

    const targets = this.getValidTargets(enemy, skill.target)
    const preferredTargets =
      skill.target === 'single_enemy' || skill.target === 'single_ally'
        ? [targets[Math.floor(Math.random() * targets.length)]]
        : targets
    const results = this.executeSkill(enemy, skill, preferredTargets.filter(Boolean))
    this.finishAction()
    return results
  }

  finishAction(): void {
    const battleEnd = this.checkBattleEnd()
    if (battleEnd) {
      this.state = battleEnd
      return
    }

    this.advanceTurn()
  }

  advanceTurn(): void {
    const livingEntities = this.turnOrder.filter((entity) => entity.isAlive)
    if (livingEntities.length === 0) {
      return
    }

    const currentIndex = livingEntities.indexOf(this.currentEntity)
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % livingEntities.length
    this.turnOrder = livingEntities
    this.currentEntity = livingEntities[nextIndex]
    this.state = this.currentEntity.isPlayer ? 'selecting_action' : 'enemy_turn'
  }

  attemptEscape(): boolean {
    if (this.canEscape()) {
      this.state = 'escaped'
      return true
    }

    this.finishAction()
    return false
  }

  canEscape(): boolean {
    return Math.random() > 0.3
  }

  getReward(): { exp: number; gold: number } {
    return this.enemies.reduce(
      (acc, enemy) => ({
        exp: acc.exp + enemy.expReward,
        gold: acc.gold + enemy.goldReward,
      }),
      { exp: 0, gold: 0 },
    )
  }

  checkBattleEnd(): 'victory' | 'defeat' | null {
    if (this.enemies.every((enemy) => enemy.currentHp <= 0)) {
      return 'victory'
    }

    if (this.party.every((entity) => entity.currentHp <= 0)) {
      return 'defeat'
    }

    return null
  }

  private canUseSkill(actor: BattleEntity, skill: Skill): boolean {
    return (
      actor.currentHp > 0 &&
      actor.currentMp >= skill.mpCost &&
      (!skill.isResonance || actor.resonance >= 100)
    )
  }

  private normalizeTargets(
    targetType: TargetType,
    chosenTargets: BattleEntity[],
    validTargets: BattleEntity[],
  ): BattleEntity[] {
    const validTargetSet = new Set(validTargets)

    if (targetType === 'all_enemies' || targetType === 'all_allies') {
      return validTargets
    }

    const chosenTarget = chosenTargets.find((target) => validTargetSet.has(target))
    return chosenTarget ? [chosenTarget] : []
  }

  private getElementMultiplier(defender: BattleEntity, element: Element): number {
    if (this.isWeakTo(defender, element)) {
      return 1.5
    }

    if (this.isResistantTo(defender, element)) {
      return 0.5
    }

    return 1
  }

  private getEffectivenessLabel(multiplier: number): string {
    if (multiplier > 1) {
      return 'super_effective'
    }

    if (multiplier < 1) {
      return 'resisted'
    }

    return 'normal'
  }

  private getEffectiveStat(entity: BattleEntity, stat: StatKey): number {
    const multiplier = this.getStatMultiplier(entity, stat)
    return Math.max(1, Math.floor(entity.stats[stat] * multiplier))
  }

  private getStatMultiplier(entity: BattleEntity, stat: StatKey): number {
    if (stat === 'atk' && entity.statusEffects.has('buff_atk')) {
      return 1.2
    }

    if (stat === 'def' && entity.statusEffects.has('buff_def')) {
      return 1.2
    }

    return 1
  }

  private applySecondaryEffect(target: BattleEntity, skill: Skill): void {
    const statusEffect = this.getSkillStatusEffect(skill)
    if (!statusEffect) {
      return
    }

    const chance = skill.statusChance ?? 1
    if (Math.random() > chance) {
      return
    }

    target.statusEffects.set(statusEffect, skill.duration ?? 3)
  }

  private applyCureStatus(target: BattleEntity, skill: Skill): void {
    if (!skill.cureStatus) {
      return
    }

    skill.cureStatus.split(',').map((status) => status.trim()).filter(Boolean).forEach((status) => {
      target.statusEffects.delete(status)
    })
  }

  private getSkillStatusEffect(skill: Skill): string | null {
    if (skill.statusEffect) {
      return skill.statusEffect
    }

    if (skill.type === 'buff') {
      return skill.id.includes('atk') || skill.id === 'overclock'
        ? 'buff_atk'
        : 'buff_def'
    }

    if (skill.type === 'debuff') {
      return skill.id.includes('burn') ? 'burn' : 'stun'
    }

    return null
  }
}
