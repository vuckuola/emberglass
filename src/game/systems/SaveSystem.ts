export interface SaveData {
  version: number
  timestamp: number
  slot: number
  party: Array<{
    characterId: string
    level: number
    currentHp: number
    currentMp: number
    equipment: { weapon: string | null; charm: string | null; relic: string | null }
    skills: string[]
  }>
  inventory: Array<{ itemId: string; quantity: number }>
  gold: number
  openedChests: string[]
  completedEvents: string[]
  currentObjective: string
  battleRewards: { exp: number; gold: number; emberShards: number }
  position: { mapId: string; x: number; y: number }
  quests: Record<string, string>
  flags: Record<string, boolean>
  stage: 'quay' | 'field' | 'shrine' | 'archive' | 'skywell' | 'homecoming'
  pet: { unlocked: boolean; id: string | null; name: string | null; forageReady: boolean; bonus: string | null }
  home: { warmth: number; garden: number; workshop: number }
  playTime: number
}

type MutableSaveData = SaveData & Record<string, unknown>

export class SaveSystem {
  static readonly SAVE_VERSION = 1
  static readonly MAX_SLOTS = 3

  static save(slot: number, data: SaveData): boolean {
    try {
      if (!this.isValidSlot(slot)) {
        return false
      }

      data.version = this.SAVE_VERSION
      data.slot = slot
      data.timestamp = Date.now()
      localStorage.setItem(`emberglass_save_${slot}`, JSON.stringify(data))
      return true
    } catch {
      return false
    }
  }

  static load(slot: number): SaveData | null {
    try {
      if (!this.isValidSlot(slot)) {
        return null
      }

      const raw = localStorage.getItem(`emberglass_save_${slot}`)
      if (!raw) {
        return null
      }

      const data = JSON.parse(raw)
      return SaveSystem.validate(data) ? data : null
    } catch {
      return null
    }
  }

  static validate(data: unknown): data is SaveData {
    if (!this.isObject(data)) {
      return false
    }

    const save = data as Partial<MutableSaveData>
    if (save.version !== SaveSystem.SAVE_VERSION) {
      return false
    }

    if (
      !Array.isArray(save.party) ||
      !save.party.every((member) => this.isValidPartyMember(member))
    ) {
      return false
    }

    if (
      !Array.isArray(save.inventory) ||
      !save.inventory.every((item) => this.isValidInventoryItem(item))
    ) {
      return false
    }

    if (!this.isValidPosition(save.position)) {
      return false
    }

    if (!this.isNonNegativeFiniteNumber(save.gold)) {
      return false
    }

    save.timestamp = this.isNonNegativeFiniteNumber(save.timestamp) ? save.timestamp : Date.now()
    save.slot = typeof save.slot === 'number' && this.isValidSlot(save.slot) ? save.slot : 0
    save.openedChests = this.isStringArray(save.openedChests) ? save.openedChests : []
    save.completedEvents = this.isStringArray(save.completedEvents) ? save.completedEvents : []
    save.currentObjective =
      typeof save.currentObjective === 'string'
        ? save.currentObjective
        : 'Speak with Elder Maelin at Luma Quay.'
    save.battleRewards = this.isBattleRewards(save.battleRewards)
      ? save.battleRewards
      : { exp: 0, gold: 0, emberShards: 0 }
    save.quests = this.isStringRecord(save.quests) ? save.quests : {}
    save.flags = this.isBooleanRecord(save.flags) ? save.flags : {}
    save.stage = this.isValidStage(save.stage) ? save.stage : 'quay'
    save.pet = this.isValidPet(save.pet) ? save.pet : { unlocked: false, id: null, name: null, forageReady: false, bonus: null }
    save.home = this.isValidHome(save.home) ? save.home : { warmth: 0, garden: 0, workshop: 0 }
    save.playTime = this.isNonNegativeFiniteNumber(save.playTime) ? save.playTime : 0

    return true
  }

  static delete(slot: number): void {
    if (this.isValidSlot(slot)) {
      localStorage.removeItem(`emberglass_save_${slot}`)
    }
  }

