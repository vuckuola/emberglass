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

    if (typeof save.gold !== 'number' || save.gold < 0) {
      return false
    }

    save.timestamp = typeof save.timestamp === 'number' ? save.timestamp : Date.now()
    save.slot = typeof save.slot === 'number' ? save.slot : 0
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
    save.playTime = typeof save.playTime === 'number' ? save.playTime : 0

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
      typeof member.level !== 'number' ||
      typeof member.currentHp !== 'number' ||
      typeof member.currentMp !== 'number'
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
      Number.isFinite(item.quantity) &&
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
      typeof position.x === 'number' &&
      typeof position.y === 'number'
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
      typeof rewards.exp === 'number' &&
      rewards.exp >= 0 &&
      typeof rewards.gold === 'number' &&
      rewards.gold >= 0 &&
      typeof rewards.emberShards === 'number' &&
      rewards.emberShards >= 0
    )
  }

  private static isNullableString(value: unknown): value is string | null {
    return typeof value === 'string' || value === null
  }
}
