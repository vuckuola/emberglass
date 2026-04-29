import Phaser from 'phaser'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'

const TILE_SIZE = 48
const MAP_WIDTH = 20
const MAP_HEIGHT = 15
const PLAYER_SPEED = 160
const SAVE_TILE = { x: 5, y: 5 }
const CHEST_TILE = { x: 15, y: 8 }
const GUIDE_TILE = { x: 8, y: 3 }
const ELDER_TILE = { x: 10, y: 3 }
const MARKER_TILE = { x: 16, y: 11 }
const SIGNPOST_TILE = { x: 3, y: 11 }
const FIELD_BATTLE_TILE = { x: 17, y: 12 }
const FIELD_BATTLE_ID = 'field_marker_battle'
const CHEST_ID = 'quay_supply_chest'

const OBJECTIVES = {
  talkToElder: 'Speak with Elder Maelin at Luma Quay.',
  inspectMarker: 'Inspect the ruin marker in the eastern field.',
  winBattle: 'Defeat the field guardian beyond the marker.',
  returnToElder: 'Return to Elder Maelin with the ember shard.',
  complete: 'Save at the skywell. Luma Quay is safe for now.',
} as const

type Direction = 'up' | 'down' | 'left' | 'right'
type OverworldInitData = {
  newGame?: boolean
  continueGame?: boolean
  battleResult?: {
    battleId?: string
    victory?: boolean
    rewards?: { exp: number; gold: number; emberShards: number; items: Array<{ itemId: string; quantity: number }> }
  }
}