  static getSlotInfo(
    slot: number,
  ): { exists: boolean; timestamp?: number; playTime?: number; mapName?: string } | null {
    const data = this.load(slot)
    if (!data) {
      return null
    }

    return {
      exists: true,
      timestamp: data.timestamp,
      playTime: data.playTime,
      mapName: data.position.mapId,
    }
  }

  static autoSave(data: SaveData): boolean {
    return this.save(0, data)
  }

  private static isValidSlot(slot: number): boolean {
    return Number.isInteger(slot) && slot >= 0 && slot <= this.MAX_SLOTS
  }

  private static isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  private static isValidPartyMember(value: unknown): boolean {
    if (!this.isObject(value)) {
      return false
    }

    const member = value as SaveData['party'][number]
    if (
      typeof member.characterId !== 'string' ||
      !this.isNonNegativeFiniteNumber(member.level) ||
      !this.isNonNegativeFiniteNumber(member.currentHp) ||
      !this.isNonNegativeFiniteNumber(member.currentMp)
    ) {
      return false
    }

    if (!this.isObject(member.equipment)) {
      member.equipment = { weapon: null, charm: null, relic: null }
    }

    if (!this.isNullableString(member.equipment.weapon)) {
      member.equipment.weapon = null
    }

    if (!this.isNullableString(member.equipment.charm)) {
      member.equipment.charm = null
    }

    if (!this.isNullableString(member.equipment.relic)) {
      member.equipment.relic = null
    }

    if (!Array.isArray(member.skills)) {
      member.skills = []
    }

    member.skills = member.skills.filter((skill) => typeof skill === 'string')
    return true
  }

  private static isValidInventoryItem(value: unknown): boolean {
    if (!this.isObject(value)) {
      return false
    }

    const item = value as SaveData['inventory'][number]
    return (
      typeof item.itemId === 'string' &&
      Number.isInteger(item.quantity) &&
      item.quantity >= 0
    )
  }

  private static isValidPosition(value: unknown): value is SaveData['position'] {
    if (!this.isObject(value)) {
      return false
    }

    const position = value as SaveData['position']
    return (
      typeof position.mapId === 'string' &&
      Number.isFinite(position.x) &&
      Number.isFinite(position.y)
    )
  }

  private static isStringRecord(value: unknown): value is Record<string, string> {
    return (
      this.isObject(value) &&
      Object.values(value).every((entry) => typeof entry === 'string')
    )
  }

  private static isBooleanRecord(value: unknown): value is Record<string, boolean> {
    return (
      this.isObject(value) &&
      Object.values(value).every((entry) => typeof entry === 'boolean')
    )
  }

  private static isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  }

  private static isBattleRewards(value: unknown): value is SaveData['battleRewards'] {
    if (!this.isObject(value)) {
      return false
    }

    const rewards = value as SaveData['battleRewards']
    return (
      this.isNonNegativeFiniteNumber(rewards.exp) &&
      this.isNonNegativeFiniteNumber(rewards.gold) &&
      this.isNonNegativeFiniteNumber(rewards.emberShards)
    )
  }

  private static isValidStage(value: unknown): value is SaveData['stage'] {
    return typeof value === 'string' && ['quay', 'field', 'shrine', 'archive', 'skywell', 'homecoming'].includes(value)
  }

  private static isValidPet(value: unknown): value is SaveData['pet'] {
    if (!this.isObject(value)) {
      return false
    }
    const pet = value as SaveData['pet']
    return typeof pet.unlocked === 'boolean' && this.isNullableString(pet.id) && this.isNullableString(pet.name) && typeof pet.forageReady === 'boolean' && this.isNullableString(pet.bonus)
  }

  private static isValidHome(value: unknown): value is SaveData['home'] {
    if (!this.isObject(value)) {
      return false
    }
    const home = value as SaveData['home']
    return [home.warmth, home.garden, home.workshop].every((entry) => Number.isInteger(entry) && entry >= 0 && entry <= 1)
  }

  private static isNonNegativeFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value >= 0
  }

  private static isNullableString(value: unknown): value is string | null {
    return typeof value === 'string' || value === null
  }
}
