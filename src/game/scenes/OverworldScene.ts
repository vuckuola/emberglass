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
const MAP_LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWW',
  'WGGGPPPPPGGGGGPPPGGW',
  'WFGGPPPPPGGGGBPPPGGW',
  'WFGGPPPPPGPGBBPPGGGW',
  'WGGGPPPPPGGGBBPPGGGW',
  'WGGGGPGGGGGGGGPGGGGW',
  'WWWWBBBBBGGGGGGPGGPW',
  'WGGGGGGGGGGGGGGGGGPW',
  'WFFGGGGGGGGGGGGPPGPW',
  'WGGGGGPGGGGGGGGBPGPW',
  'WGGGGGPGGPPGGGGBBGPW',
  'WGGGGGPGGPPGGGGGPGPW',
  'WGGGGFGGGPPGGGGGFGPW',
  'WGGGGGGGGPPGGGGGGGGW',
  'WWWWWWWWWWWWWWWWWWWW',
] as const
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
const SHRINE_FONT_TILE = { x: 18, y: 8 }
const SHRINE_SEAL_TILE = { x: 18, y: 10 }
const FIELD_BATTLE_TILE = { x: 17, y: 12 }
const FIELD_BATTLE_ID = 'field_marker_battle'
const SHRINE_BOSS_BATTLE_ID = 'moonwake_guardian_battle'
const CHEST_ID = 'quay_supply_chest'