type InventoryCounts = { potion: number; ether: number; emberShard: number }

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private player?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  private playerOutline?: Phaser.GameObjects.Rectangle
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space', Phaser.Input.Keyboard.Key>
  private walls = new Set<string>()
  private facing: Direction = 'down'
  private saveNoticeShown = false
  private busy = false
  private initData: OverworldInitData = {}
  private saveData!: SaveData
  private objectiveText?: Phaser.GameObjects.Text
  private inventoryText?: Phaser.GameObjects.Text

  constructor() {
    super('OverworldScene')
  }

  init(data: OverworldInitData) {
    this.initData = data
  }

  create() {
    this.cameras.main.setBackgroundColor('#08090f')
    this.walls.clear()
    this.saveNoticeShown = false
    this.busy = false

    this.saveData = this.initData.continueGame
      ? SaveSystem.load(0) ?? this.createDefaultSaveData()
      : this.createDefaultSaveData()

    this.applyBattleResult()
    this.createBackdrop()
    this.createMap()
    this.createObjects()

    const startX = this.saveData.position.x
    const startY = this.saveData.position.y
    this.playerOutline = this.add.rectangle(startX, startY, 38, 54, 0x1b1020, 0.45).setDepth(10)
    this.player = this.createPlayer(startX, startY)
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space', Phaser.Input.Keyboard.Key>

    this.createHud()
    this.refreshHud()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerOutline || !this.cursors || !this.keys || this.busy) {
      return
    }

    const seconds = delta / 1000
    let velocityX = 0
    let velocityY = 0

    if (this.cursors.left.isDown || this.keys.a.isDown) {
      velocityX -= PLAYER_SPEED
      this.facing = 'left'
    }
    if (this.cursors.right.isDown || this.keys.d.isDown) {
      velocityX += PLAYER_SPEED
      this.facing = 'right'
    }
    if (this.cursors.up.isDown || this.keys.w.isDown) {
      velocityY -= PLAYER_SPEED
      this.facing = 'up'
    }
    if (this.cursors.down.isDown || this.keys.s.isDown) {
      velocityY += PLAYER_SPEED
      this.facing = 'down'
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2
      velocityY *= Math.SQRT1_2
    }

    this.movePlayer(velocityX * seconds, velocityY * seconds)
    this.playerOutline.setPosition(this.player.x, this.player.y)
    this.checkSavePoint()

    if (Phaser.Input.Keyboard.JustDown(this.keys.enter) || Phaser.Input.Keyboard.JustDown(this.keys.space)) {
      this.interact()
    }
  }

  private createMap() {
    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const isBorder = tileX === 0 || tileY === 0 || tileX === MAP_WIDTH - 1 || tileY === MAP_HEIGHT - 1
        const isInteriorWall =
          (tileY === 6 && tileX >= 4 && tileX <= 8) ||
          (tileY === 10 && tileX >= 2 && tileX <= 5) ||
          (tileX === 13 && tileY >= 2 && tileY <= 5) ||
          (tileX >= 11 && tileX <= 12 && tileY === 11)
        const isBattleGate = tileX === FIELD_BATTLE_TILE.x && tileY === FIELD_BATTLE_TILE.y && !this.flag('field_battle_won')
        const isWall = isBorder || isInteriorWall || isBattleGate

        if (hasTexture(this, GENERATED_ASSETS.tileset)) {
          const frameX = isWall ? 16 : (tileX + tileY) % 5 === 0 ? 32 : 0
          this.add.tileSprite(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, GENERATED_ASSETS.tileset).setOrigin(0).setTilePosition(frameX, 0).setDepth(0)
        } else {
          this.add.rectangle(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, isWall ? 0x0a1a1a : 0x0a2a2a).setOrigin(0).setStrokeStyle(1, 0x123838, 0.35)
        }

        if (isWall) {
          this.walls.add(this.tileKey(tileX, tileY))
        }
      }
    }
  }

  private createBackdrop() {
    if (hasTexture(this, GENERATED_ASSETS.overworldBg)) {
      this.add.image((MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2, GENERATED_ASSETS.overworldBg).setDisplaySize(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE).setDepth(-10)
    }
  }

  private createObjects() {
    const saveX = this.tileCenter(SAVE_TILE.x)
    const saveY = this.tileCenter(SAVE_TILE.y)
    this.add.circle(saveX, saveY, 14, 0x52d9ff, 0.85).setDepth(3)
    this.add.circle(saveX, saveY, 22, 0x52d9ff, 0.18).setDepth(2)
    this.tweens.add({ targets: this.add.circle(saveX, saveY, 26, 0x52d9ff, 0.12).setDepth(1), scale: 1.35, alpha: 0.02, yoyo: true, repeat: -1, duration: 1100 })

    this.drawChest()
    this.drawNpc(GUIDE_TILE, 0x3278d4, 'Guide Rin')
    this.drawNpc(ELDER_TILE, 0xd7a85a, 'Elder')
    this.drawMarker(MARKER_TILE, 0xff8a32, 'Ruin Marker')
    this.drawMarker(SIGNPOST_TILE, 0x8ab4f8, 'Signpost')
    this.drawMarker(FIELD_BATTLE_TILE, this.flag('field_battle_won') ? 0x45e67a : 0xd94747, this.flag('field_battle_won') ? 'Cleared Field' : 'Guardian Field')
  }

  private drawChest() {
    const isOpen = this.saveData.openedChests.includes(CHEST_ID)
    if (hasTexture(this, GENERATED_ASSETS.chest)) {
      this.add.image(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), GENERATED_ASSETS.chest).setScale(1.25).setAlpha(isOpen ? 0.45 : 1).setDepth(4)
      return
    }
    this.add.rectangle(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), 32, 26, isOpen ? 0x403520 : 0x8a5a21).setStrokeStyle(3, 0xf0c040, 0.8).setDepth(4)
  }

  private drawNpc(tile: { x: number; y: number }, color: number, label: string) {
    if (hasTexture(this, GENERATED_ASSETS.npc)) {
      this.add.sprite(this.tileCenter(tile.x), this.tileCenter(tile.y), GENERATED_ASSETS.npc, 0).setTint(color).setDepth(4)
    } else {
      this.add.rectangle(this.tileCenter(tile.x), this.tileCenter(tile.y), 34, 44, color).setStrokeStyle(2, 0xffffff, 0.45).setDepth(4)
    }
    this.add.text(this.tileCenter(tile.x), this.tileCenter(tile.y) - 36, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
  }

  private drawMarker(tile: { x: number; y: number }, color: number, label: string) {
    this.add.rectangle(this.tileCenter(tile.x), this.tileCenter(tile.y), 34, 34, color, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
    this.add.text(this.tileCenter(tile.x), this.tileCenter(tile.y) - 30, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      return this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setDepth(11)
    }
    return this.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  private createHud() {
    const panel = this.add.rectangle(12, 12, 470, 92, 0x08091a, 0.82).setOrigin(0).setScrollFactor(0).setDepth(90)
    panel.setStrokeStyle(1, 0x8ab4f8, 0.45)
    this.objectiveText = this.add.text(28, 24, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: 430 } }).setScrollFactor(0).setDepth(91)
    this.inventoryText = this.add.text(28, 74, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }).setScrollFactor(0).setDepth(91)
  }

  private movePlayer(deltaX: number, deltaY: number) {
    if (!this.player) {
      return
    }
    if (deltaX !== 0) {
      const nextX = Phaser.Math.Clamp(this.player.x + deltaX, this.player.width / 2, MAP_WIDTH * TILE_SIZE - this.player.width / 2)
      if (!this.collidesAt(nextX, this.player.y)) {
        this.player.x = nextX
      }
    }
    if (deltaY !== 0) {
      const nextY = Phaser.Math.Clamp(this.player.y + deltaY, this.player.height / 2, MAP_HEIGHT * TILE_SIZE - this.player.height / 2)
      if (!this.collidesAt(this.player.x, nextY)) {
        this.player.y = nextY
      }
    }
  }

  private collidesAt(x: number, y: number): boolean {
    if (!this.player) {
      return false
    }
    const halfWidth = this.player.width / 2
    const halfHeight = this.player.height / 2
    return [
      { x: x - halfWidth + 3, y: y - halfHeight + 3 },
      { x: x + halfWidth - 3, y: y - halfHeight + 3 },
      { x: x - halfWidth + 3, y: y + halfHeight - 3 },
      { x: x + halfWidth - 3, y: y + halfHeight - 3 },
    ].some((point) => this.isWallAtWorld(point.x, point.y))
  }

  private checkSavePoint() {
    if (!this.player) {
      return
    }
    const tile = this.worldToTile(this.player.x, this.player.y)
    if (tile.x === SAVE_TILE.x && tile.y === SAVE_TILE.y && !this.saveNoticeShown) {
      this.saveNoticeShown = true
      this.persist()
      this.showToast(this.flag('slice_complete') ? 'Progress saved. Luma Quay rests easier.' : 'Progress saved.')
    }
  }

  private interact() {
    const tile = this.getInteractionTile()
    const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.matchesTile(tile, target) || this.matchesTile(playerTile, target)

    if (isAt(CHEST_TILE)) {
      this.openChest()
    } else if (isAt(GUIDE_TILE)) {
      this.talkGuide()
    } else if (isAt(ELDER_TILE)) {
      this.talkElder()
    } else if (isAt(MARKER_TILE)) {
      this.inspectMarker()
    } else if (isAt(SIGNPOST_TILE)) {
      this.showToast('Signpost: Elder north, marker east, skywell west.')
      this.addEvent('read_signpost')
    } else if (isAt(FIELD_BATTLE_TILE)) {
      this.startFieldBattle()
    }
  }

  private openChest() {
    if (this.saveData.openedChests.includes(CHEST_ID)) {
      this.showToast('The supply chest is empty.')
      return
    }
    this.saveData.openedChests.push(CHEST_ID)
    this.addInventory('health_potion', 2)
    this.addInventory('mana_potion', 1)
    this.showToast('Supply chest: Potion x2, Ether x1')
    this.persist()
    this.refreshHud()
  }

  private talkGuide() {
    if (!this.flag('elder_intro')) {
      this.showToast('Guide Rin: Elder Maelin can explain the emberglass tremor.')
      return
    }
    if (!this.flag('field_marker_seen')) {
      this.showToast('Guide Rin: The marker is east. Read it before crossing.')
      return
    }
    if (!this.flag('field_battle_won')) {
      this.showToast('Guide Rin: Strike ember weaknesses and keep potions ready.')
      return
    }
    this.showToast('Guide Rin: You brought the quay back to a calm glow.')
  }

  private talkElder() {
    if (!this.flag('elder_intro')) {
      this.setFlag('elder_intro')
      this.setObjective(OBJECTIVES.inspectMarker)
      this.showToast('Elder Maelin: Inspect the eastern marker; the field will answer.')
    } else if (!this.flag('field_marker_seen')) {
      this.showToast('Elder Maelin: The marker holds the route. Return after reading it.')
    } else if (!this.flag('field_battle_won')) {
      this.setObjective(OBJECTIVES.winBattle)
      this.showToast('Elder Maelin: Face the guardian past the marker.')
    } else if (!this.flag('slice_complete')) {
      this.setFlag('elder_rewarded')
      this.setFlag('slice_complete')
      this.addInventory('ember_shard', 1)
      this.setObjective(OBJECTIVES.complete)
      this.showToast('Elder Maelin: Take this ember shard. Save your progress.')
    } else {
      this.showToast('Elder Maelin: Luma Quay remembers your help.')
    }
    this.persist()
    this.refreshHud()
  }

  private inspectMarker() {
    if (!this.flag('elder_intro')) {
      this.showToast('The marker hums, but you need the elder\'s guidance first.')
      return
    }
    if (!this.flag('field_marker_seen')) {
      this.setFlag('field_marker_seen')
      this.setObjective(OBJECTIVES.winBattle)
      this.showToast('Marker: Guardian wake confirmed. Step southeast to challenge it.')
    } else if (!this.flag('field_battle_won')) {
      this.showToast('Marker: The guardian waits in the red-lit field southeast.')
    } else {
      this.showToast('Marker: The path is calm. Report back to Elder Maelin.')
    }
    this.persist()
    this.refreshHud()
  }

  private startFieldBattle() {
    if (!this.flag('field_marker_seen')) {
      this.showToast('A red ward blocks the field. Inspect the marker first.')
      return
    }
    if (this.flag('field_battle_won')) {
      this.showToast('The cleared field glows softly.')
      return
    }
    this.busy = true
    this.saveCurrentPosition()
    this.persist()
    this.cameras.main.fadeOut(300, 0, 0, 0)
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('BattleScene', {
        battleId: FIELD_BATTLE_ID,
        enemyIds: ['vinecrawler', 'moss_knight'],
        isBoss: false,
      })
    })
  }

  private applyBattleResult() {
    const result = this.initData.battleResult
    if (!result?.victory) {
      return
    }
    const rewards = result.rewards ?? { exp: 0, gold: 0, emberShards: 0, items: [] }
    this.saveData.gold += rewards.gold
    this.saveData.battleRewards.exp += rewards.exp
    this.saveData.battleRewards.gold += rewards.gold
    this.saveData.battleRewards.emberShards += rewards.emberShards
    rewards.items.forEach((item) => this.addInventory(item.itemId, item.quantity))
    if (rewards.emberShards > 0) {
      this.addInventory('ember_shard', rewards.emberShards)
    }
    if (result.battleId === FIELD_BATTLE_ID) {
      this.setFlag('field_battle_won')
      this.setObjective(OBJECTIVES.returnToElder)
    }
    this.persist()
    this.time.delayedCall(250, () => {
      this.showToast(`Rewards: ${rewards.gold}g, Ember Shard x${rewards.emberShards}, Potion x1`)
      this.refreshHud()
    })
  }

  private showToast(message: string) {
    const { width } = this.scale
    const text = this.add.text(width / 2, 126, message, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px', backgroundColor: '#0a0a2e', padding: { x: 14, y: 8 }, wordWrap: { width: 720 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    this.tweens.add({ targets: text, y: 104, alpha: 0, delay: 1900, duration: 450, onComplete: () => text.destroy() })
  }

  private createDefaultSaveData(): SaveData {
    return {
      version: SaveSystem.SAVE_VERSION,
      timestamp: Date.now(),
      slot: 0,
      party: [
        { characterId: 'nara', level: 3, currentHp: 104, currentMp: 44, equipment: { weapon: null, charm: null, relic: null }, skills: ['emberglass_strike', 'skywell_spark'] },
        { characterId: 'kael', level: 3, currentHp: 128, currentMp: 28, equipment: { weapon: null, charm: null, relic: null }, skills: ['iron_cleave', 'guard_break'] },
        { characterId: 'io', level: 3, currentHp: 88, currentMp: 58, equipment: { weapon: null, charm: null, relic: null }, skills: ['lumen_bolt', 'mend'] },
      ],
      inventory: [{ itemId: 'health_potion', quantity: 3 }, { itemId: 'mana_potion', quantity: 1 }, { itemId: 'ember_shard', quantity: 0 }],
      gold: 0,
      openedChests: [],
      completedEvents: [],
      currentObjective: OBJECTIVES.talkToElder,
      battleRewards: { exp: 0, gold: 0, emberShards: 0 },
      position: { mapId: 'Luma Quay', x: TILE_SIZE * 2.5, y: TILE_SIZE * 2.5 },
      quests: {},
      flags: {},
      playTime: 0,
    }
  }

  private persist() {
    this.saveCurrentPosition()
    SaveSystem.autoSave(this.saveData)
  }

  private saveCurrentPosition() {
    if (this.player) {
      this.saveData.position = { mapId: 'Luma Quay', x: this.player.x, y: this.player.y }
    }
  }

  private setObjective(objective: string) {
    this.saveData.currentObjective = objective
  }

  private setFlag(flag: string) {
    this.saveData.flags[flag] = true
    this.addEvent(flag)
  }

  private flag(flag: string): boolean {
    return Boolean(this.saveData.flags[flag])
  }

  private addEvent(eventId: string) {
    if (!this.saveData.completedEvents.includes(eventId)) {
      this.saveData.completedEvents.push(eventId)
    }
  }

  private addInventory(itemId: string, quantity: number) {
    const item = this.saveData.inventory.find((entry) => entry.itemId === itemId)
    if (item) {
      item.quantity += quantity
    } else {
      this.saveData.inventory.push({ itemId, quantity })
    }
  }

  private getInventoryCounts(): InventoryCounts {
    return {
      potion: this.saveData.inventory.find((item) => item.itemId === 'health_potion')?.quantity ?? 0,
      ether: this.saveData.inventory.find((item) => item.itemId === 'mana_potion')?.quantity ?? 0,
      emberShard: this.saveData.inventory.find((item) => item.itemId === 'ember_shard')?.quantity ?? 0,
    }
  }

  private refreshHud() {
    const counts = this.getInventoryCounts()
    this.objectiveText?.setText(`Objective: ${this.saveData.currentObjective}`)
    this.inventoryText?.setText(`Gold ${this.saveData.gold}  |  Potion ${counts.potion}  Ether ${counts.ether}  Ember Shard ${counts.emberShard}`)
  }

  private getInteractionTile() {
    if (!this.player) {
      return null
    }
    const tile = this.worldToTile(this.player.x, this.player.y)
    if (this.facing === 'left') {
      tile.x -= 1
    } else if (this.facing === 'right') {
      tile.x += 1
    } else if (this.facing === 'up') {
      tile.y -= 1
    } else {
      tile.y += 1
    }
    return tile
  }

  private matchesTile(tile: { x: number; y: number } | null, target: { x: number; y: number }): boolean {
    return tile?.x === target.x && tile.y === target.y
  }

  private isWallAtWorld(x: number, y: number): boolean {
    const tile = this.worldToTile(x, y)
    return this.walls.has(this.tileKey(tile.x, tile.y))
  }

  private worldToTile(x: number, y: number) {
    return { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) }
  }

  private tileCenter(tile: number): number {
    return tile * TILE_SIZE + TILE_SIZE / 2
  }

  private tileKey(x: number, y: number): string {
    return `${x},${y}`
  }
}
