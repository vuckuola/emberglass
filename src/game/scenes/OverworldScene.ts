import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { CHARACTERS } from '../data/characters'
import { ITEMS_BY_ID } from '../data/items'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'

const TILE_SIZE = 48
const MAP_WIDTH = 20
const MAP_HEIGHT = 15
const PLAYER_SPEED = 160
const SAVE_TILE = { x: 5, y: 5 }
const CHEST_TILE = { x: 15, y: 8 }
const GUIDE_TILE = { x: 8, y: 3 }
const ELDER_TILE = { x: 10, y: 3 }
const MERCHANT_TILE = { x: 6, y: 9 }
const MARKER_TILE = { x: 16, y: 11 }
const SIGNPOST_TILE = { x: 3, y: 11 }
const TIDE_BELL_TILE = { x: 2, y: 7 }
const MURAL_TILE = { x: 12, y: 5 }
const WATCH_LANTERN_TILE = { x: 14, y: 9 }
const SHRINE_GATE_TILE = { x: 18, y: 6 }
const FIELD_BATTLE_TILE = { x: 17, y: 12 }
const FIELD_BATTLE_ID = 'field_marker_battle'
const CHEST_ID = 'quay_supply_chest'

const OBJECTIVES = {
  talkToElder: 'Speak with Elder Maelin at Luma Quay.',
  inspectMarker: 'Inspect the ruin marker in the eastern field.',
  winBattle: 'Defeat the field guardian beyond the marker.',
  returnToElder: 'Return to Elder Maelin with the ember shard.',
  visitShrineGate: 'Follow the opened east path to the Moonwake Shrine gate.',
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
type MenuOverlay = { container: Phaser.GameObjects.Container }

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private player?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  private playerOutline?: Phaser.GameObjects.Rectangle
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space' | 'm' | 'escape', Phaser.Input.Keyboard.Key>
  private walls = new Set<string>()
  private facing: Direction = 'down'
  private saveNoticeShown = false
  private busy = false
  private initData: OverworldInitData = {}
  private saveData!: SaveData
  private objectiveText?: Phaser.GameObjects.Text
  private inventoryText?: Phaser.GameObjects.Text
  private promptText?: Phaser.GameObjects.Text
  private areaText?: Phaser.GameObjects.Text
  private menuOverlay?: MenuOverlay

  constructor() {
    super('OverworldScene')
  }

  init(data: OverworldInitData) {
    this.initData = data
  }

  create() {
    this.cameras.main.setBackgroundColor('#08090f')
    audioManager.playMusic('town')
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
      m: Phaser.Input.Keyboard.KeyCodes.M,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space' | 'm' | 'escape', Phaser.Input.Keyboard.Key>

    this.createHud()
    this.refreshHud()
    this.showAreaBanner('Luma Quay', 'A harbor village holding its breath beneath emberlit glass.')
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerOutline || !this.cursors || !this.keys) {
      return
    }

    if (this.menuOverlay) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.m)) {
        this.closeMenu()
      }
      return
    }

    if (this.busy) {
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
    this.updateInteractionPrompt()

    if (Phaser.Input.Keyboard.JustDown(this.keys.m) || Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.openMenu()
      return
    }

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
        const isShrineGate = tileX === SHRINE_GATE_TILE.x && tileY === SHRINE_GATE_TILE.y && !this.flag('shrine_gate_seen')
        const isWall = isBorder || isInteriorWall || isBattleGate
        const blocksTravel = isWall && !isShrineGate

        if (hasTexture(this, GENERATED_ASSETS.tileset)) {
          const frameX = blocksTravel ? 16 : (tileX + tileY) % 5 === 0 ? 32 : 0
          this.add.tileSprite(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, GENERATED_ASSETS.tileset).setOrigin(0).setTilePosition(frameX, 0).setDepth(0)
        } else {
          this.add.rectangle(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, blocksTravel ? 0x0a1a1a : 0x0a2a2a).setOrigin(0).setStrokeStyle(1, 0x123838, 0.35)
        }

        if (blocksTravel) {
          this.walls.add(this.tileKey(tileX, tileY))
        }
      }
    }
  }

  private createBackdrop() {
    if (hasTexture(this, GENERATED_ASSETS.overworldBg)) {
      this.add.image((MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2, GENERATED_ASSETS.overworldBg).setDisplaySize(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE).setDepth(-10)
    }
    for (let index = 0; index < 22; index += 1) {
      const mote = this.add.circle(Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48), Phaser.Math.Between(64, MAP_HEIGHT * TILE_SIZE - 64), Phaser.Math.Between(1, 3), 0x9ff3ff, 0.16).setDepth(-2)
      this.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-22, 22), y: mote.y - Phaser.Math.Between(14, 42), alpha: 0.04, yoyo: true, repeat: -1, duration: Phaser.Math.Between(2800, 5200), ease: 'Sine.easeInOut' })
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
    this.drawNpc(MERCHANT_TILE, 0x45c987, 'Peddler')
    this.drawMarker(MARKER_TILE, 0xff8a32, 'Ruin Marker')
    this.drawMarker(SIGNPOST_TILE, 0x8ab4f8, 'Signpost')
    this.drawMarker(TIDE_BELL_TILE, 0x75d6ff, 'Tide Bell')
    this.drawMarker(MURAL_TILE, 0xc88dff, 'Glass Mural')
    this.drawMarker(WATCH_LANTERN_TILE, 0xffd36e, 'Watch Lantern')
    this.drawMarker(SHRINE_GATE_TILE, this.flag('slice_complete') ? 0x9ff36e : 0x5d536d, 'Shrine Gate')
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
    const npc = hasTexture(this, GENERATED_ASSETS.npc)
      ? this.add.sprite(this.tileCenter(tile.x), this.tileCenter(tile.y), GENERATED_ASSETS.npc, 0).setTint(color).setDepth(4)
      : this.add.rectangle(this.tileCenter(tile.x), this.tileCenter(tile.y), 34, 44, color).setStrokeStyle(2, 0xffffff, 0.45).setDepth(4)
    this.tweens.add({ targets: npc, y: npc.y - 3, yoyo: true, repeat: -1, duration: 1400 + tile.x * 45, ease: 'Sine.easeInOut' })
    this.add.text(this.tileCenter(tile.x), this.tileCenter(tile.y) - 36, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
  }

  private drawMarker(tile: { x: number; y: number }, color: number, label: string) {
    const marker = this.add.rectangle(this.tileCenter(tile.x), this.tileCenter(tile.y), 34, 34, color, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
    this.tweens.add({ targets: marker, angle: 2, scale: 1.06, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })
    this.add.text(this.tileCenter(tile.x), this.tileCenter(tile.y) - 30, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(0.5).setDepth(5)
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      return this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setDepth(11)
    }
    return this.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  private createHud() {
    const panel = this.add.rectangle(12, 12, 520, 104, 0x08091a, 0.84).setOrigin(0).setScrollFactor(0).setDepth(90)
    panel.setStrokeStyle(1, 0x8ab4f8, 0.45)
    this.objectiveText = this.add.text(28, 24, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: 480 } }).setScrollFactor(0).setDepth(91)
    this.inventoryText = this.add.text(28, 78, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }).setScrollFactor(0).setDepth(91)
    this.areaText = this.add.text(this.scale.width - 24, 24, 'Luma Quay', { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '18px', backgroundColor: '#08091acc', padding: { x: 10, y: 6 } }).setOrigin(1, 0).setScrollFactor(0).setDepth(91)
    this.promptText = this.add.text(this.scale.width / 2, this.scale.height - 32, 'Move WASD/Arrows • Interact Enter/Space • Menu M/Esc', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', backgroundColor: '#08091acc', padding: { x: 12, y: 7 } }).setOrigin(0.5).setScrollFactor(0).setDepth(95)
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
      audioManager.playSfx('save_point')
      this.cameras.main.flash(180, 159, 243, 255, false)
      this.showToast(this.flag('slice_complete') ? 'Progress saved. Luma Quay rests easier.' : 'Progress saved.')
    }
  }

  private interact() {
    audioManager.playSfx('field_interact')
    const tile = this.getInteractionTile()
    const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.matchesTile(tile, target) || this.matchesTile(playerTile, target)

    if (isAt(CHEST_TILE)) {
      this.openChest()
    } else if (isAt(GUIDE_TILE)) {
      this.talkGuide()
    } else if (isAt(ELDER_TILE)) {
      this.talkElder()
    } else if (isAt(MERCHANT_TILE)) {
      this.openShop()
    } else if (isAt(MARKER_TILE)) {
      this.inspectMarker()
    } else if (isAt(SIGNPOST_TILE)) {
      this.showToast(this.flag('slice_complete') ? 'Signpost: Moonwake Shrine east. Luma Quay west. Home behind you.' : 'Signpost: Elder north, marker east, skywell west. Fresh paint hides old scorch marks.')
      this.addEvent('read_signpost')
    } else if (isAt(TIDE_BELL_TILE)) {
      this.ringTideBell()
    } else if (isAt(MURAL_TILE)) {
      this.inspectMural()
    } else if (isAt(WATCH_LANTERN_TILE)) {
      this.lightWatchLantern()
    } else if (isAt(SHRINE_GATE_TILE)) {
      this.inspectShrineGate()
    } else if (isAt(FIELD_BATTLE_TILE)) {
      this.startFieldBattle()
    }
  }

  private openChest() {
    if (this.saveData.openedChests.includes(CHEST_ID)) {
      audioManager.playSfx('ui_cancel')
      this.showToast('The supply chest is empty.')
      return
    }
    this.saveData.openedChests.push(CHEST_ID)
    this.addInventory('health_potion', 2)
    this.addInventory('mana_potion', 1)
    this.addInventory('wind_charm', 1)
    this.saveData.party[0].equipment.charm = 'wind_charm'
    audioManager.playSfx('chest_open')
    this.time.delayedCall(230, () => audioManager.playSfx('equipment_gain'))
    this.showToast('Supply chest: Potion x2, Ether x1, Wind Charm equipped to Nara')
    this.persist()
    this.refreshHud()
  }

  private talkGuide() {
    if (!this.flag('elder_intro')) {
      this.showToast('Guide Rin: Hear that glass-singing? The quay only does that before storms—or prophecies.')
      return
    }
    if (!this.flag('field_marker_seen')) {
      this.showToast('Guide Rin: Check the old marker east. I tied blue cord around the safe stones.')
      return
    }
    if (!this.flag('field_battle_won')) {
      this.showToast('Guide Rin: The guardian hates emberlight. Keep Io standing and do not hoard potions.')
      return
    }
    this.showToast(this.flag('shrine_gate_seen') ? 'Guide Rin: Moonwake Shrine was sealed when I was little. If it opened for you, go carefully.' : 'Guide Rin: You brought the quay back to a calm glow. Ask Maelin what the east gate means.')
  }

  private talkElder() {
    if (!this.flag('elder_intro')) {
      this.setFlag('elder_intro')
      this.setObjective(OBJECTIVES.inspectMarker)
      audioManager.playSfx('objective_update')
      this.showToast('Elder Maelin: Inspect the eastern marker; the field will answer.')
    } else if (!this.flag('field_marker_seen')) {
      this.showToast('Elder Maelin: The marker holds the route. Return after reading it.')
    } else if (!this.flag('field_battle_won')) {
      this.setObjective(OBJECTIVES.winBattle)
      audioManager.playSfx('objective_update')
      this.showToast('Elder Maelin: Face the guardian past the marker.')
    } else if (!this.flag('slice_complete')) {
      this.setFlag('elder_rewarded')
      this.setFlag('slice_complete')
      this.addInventory('ember_shard', 1)
      this.addInventory('warding_ember', 1)
      this.saveData.party[2].equipment.relic = 'warding_ember'
      this.setObjective(OBJECTIVES.visitShrineGate)
      audioManager.playSfx('equipment_gain')
      this.time.delayedCall(260, () => audioManager.playResonancePulse('event'))
      this.showEventBanner('Moonwake Route Opened', 'A green seam of light unlocks the old shrine gate east of the field.')
      this.showToast('Elder Maelin: Take the Warding Ember. Io equips it. Then follow the gate that woke for you.')
    } else {
      this.showToast(this.flag('shrine_gate_seen') ? 'Elder Maelin: Beyond Moonwake lies the first true answer. Tonight, Luma Quay will keep your names.' : 'Elder Maelin: The shrine gate is awake. Let it see the ember you carry.')
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
      audioManager.playSfx('objective_update')
      this.showToast('Marker: Guardian wake confirmed. Step southeast to challenge it.')
    } else if (!this.flag('field_battle_won')) {
      this.showToast('Marker: The guardian waits in the red-lit field southeast.')
    } else {
      this.showToast(this.flag('slice_complete') ? 'Marker: Guardian vow fulfilled. Moonwake Shrine accepts passage east.' : 'Marker: The path is calm. Report back to Elder Maelin.')
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
    audioManager.playSfx('shrine_beat')
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
      audioManager.playResonancePulse('objective')
    }
    this.persist()
    this.time.delayedCall(250, () => {
      this.showEventBanner('Guardian Felled', 'The field exhales. Far east, a shrine bell answers once.')
      audioManager.playSfx('reward_gain')
      this.showToast(`Rewards secured: ${rewards.gold}g, Ember Shard x${rewards.emberShards}, Potion x1`)
      this.refreshHud()
    })
  }

  private ringTideBell() {
    if (!this.flag('tide_bell_rung')) {
      this.setFlag('tide_bell_rung')
      audioManager.playTideBell(1)
      this.showToast('The tide bell rings without echo. Fisher charms flicker awake along the quay.')
    } else {
      audioManager.playTideBell(this.flag('field_battle_won') ? 3 : 2)
      this.showToast(this.flag('field_battle_won') ? 'The bell tone is clear now, no longer warped by the guardian field.' : 'The bell answers with a nervous blue shimmer.')
    }
    this.persist()
  }

  private inspectMural() {
    this.addEvent('glass_mural_seen')
    const message = this.flag('slice_complete')
      ? 'Mural: Three pilgrims carry emberglass toward a crescent gate—the last figure now glows like Nara.'
      : 'Mural: A cracked mosaic shows Luma Quay before the fall, every roof bright with bottled starlight.'
    this.showToast(message)
    this.persist()
  }

  private lightWatchLantern() {
    if (!this.flag('watch_lantern_lit')) {
      this.setFlag('watch_lantern_lit')
      this.addInventory('health_potion', 1)
      audioManager.playSfx('item_use')
      this.showToast('Watch Lantern: You trim the wick. A hidden keeper cache yields Potion x1.')
      this.refreshHud()
    } else {
      this.showToast('The watch lantern burns steady, painting the grass in warm gold.')
    }
    this.persist()
  }

  private inspectShrineGate() {
    if (!this.flag('slice_complete')) {
      this.showToast('Moonwake Gate: Moon-silver roots lock the path. The elder may know the vow.')
      return
    }
    if (!this.flag('shrine_gate_seen')) {
      this.setFlag('shrine_gate_seen')
      this.setObjective(OBJECTIVES.complete)
      audioManager.playResonancePulse('event')
      this.showAreaBanner('Moonwake Shrine Approach', 'Beyond the gate, old glass ruins breathe with patient light.')
      this.showEventBanner('To Be Continued', 'The route forward is clear: Moonwake Shrine waits past Luma Quay.')
    } else {
      this.showToast('Moonwake Gate: The way ahead is open, bright, and much older than the village.')
    }
    this.persist()
    this.refreshHud()
  }

  private showToast(message: string) {
    const { width } = this.scale
    const text = this.add.text(width / 2, 126, message, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px', backgroundColor: '#0a0a2e', padding: { x: 14, y: 8 }, wordWrap: { width: 720 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100)
    this.tweens.add({ targets: text, y: 104, alpha: 0, delay: 1900, duration: 450, onComplete: () => text.destroy() })
  }

  private showAreaBanner(title: string, subtitle: string) {
    this.areaText?.setText(title)
    const { width } = this.scale
    const panel = this.add.rectangle(width / 2, 84, 580, 84, 0x071023, 0.88).setScrollFactor(0).setDepth(120).setStrokeStyle(1, 0x9ff3ff, 0.5)
    const heading = this.add.text(width / 2, 62, title, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '26px' }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    const body = this.add.text(width / 2, 92, subtitle, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: 520 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    this.tweens.add({ targets: [panel, heading, body], alpha: 0, delay: 2300, duration: 600, onComplete: () => { panel.destroy(); heading.destroy(); body.destroy() } })
  }

  private showEventBanner(title: string, subtitle: string) {
    const { width, height } = this.scale
    const panel = this.add.rectangle(width / 2, height / 2 - 140, 660, 92, 0x1b1020, 0.92).setScrollFactor(0).setDepth(130).setStrokeStyle(2, 0xffd36e, 0.72)
    const heading = this.add.text(width / 2, height / 2 - 162, title, { color: '#ffd36e', fontFamily: 'Arial, sans-serif', fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const body = this.add.text(width / 2, height / 2 - 130, subtitle, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: 600 } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    this.tweens.add({ targets: [panel, heading, body], y: '-=10', alpha: 0, delay: 2600, duration: 520, onComplete: () => { panel.destroy(); heading.destroy(); body.destroy() } })
    this.cameras.main.flash(180, 255, 211, 110, false)
  }

  private openShop() {
    const counts = this.getInventoryCounts()
    if (counts.emberShard > 0) {
      this.addInventory('ember_shard', -1)
      this.addInventory('mana_potion', 1)
      this.saveData.gold += 15
      audioManager.playSfx('merchant_trade')
      this.showToast('Peddler: Ember Shard traded for Ether x1 and 15g.')
    } else if (this.saveData.gold >= 25) {
      this.saveData.gold -= 25
      this.addInventory('health_potion', 1)
      audioManager.playSfx('merchant_trade')
      this.showToast('Peddler: Potion purchased for 25g.')
    } else {
      audioManager.playSfx('ui_cancel')
      this.showToast('Peddler: Bring 25g for potions, or an Ember Shard for ether.')
    }
    this.persist()
    this.refreshHud()
  }

  private openMenu() {
    if (this.menuOverlay) {
      return
    }

    this.busy = true
    audioManager.playSfx('ui_menu_open')
    const { width, height } = this.scale
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(200)
    const counts = this.getInventoryCounts()
    const relicLines = this.saveData.party
      .map((member) => {
        const character = CHARACTERS[member.characterId]
        const equipped = [member.equipment.weapon, member.equipment.charm, member.equipment.relic]
          .filter(Boolean)
          .map((itemId) => ITEMS_BY_ID[itemId ?? '']?.name)
          .filter(Boolean)
        return `${character?.name ?? member.characterId} Lv ${member.level}  HP ${member.currentHp}  MP ${member.currentMp}\n  ${equipped.length ? equipped.join(' • ') : 'No relics equipped'}`
      })
      .join('\n')

    const inventoryLines = [
      `Potion x${counts.potion}`,
      `Ether x${counts.ether}`,
      `Ember Shard x${counts.emberShard}`,
      ...this.saveData.inventory
        .filter((entry) => ['wind_charm', 'warding_ember', 'skywell_shard', 'glass_lens'].includes(entry.itemId))
        .map((entry) => `${ITEMS_BY_ID[entry.itemId]?.name ?? entry.itemId} x${entry.quantity}`),
    ]

    container.add(this.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.72))
    const panel = this.add.rectangle(width / 2, height / 2, 700, 500, 0x0b1028, 0.97).setStrokeStyle(2, 0x8ab4f8, 0.7)
    container.add(panel)
    container.add(this.add.text(width / 2 - 310, height / 2 - 220, 'Emberglass Menu', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '28px' }))
    container.add(this.add.text(width / 2 + 170, height / 2 - 216, `${this.saveData.gold}g`, { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '24px' }))
    container.add(this.add.text(width / 2 - 310, height / 2 - 168, `Objective\n${this.saveData.currentObjective}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: 610 } }))
    container.add(this.add.text(width / 2 - 310, height / 2 - 86, `Status / Equipment\n${relicLines}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 5 }))
    container.add(this.add.text(width / 2 + 64, height / 2 - 86, `Inventory\n${inventoryLines.join('\n')}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 7 }))
    container.add(this.add.text(width / 2 - 310, height / 2 + 184, 'Controls: Move WASD/Arrows • Interact Enter/Space • Menu M/Esc • Shop trades shards first, then sells potions.', { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: 620 } }))
    this.menuOverlay = { container }
  }

  private closeMenu() {
    this.menuOverlay?.container.destroy()
    this.menuOverlay = undefined
    this.busy = false
    audioManager.playSfx('ui_cancel')
  }

  private updateInteractionPrompt() {
    const tile = this.getInteractionTile()
    const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.matchesTile(tile, target) || this.matchesTile(playerTile, target)
    const prompt = isAt(CHEST_TILE)
      ? 'Open supply chest'
      : isAt(GUIDE_TILE)
        ? 'Talk to Guide Rin'
        : isAt(ELDER_TILE)
          ? 'Talk to Elder Maelin'
          : isAt(MERCHANT_TILE)
            ? 'Trade with quay peddler'
            : isAt(MARKER_TILE)
              ? 'Inspect ruin marker'
              : isAt(SIGNPOST_TILE)
                ? 'Read signpost'
                : isAt(TIDE_BELL_TILE)
                  ? 'Ring tide bell'
                  : isAt(MURAL_TILE)
                    ? 'Study glass mural'
                    : isAt(WATCH_LANTERN_TILE)
                      ? 'Tend watch lantern'
                      : isAt(SHRINE_GATE_TILE)
                        ? 'Inspect shrine gate'
                        : isAt(FIELD_BATTLE_TILE)
                          ? 'Enter guardian field'
                          : 'Move WASD/Arrows • Interact Enter/Space • Menu M/Esc'
    this.promptText?.setText(prompt.startsWith('Move') ? prompt : `${prompt}  [Enter]`)
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
      gold: 60,
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