const OBJECTIVES = {
  talkToElder: 'Speak with Elder Maelin at Luma Quay.',
  inspectMarker: 'Inspect the ruin marker in the eastern field.',
  winBattle: 'Defeat the field guardian beyond the marker.',
  returnToElder: 'Return to Elder Maelin with the ember shard.',
  visitShrineGate: 'Follow the opened east path to the Moonwake Shrine gate.',
  attuneShrineFont: 'Enter Moonwake Shrine and attune the pilgrim font.',
  faceShrineGuardian: 'Break the inner seal and face the Moonwake Guardian.',
  complete: 'Save at the skywell. Moonwake Shrine has answered.',
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
  private playerShadow?: Phaser.GameObjects.Ellipse
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
  private toast?: Phaser.GameObjects.Text
  private touchMove: { x: number; y: number } | null = null
  private touchButtons: Phaser.GameObjects.GameObject[] = []
  private activeBanners: Phaser.GameObjects.GameObject[] = []

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
    this.toast = undefined
    this.touchMove = null
    this.touchButtons = []
    this.activeBanners = []
    this.objectiveText = undefined
    this.inventoryText = undefined
    this.promptText = undefined
    this.areaText = undefined
    this.menuOverlay = undefined

    const continuedSave = this.initData.continueGame ? SaveSystem.load(0) : null
    this.saveData = continuedSave ?? this.createDefaultSaveData()

    this.applyBattleResult()
    this.createBackdrop()
    this.createAmbientParticles()
    this.createMap()
    this.createObjects()

    const startX = this.saveData.position.x
    const startY = this.saveData.position.y
    this.playerShadow = this.add.ellipse(startX, startY + 18, 34, 14, 0x101014, 0.32).setDepth(10)
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
    this.createTouchControls()
    this.refreshHud()
    this.cameras.main.fadeIn(420, 5, 6, 18)
    this.showAreaBanner('Luma Quay', 'A harbor village holding its breath beneath emberlit glass.')
    if (!continuedSave && !this.initData.continueGame) {
      this.time.delayedCall(850, () => this.showFirstSessionGuide())
    }
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerShadow || !this.cursors || !this.keys) {
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

    if (this.cursors.left.isDown || this.keys.a.isDown || (this.touchMove?.x ?? 0) < 0) {
      velocityX -= PLAYER_SPEED
      this.facing = 'left'
    }
    if (this.cursors.right.isDown || this.keys.d.isDown || (this.touchMove?.x ?? 0) > 0) {
      velocityX += PLAYER_SPEED
      this.facing = 'right'
    }
    if (this.cursors.up.isDown || this.keys.w.isDown || (this.touchMove?.y ?? 0) < 0) {
      velocityY -= PLAYER_SPEED
      this.facing = 'up'
    }
    if (this.cursors.down.isDown || this.keys.s.isDown || (this.touchMove?.y ?? 0) > 0) {
      velocityY += PLAYER_SPEED
      this.facing = 'down'
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2
      velocityY *= Math.SQRT1_2
    }

    this.movePlayer(velocityX * seconds, velocityY * seconds)
    this.playerShadow.setPosition(this.player.x, this.player.y + 18)
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
    const grassColors = [0x3d8b37, 0x4a9944, 0x368232, 0x45913f]
    const flowerColors = [0xffd166, 0xff7aa2, 0xc7f9ff]
    const pathColor = 0xc4a882
    const pathAccent = 0xad8f66
    const wallColor = 0x5a4a3a
    const wallTopColor = 0x7a6a5a
    const wallShadeColor = 0x3f3329
    const waterColors = [0x357ec7, 0x3d96db, 0x2f6fb2]

    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const layoutTile = MAP_LAYOUT[tileY][tileX]
        const isBattleGate = tileX === FIELD_BATTLE_TILE.x && tileY === FIELD_BATTLE_TILE.y && !this.flag('field_battle_won')
        const isShrineGate = tileX === SHRINE_GATE_TILE.x && tileY === SHRINE_GATE_TILE.y && !this.flag('shrine_gate_seen')
        const isWall = layoutTile === 'W' || layoutTile === 'B' || isBattleGate
        const blocksTravel = isWall && !isShrineGate
        const x = tileX * TILE_SIZE
        const y = tileY * TILE_SIZE

        if (layoutTile === 'P') {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, pathColor).setOrigin(0).setDepth(0)
          if ((tileX * 5 + tileY * 11) % 4 === 0) {
            this.add.rectangle(x + 8, y + 18, 7, 3, pathAccent, 0.22).setOrigin(0).setDepth(0.1)
          }
        } else if (layoutTile === '.') {
          const waterColor = waterColors[(tileX * 3 + tileY * 7) % waterColors.length]
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, waterColor).setOrigin(0).setDepth(0)
          this.add.rectangle(x + 4, y + 14, TILE_SIZE - 8, 3, 0x9bdcff, 0.18).setOrigin(0).setDepth(0.1)
        } else if (isWall) {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, layoutTile === 'B' ? 0x6b5140 : wallColor).setOrigin(0).setDepth(1)
          this.add.rectangle(x, y, TILE_SIZE, 12, layoutTile === 'B' ? 0x92705a : wallTopColor).setOrigin(0).setDepth(1.1)
          this.add.rectangle(x, y + TILE_SIZE - 10, TILE_SIZE, 10, wallShadeColor, 0.5).setOrigin(0).setDepth(1.1)
          this.add.rectangle(x + 4, y + 12, TILE_SIZE - 8, 2, 0xffffff, 0.08).setOrigin(0).setDepth(1.2)
        } else {
          const grassColor = grassColors[(tileX * 7 + tileY * 13) % grassColors.length]
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, grassColor).setOrigin(0).setDepth(0)
          if ((tileX + tileY) % 3 === 0) {
            this.add.rectangle(x + 9, y + 11, 12, 3, 0x2d722d, 0.18).setOrigin(0).setDepth(0.1)
          }
          if (layoutTile === 'F') {
            for (let index = 0; index < 3; index += 1) {
              const flowerX = x + 12 + ((tileX * 9 + tileY * 5 + index * 11) % 25)
              const flowerY = y + 12 + ((tileX * 4 + tileY * 8 + index * 7) % 23)
              this.add.circle(flowerX, flowerY, 2, flowerColors[index], 0.9).setDepth(0.2)
            }
          }
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
    for (let index = 0; index < 12; index += 1) {
      const mote = this.add.circle(Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48), Phaser.Math.Between(64, MAP_HEIGHT * TILE_SIZE - 64), Phaser.Math.Between(1, 2), 0x9ff3ff, 0.06).setDepth(-2)
      this.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-14, 14), y: mote.y - Phaser.Math.Between(8, 24), alpha: 0.02, yoyo: true, repeat: -1, duration: Phaser.Math.Between(3200, 5800), ease: 'Sine.easeInOut' })
    }
  }

  private createAmbientParticles() {
    const saveCenterX = SAVE_TILE.x * TILE_SIZE + TILE_SIZE / 2
    const saveCenterY = SAVE_TILE.y * TILE_SIZE + TILE_SIZE / 2
    for (let i = 0; i < 6; i++) {
      const fx = Phaser.Math.Between(saveCenterX - 48, saveCenterX + 48)
      const fy = Phaser.Math.Between(saveCenterY - 48, saveCenterY + 48)
      const glow = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 3), 0x9ff3ff, Phaser.Math.FloatBetween(0.15, 0.35)).setDepth(5)
      this.tweens.add({
        targets: glow,
        x: `+=${Phaser.Math.Between(-20, 20)}`,
        y: `+=${Phaser.Math.Between(-30, -10)}`,
        alpha: 0.05,
        yoyo: true, repeat: -1,
        duration: Phaser.Math.Between(2500, 4500),
        ease: 'Sine.easeInOut',
      })
    }
    for (let i = 0; i < 8; i++) {
      const gx = Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48)
      const gy = Phaser.Math.Between(48, MAP_HEIGHT * TILE_SIZE - 48)
      const leaf = this.add.circle(gx, gy, 1.5, 0x6abf5e, 0.12).setDepth(0.3)
      this.tweens.add({
        targets: leaf,
        x: `+=${Phaser.Math.Between(-12, 12)}`,
        y: `+=${Phaser.Math.Between(-16, 16)}`,
        alpha: 0.02,
        yoyo: true, repeat: -1,
        duration: Phaser.Math.Between(3000, 5000),
        delay: Phaser.Math.Between(0, 2000),
        ease: 'Sine.easeInOut',
      })
    }
  }

  private createObjects() {
    const saveX = this.tileCenter(SAVE_TILE.x)
    const saveY = this.tileCenter(SAVE_TILE.y)
    this.add.ellipse(saveX, saveY + 13, 34, 12, 0x101014, 0.25).setDepth(2.8)
    const saveBase = this.add.rectangle(saveX, saveY + 7, 24, 18, 0x5e7ea6, 0.95).setDepth(3)
    saveBase.setStrokeStyle(2, 0xd7f6ff, 0.55)
    const saveGlow = this.add.polygon(saveX, saveY - 10, [0, -12, 10, 0, 0, 12, -10, 0], 0x75e7ff, 0.86).setDepth(4)
    this.tweens.add({ targets: saveGlow, y: saveGlow.y - 2, alpha: 0.62, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })

    this.drawChest()
    this.drawNpc(GUIDE_TILE, GENERATED_ASSETS.npcs.guideRin, 'Guide Rin')
    this.drawNpc(ELDER_TILE, GENERATED_ASSETS.npcs.elderMaelin, 'Elder')
    this.drawNpc(MERCHANT_TILE, GENERATED_ASSETS.npcs.peddler, 'Peddler')
    this.drawMarker(MARKER_TILE, GENERATED_ASSETS.objects.ruinMarker, 'Ruin Marker')
    this.drawMarker(SIGNPOST_TILE, GENERATED_ASSETS.objects.signpost, 'Signpost')
    this.drawMarker(TIDE_BELL_TILE, GENERATED_ASSETS.objects.tideBell, 'Tide Bell')
    this.drawMarker(MURAL_TILE, GENERATED_ASSETS.objects.mural, 'Glass Mural')
    this.drawMarker(WATCH_LANTERN_TILE, GENERATED_ASSETS.objects.watchLantern, 'Watch Lantern')
    this.drawMarker(SHRINE_GATE_TILE, GENERATED_ASSETS.objects.shrineGate, 'Shrine Gate')
    if (this.flag('shrine_gate_seen')) {
      this.drawMarker(SHRINE_FONT_TILE, GENERATED_ASSETS.objects.pilgrimFont, 'Pilgrim Font')
      this.drawMarker(SHRINE_SEAL_TILE, GENERATED_ASSETS.objects.innerSeal, this.flag('shrine_guardian_won') ? 'Awakened Seal' : 'Inner Seal')
    }
    this.drawMarker(FIELD_BATTLE_TILE, GENERATED_ASSETS.objects.guardianField, this.flag('field_battle_won') ? 'Cleared Field' : 'Guardian Field')
  }

  private drawChest() {
    const isOpen = this.saveData.openedChests.includes(CHEST_ID)
    this.add.ellipse(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y) + 14, 34, 12, 0x101014, 0.28).setDepth(3.5)
    if (hasTexture(this, GENERATED_ASSETS.objects.chest)) {
      this.add.image(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), GENERATED_ASSETS.objects.chest).setScale(0.6).setAlpha(isOpen ? 0.45 : 1).setDepth(4)
      return
    }
    this.add.rectangle(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), 32, 26, isOpen ? 0x403520 : 0x8a5a21).setStrokeStyle(3, 0xf0c040, 0.8).setDepth(4)
  }

  private drawNpc(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    void label
    this.add.ellipse(x, y + 18, 34, 13, 0x101014, 0.32).setDepth(3.5)
    const npc = hasTexture(this, assetKey)
      ? this.add.image(x, y, assetKey).setScale(0.65).setDepth(4)
      : this.add.rectangle(x, y, 34, 44, 0x888888).setStrokeStyle(2, 0xffffff, 0.45).setDepth(4)
    this.tweens.add({ targets: npc, y: npc.y - 1.5, yoyo: true, repeat: -1, duration: 1600 + tile.x * 35, ease: 'Sine.easeInOut' })
  }

  private drawMarker(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    void label
    this.add.ellipse(x, y + 16, 34, 12, 0x101014, 0.28).setDepth(2.5)
    const marker = hasTexture(this, assetKey)
      ? this.add.image(x, y, assetKey).setScale(0.6).setDepth(3)
      : this.add.rectangle(x, y, 34, 34, 0x888888, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
    this.tweens.add({ targets: marker, scale: hasTexture(this, assetKey) ? 0.63 : 1.04, yoyo: true, repeat: -1, duration: 1350, ease: 'Sine.easeInOut' })
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      return this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setScale(0.65).setDepth(11)
    }
    return this.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  private createHud() {
    const panel = this.add.rectangle(12, 12, 500, 86, 0x0b0e1a, 0.88).setOrigin(0).setScrollFactor(0).setDepth(90)
    panel.setStrokeStyle(2, 0xf3e1b0, 0.68)
    const cornerSize = 10
    const g = this.add.graphics().setScrollFactor(0).setDepth(90.1)
    g.lineStyle(2, 0xf0c040, 0.5)
    g.beginPath(); g.moveTo(14, 18 + cornerSize); g.lineTo(14, 18); g.lineTo(14 + cornerSize, 18); g.strokePath()
    g.beginPath(); g.moveTo(504, 18 + cornerSize); g.lineTo(504, 18); g.lineTo(504 - cornerSize, 18); g.strokePath()
    g.beginPath(); g.moveTo(14, 86 - cornerSize); g.lineTo(14, 86); g.lineTo(14 + cornerSize, 86); g.strokePath()
    g.beginPath(); g.moveTo(504, 86 - cornerSize); g.lineTo(504, 86); g.lineTo(504 - cornerSize, 86); g.strokePath()

    this.objectiveText = this.add.text(26, 23, '', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold', wordWrap: { width: 460 } }).setScrollFactor(0).setDepth(91)
    this.inventoryText = this.add.text(26, 69, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '13px' }).setScrollFactor(0).setDepth(91)
    const areaPanel = this.add.rectangle(this.scale.width / 2, 14, 160, 34, 0x0b0e1a, 0.88).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90)
    areaPanel.setStrokeStyle(1, 0xf3e1b0, 0.5)
    this.areaText = this.add.text(this.scale.width / 2, 31, 'Luma Quay', { color: '#9ff3ff', fontFamily: 'Georgia, serif', fontSize: '16px' }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
    this.promptText = this.add.text(this.scale.width / 2, this.scale.height - 18, 'Move • ACT/Enter • Menu', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '14px', backgroundColor: '#08091aaa', padding: { x: 12, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(95)
  }

  private createTouchControls() {
    const { width, height } = this.scale
    const padX = 92
    const padY = height - 72
    const controls = [
      { label: '◀', x: padX - 40, y: padY, move: { x: -1, y: 0 } },
      { label: '▶', x: padX + 40, y: padY, move: { x: 1, y: 0 } },
      { label: '▲', x: padX, y: padY - 40, move: { x: 0, y: -1 } },
      { label: '▼', x: padX, y: padY + 40, move: { x: 0, y: 1 } },
    ]

    controls.forEach((control) => {
      const button = this.add.circle(control.x, control.y, 26, 0x08091a, 0.46).setScrollFactor(0).setDepth(96).setStrokeStyle(2, 0xffffff, 0.34).setInteractive({ useHandCursor: true })
      const label = this.add.text(control.x, control.y, control.label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(97)
      button.on('pointerdown', () => { this.touchMove = control.move; button.setFillStyle(0x1b3762, 0.68) })
      button.on('pointerup', () => { this.touchMove = null; button.setFillStyle(0x08091a, 0.46) })
      button.on('pointerout', () => { if (this.touchMove === control.move) { this.touchMove = null }; button.setFillStyle(0x08091a, 0.46) })
      this.touchButtons.push(button, label)
    })

    const interact = this.add.text(width - 92, height - 94, 'ACT', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', backgroundColor: '#0a0a2e88', padding: { x: 20, y: 14 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
    const menu = this.add.text(width - 88, height - 38, 'MENU', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '13px', backgroundColor: '#08091a88', padding: { x: 16, y: 8 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
    interact.on('pointerdown', () => this.interact())
    menu.on('pointerdown', () => this.openMenu())
    this.touchButtons.push(interact, menu)
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
      this.showToast(this.flag('slice_complete') ? 'Progress saved at the Skywell. Luma Quay rests easier.' : 'Progress saved at the Skywell.')
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
    } else if (isAt(SHRINE_FONT_TILE)) {
      this.attuneShrineFont()
    } else if (isAt(SHRINE_SEAL_TILE)) {
      this.startShrineGuardianBattle()
    } else if (isAt(FIELD_BATTLE_TILE)) {
      this.startFieldBattle()
    } else {
      audioManager.playSfx('ui_cancel')
      this.showToast('Nothing responds here. Check the objective or face an object and press Enter/Space.')
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
    if (this.objectiveText && this.inventoryText) {
      this.refreshHud()
    }
  }

  private talkGuide() {
    if (!this.flag('elder_intro')) {
      this.showToast('Guide Rin: First stop is Elder Maelin north of here. I will keep pointing the safe route if you get turned around.')
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
    if (this.objectiveText && this.inventoryText) {
      this.refreshHud()
    }
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
    if (this.busy) {
      return
    }

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
    audioManager.playSfx('scene_whoosh')
    this.showEventBanner('Guardian Field', 'The grass folds inward. Relics flare as the ward answers.')
    this.cameras.main.shake(180, 0.004)
    this.time.delayedCall(760, () => {
      this.cameras.main.fadeOut(420, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('BattleScene', {
          battleId: FIELD_BATTLE_ID,
          enemyIds: ['vinecrawler', 'moss_knight'],
          isBoss: false,
        })
      })
    })
  }

  private applyBattleResult() {
    const result = this.initData.battleResult
    if (!result) {
      return
    }

    if (!result.victory) {
      this.showToast('You regroup at Luma Quay. Check supplies, then try again when ready.')
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
    if (result.battleId === SHRINE_BOSS_BATTLE_ID) {
      this.setFlag('shrine_guardian_won')
      this.setObjective(OBJECTIVES.complete)
      this.setFlag('demo_complete')
      this.addInventory('skywell_shard', 1)
      this.saveData.party[0].equipment.relic = 'skywell_shard'
      this.saveData.party.forEach((member) => {
        member.level = Math.max(member.level, 4)
      })
      audioManager.playResonancePulse('event')
    }
    this.persist()
    this.time.delayedCall(250, () => {
      this.showEventBanner(
        result.battleId === SHRINE_BOSS_BATTLE_ID ? 'Moonwake Guardian Defeated' : 'Guardian Felled',
        result.battleId === SHRINE_BOSS_BATTLE_ID
          ? 'The shrine opens a silver route toward the Skywell. Nara equips the Skywell Shard.'
          : 'The field exhales. Far east, a shrine bell answers once.',
      )
      audioManager.playSfx(result.battleId === SHRINE_BOSS_BATTLE_ID ? 'equipment_gain' : 'reward_gain')
      this.time.delayedCall(320, () => audioManager.playSfx('reward_gain'))
      this.showRewardToast(result.battleId === SHRINE_BOSS_BATTLE_ID ? `Climax reward: ${rewards.gold}g, Skywell Shard, party level 4. Save at the skywell.` : `Rewards secured: ${rewards.gold}g, Ember Shard x${rewards.emberShards}, Potion x1`)
      this.refreshHud()
      if (result.battleId === SHRINE_BOSS_BATTLE_ID) {
        this.time.delayedCall(3050, () => this.showDemoCompletionCard())
      }
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
      this.setObjective(OBJECTIVES.attuneShrineFont)
      audioManager.playResonancePulse('event')
      audioManager.playSfx('scene_whoosh')
      this.cameras.main.shake(220, 0.004)
      this.showAreaBanner('Moonwake Shrine Approach', 'Beyond the gate, old glass ruins breathe with patient light.')
      this.showEventBanner('Moonwake Shrine', 'A narrow pilgrim route opens. The inner seal waits beyond the font.')
    } else {
      this.showToast(this.flag('shrine_guardian_won') ? 'Moonwake Gate: The guardian vow is fulfilled. The shrine keeps a road of silver fire.' : 'Moonwake Gate: The approach descends to a font and an inner seal. Prepare before touching it.')
    }
    this.persist()
    this.refreshHud()
  }

  private attuneShrineFont() {
    if (!this.flag('shrine_gate_seen')) {
      this.showToast('The shrine approach is sealed. Inspect the Moonwake Gate first.')
      return
    }
    if (!this.flag('shrine_font_attuned')) {
      this.setFlag('shrine_font_attuned')
      this.setObjective(OBJECTIVES.faceShrineGuardian)
      this.saveData.party.forEach((member) => {
        const character = CHARACTERS[member.characterId]
        member.currentHp = Math.max(member.currentHp, character?.baseStats.hp ?? member.currentHp)
        member.currentMp = Math.max(member.currentMp, character?.baseStats.mp ?? member.currentMp)
      })
      this.addInventory('mana_potion', 1)
      audioManager.playSfx('save_point')
      this.time.delayedCall(260, () => audioManager.playResonancePulse('objective'))
      this.showEventBanner('Pilgrim Font Attuned', 'HP and MP restored. Ether x1 recovered from the moonlit basin.')
      this.showToast('Io: The seal is not a lock. It is a witness. It wants us ready.')
    } else {
      this.showToast(this.flag('shrine_guardian_won') ? 'Pilgrim Font: The water reflects a road climbing into the Skywell.' : 'Pilgrim Font: Your reflection steadies. The inner seal awaits south.')
    }
    this.persist()
    this.refreshHud()
  }

  private startShrineGuardianBattle() {
    if (this.busy) {
      return
    }

    if (!this.flag('shrine_gate_seen')) {
      this.showToast('The inner shrine is unreachable until the Moonwake Gate opens.')
      return
    }
    if (!this.flag('shrine_font_attuned')) {
      this.showToast('Inner Seal: A cold pressure turns you back. Attune the pilgrim font first.')
      return
    }
    if (this.flag('shrine_guardian_won')) {
      this.showToast('Inner Seal: Broken glass floats upward, forming a map toward the Skywell.')
      return
    }
    this.busy = true
    this.saveCurrentPosition()
    this.persist()
    audioManager.playSfx('boss_sting')
    this.showEventBanner('Inner Seal Broken', 'The Moonwake Guardian descends to test the ember vow.')
    this.cameras.main.shake(360, 0.007)
    this.time.delayedCall(1180, () => {
      audioManager.playSfx('scene_whoosh')
      this.cameras.main.fadeOut(420, 6, 8, 22)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('BattleScene', {
          battleId: SHRINE_BOSS_BATTLE_ID,
          enemyIds: ['moonwake_guardian'],
          isBoss: true,
        })
      })
    })
  }

  private showToast(message: string) {
    const { width } = this.scale
    this.toast?.destroy()
    const panelW = Math.min(message.length * 9 + 48, 740)
    const panelH = Math.max(Math.ceil(message.length / 70) * 22 + 32, 40)
    const panel = this.add.rectangle(width / 2, 126, panelW, panelH, 0x0a0e1e, 0.92).setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0xd4a84b, 0.6)
    const accent = this.add.rectangle(width / 2 - panelW / 2 + 3, 126, 3, panelH - 8, 0xd4a84b, 0.8).setScrollFactor(0).setDepth(100.1)
    const text = this.add.text(width / 2, 126, message, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: panelW - 32 } }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
    this.toast = text
    this.tweens.add({ targets: [panel, accent, text], y: 104, alpha: 0, delay: 1900, duration: 450, onComplete: () => { if (this.toast === text) { this.toast = undefined }; panel.destroy(); accent.destroy(); text.destroy() } })
  }

  private showRewardToast(message: string) {
    const { width } = this.scale
    this.toast?.destroy()
    const panel = this.add.rectangle(width / 2, 128, 760, 48, 0x231525, 0.94).setScrollFactor(0).setDepth(101).setStrokeStyle(2, 0xffd36e, 0.72)
    const text = this.add.text(width / 2, 128, message, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '18px', wordWrap: { width: 700 } }).setOrigin(0.5).setScrollFactor(0).setDepth(102)
    this.toast = text
    this.tweens.add({ targets: [panel, text], y: '-=10', alpha: 0, delay: 2600, duration: 520, onComplete: () => { if (this.toast === text) { this.toast = undefined }; panel.destroy(); text.destroy() } })
  }

  private showAreaBanner(title: string, subtitle: string) {
    this.dismissBanners()
    this.areaText?.setText(title)
    const { width } = this.scale
    const panel = this.add.rectangle(width / 2, 84, 580, 84, 0x071023, 0.88).setScrollFactor(0).setDepth(120).setStrokeStyle(1, 0x9ff3ff, 0.5)
    const heading = this.add.text(width / 2, 62, title, { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '26px' }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    const body = this.add.text(width / 2, 92, subtitle, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: 520 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    this.activeBanners.push(panel, heading, body)
    this.tweens.add({ targets: [panel, heading, body], alpha: 0, delay: 2300, duration: 600, onComplete: () => { panel.destroy(); heading.destroy(); body.destroy(); this.activeBanners = this.activeBanners.filter(b => b.scene && b.active) } })
  }

  private showEventBanner(title: string, subtitle: string) {
    this.dismissBanners()
    const { width, height } = this.scale
    const panel = this.add.rectangle(width / 2, height / 2 - 140, 660, 92, 0x1b1020, 0.92).setScrollFactor(0).setDepth(130).setStrokeStyle(2, 0xffd36e, 0.72)
    const accent = this.add.rectangle(width / 2, height / 2 - 186, 0, 2, 0xffd36e, 0.9).setScrollFactor(0).setDepth(131)
    const heading = this.add.text(width / 2, height / 2 - 162, title, { color: '#ffd36e', fontFamily: 'Georgia, serif', fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const body = this.add.text(width / 2, height / 2 - 130, subtitle, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: 600 } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    this.activeBanners.push(panel, accent, heading, body)
    this.tweens.add({ targets: accent, width: 560, duration: 260, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: [panel, accent, heading, body], y: '-=10', alpha: 0, delay: 2600, duration: 520, onComplete: () => { panel.destroy(); accent.destroy(); heading.destroy(); body.destroy(); this.activeBanners = this.activeBanners.filter(b => b.scene && b.active) } })
    this.cameras.main.flash(180, 255, 211, 110, false)
  }

  private showFirstSessionGuide() {
    if (this.flag('elder_intro')) {
      return
    }

    audioManager.playSfx('objective_update')
    this.showEventBanner('Demo Start', 'A 15-minute vertical slice: meet Elder Maelin, follow the objective, and chase the Moonwake Shrine route.')
    this.time.delayedCall(450, () => {
      this.showToast('Start here: move north to Elder Maelin. Guide Rin, signposts, and the gold objective will keep you on the authored path.')
    })
  }

  private showDemoCompletionCard() {
    this.dismissBanners()
    const { width, height } = this.scale
    const panel = this.add.rectangle(width / 2, height / 2 + 20, 760, 210, 0x071023, 0.96).setScrollFactor(0).setDepth(180).setStrokeStyle(2, 0x9ff3ff, 0.82)
    const heading = this.add.text(width / 2, height / 2 - 58, 'Thanks for Playing the Emberglass Demo', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '28px' }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const body = this.add.text(width / 2, height / 2 + 2, 'You cleared the public-demo route: Luma Quay, the guardian field, Moonwake Shrine, and the first Skywell clue. Save at the Skywell to keep this clear file, or return to the title and press R to reset for another showcase run.', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', align: 'center', wordWrap: { width: 690 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const footer = this.add.text(width / 2, height / 2 + 82, 'This slice represents onboarding, exploration, relic combat, boss payoff, and save/load flow.', { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '15px', align: 'center', wordWrap: { width: 660 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    this.tweens.add({ targets: [panel, heading, body, footer], alpha: 0, delay: 7200, duration: 900, onComplete: () => { panel.destroy(); heading.destroy(); body.destroy(); footer.destroy() } })
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
    const panel = this.add.rectangle(width / 2, height / 2, 700, 500, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.6)
    container.add(panel)
    container.add(this.add.rectangle(width / 2, height / 2 - 136, 640, 1, 0xd4a84b, 0.3))
    container.add(this.add.rectangle(width / 2, height / 2 - 52, 640, 1, 0xd4a84b, 0.3))
    container.add(this.add.rectangle(width / 2, height / 2 + 160, 640, 1, 0xd4a84b, 0.3))
    container.add(this.add.text(width / 2 - 310, height / 2 - 220, '◈', { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '22px' }))
    container.add(this.add.text(width / 2 - 290, height / 2 - 220, 'Emberglass Menu', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '28px' }))
    container.add(this.add.text(width / 2 + 170, height / 2 - 216, `${this.saveData.gold}g`, { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '24px' }))
    container.add(this.add.text(width / 2 - 310, height / 2 - 168, `Objective\n${this.saveData.currentObjective}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: 610 } }))
    container.add(this.add.text(width / 2 - 310, height / 2 - 86, `Status / Equipment\n${relicLines}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 5 }))
    container.add(this.add.text(width / 2 + 64, height / 2 - 86, `Inventory\n${inventoryLines.join('\n')}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 7 }))
    container.add(this.add.text(width / 2 - 310, height / 2 + 184, 'Controls: Move WASD/Arrows or touch pad • Interact Enter/Space/ACT • Menu M/Esc • Shop trades shards first, then sells potions.', { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: 620 } }))
    this.menuOverlay = { container }
  }

  private closeMenu() {
    this.menuOverlay?.container.destroy()
    this.menuOverlay = undefined
    this.busy = false
    audioManager.playSfx('ui_cancel')
  }

  private dismissBanners() {
    this.activeBanners.forEach((b) => b.destroy())
    this.activeBanners = []
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
                        : isAt(SHRINE_FONT_TILE)
                          ? 'Attune pilgrim font'
                          : isAt(SHRINE_SEAL_TILE)
                            ? 'Challenge inner seal'
                        : isAt(FIELD_BATTLE_TILE)
                          ? 'Enter guardian field'
                          : 'Move WASD/Arrows • Enter: Interact • M/Esc: Menu'
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
    if (!SaveSystem.autoSave(this.saveData)) {
      audioManager.playSfx('ui_cancel')
      this.showToast('Save failed. Progress remains playable, but browser storage may be full or blocked.')
      return
    }

    if (this.objectiveText && this.inventoryText) {
      this.refreshHud()
    }
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
      item.quantity = Math.max(0, item.quantity + quantity)
    } else {
      this.saveData.inventory.push({ itemId, quantity: Math.max(0, quantity) })
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
