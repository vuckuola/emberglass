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
type Direction = 'up' | 'down' | 'left' | 'right'
const HERO_ANIM_ROWS: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 }
const TILESET_CROPS = {
  grass: { x: 0, y: 0 },
  path: { x: 64, y: 0 },
  water: { x: 128, y: 0 },
  wall: { x: 192, y: 0 },
} as const
const MAP_LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWW',
  'WGGGPPPPPPPGGGGGGGGW',
  'WFGGPPPPPPPPPPPPGGGW',
  'WFGGPGGGGGPGBBBPGGGW',
  'WGGGPGGGGGPGGGGPGGGW',
  'WGGGPPPPPPPPGGGPGGGW',
  'WWWBBBBBGGGGGGGPGGPW',
  'WGGGGGPGGGGGGGGPGGPW',
  'WFFGGGPPPPPPPPPPPGPW',
  'WGGGGGPGGGGGGGBGPGPW',
  'WGGGGGPGGPPPGGGBPGPW',
  'WGGGGGPGGPGPGGGGPGPW',
  'WGGGFPPPPPGPPPPPPGPW',
  'WGGGGGGGGPGGGGGGGGGW',
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
const HOME_TILE = { x: 4, y: 12 }
const ALLY_TILE = { x: 13, y: 6 }
const PET_TILE = { x: 7, y: 12 }
const ARCHIVE_TILE = { x: 11, y: 12 }
const MID_BOSS_TILE = { x: 15, y: 10 }
const FINAL_BOSS_TILE = { x: 18, y: 12 }
const FIELD_BATTLE_ID = 'field_marker_battle'
const SHRINE_BOSS_BATTLE_ID = 'moonwake_guardian_battle'
const ARCHIVE_SKIRMISH_ID = 'archive_skirmish_battle'
const MID_BOSS_BATTLE_ID = 'thornheart_battle'
const FINAL_BOSS_BATTLE_ID = 'cartographers_lie_battle'
const CHEST_ID = 'quay_supply_chest'

const OBJECTIVES = {
  talkToElder: 'Speak with Elder Maelin at Luma Quay.',
  inspectMarker: 'Inspect the ruin marker in the eastern field.',
  winBattle: 'Defeat the field guardian beyond the marker.',
  returnToElder: 'Return to Elder Maelin with the ember shard.',
  visitShrineGate: 'Follow the blue-lit east lane to the Moonwake Shrine gate.',
  attuneShrineFont: 'Enter Moonwake Shrine and attune the pilgrim font.',
  faceShrineGuardian: 'Break the inner seal and face the Moonwake Guardian.',
  recruitMira: 'Follow the broken-bridge lane and recruit Mira.',
  rescuePet: 'Follow the bell-chime south and rescue the emberfox kit.',
  restoreHome: 'Restore the old quay house into a safe base.',
  enterArchive: 'Use the cleared archive lane with Mira and Pip.',
  faceMidBoss: 'Cut through the archive roots and defeat Thornheart.',
  openSkywell: 'Use the restored home workshop to focus the Skywell Lens.',
  finalBoss: 'Follow the now-open Skywell approach and confront the Cartographer\'s Lie.',
  complete: 'Return home. Luma Quay has a future again.',
} as const

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
  private player?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle
  private playerShadow?: Phaser.GameObjects.Ellipse
  private petFollower?: Phaser.GameObjects.Arc | Phaser.GameObjects.Image
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
  private routeClarityStates: Record<string, 'open' | 'closed'> = {}

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
    this.routeClarityStates = {}
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
    this.createGeneratedAnimations()
    this.createMap()
    this.createObjects()

    const startX = this.saveData.position.x
    const startY = this.saveData.position.y
    this.playerShadow = this.add.ellipse(startX, startY + 18, 34, 14, 0x101014, 0.32).setDepth(10)
    this.player = this.createPlayer(startX, startY)
    this.createPetFollower(startX - 28, startY + 18)
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
    this.updatePlayerAnimation(velocityX !== 0 || velocityY !== 0)
    this.playerShadow.setPosition(this.player.x, this.player.y + 18)
    this.updatePetFollower()
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
    const flowerColors = [0xffd166, 0xff7aa2, 0xc7f9ff]
    const useTileset = hasTexture(this, GENERATED_ASSETS.tileset)

    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const layoutTile = MAP_LAYOUT[tileY][tileX]
        const isBattleGate = tileX === FIELD_BATTLE_TILE.x && tileY === FIELD_BATTLE_TILE.y && !this.flag('field_battle_won')
        const isShrineGate = tileX === SHRINE_GATE_TILE.x && tileY === SHRINE_GATE_TILE.y && !this.flag('shrine_gate_seen')
        const isWall = layoutTile === 'W' || layoutTile === 'B' || isBattleGate
        const blocksTravel = isWall && !isShrineGate
        const x = tileX * TILE_SIZE
        const y = tileY * TILE_SIZE
        const terrain = layoutTile === 'P' ? 'path' : layoutTile === '.' ? 'water' : isWall ? 'wall' : 'grass'
        const areaTint = tileX <= 6 && tileY >= 9 ? 0x4f9342 : tileX >= 14 && tileY <= 8 ? 0x355c75 : tileX >= 12 ? 0x526b3c : tileY >= 10 ? 0x3f7c43 : 0x3d8b37

        if (useTileset) {
          const crop = TILESET_CROPS[terrain]
          this.add.image(x, y, GENERATED_ASSETS.tileset).setOrigin(0).setCrop(crop.x, crop.y, TILE_SIZE, TILE_SIZE).setDepth(isWall ? 1 : 0)
        } else if (layoutTile === 'P') {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0xc4a882).setOrigin(0).setDepth(0)
        } else if (layoutTile === '.') {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x357ec7).setOrigin(0).setDepth(0)
        } else if (isWall) {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, layoutTile === 'B' ? 0x6b5140 : 0x5a4a3a).setOrigin(0).setDepth(1)
        } else {
          this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, areaTint).setOrigin(0).setDepth(0)
        }

        if (layoutTile === 'P') {
          if ((tileX * 5 + tileY * 11) % 4 === 0) {
            this.add.rectangle(x + 8, y + 18, 7, 3, 0xad8f66, 0.22).setOrigin(0).setDepth(0.1)
          }
        } else if (layoutTile === '.') {
          this.add.rectangle(x + 4, y + 14, TILE_SIZE - 8, 3, 0x9bdcff, 0.18).setOrigin(0).setDepth(0.1)
        } else if (isWall) {
          this.add.rectangle(x + 4, y + 12, TILE_SIZE - 8, 2, 0xffffff, 0.08).setOrigin(0).setDepth(1.2)
        } else {
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

    this.drawAreaPolish()
  }

  private drawAreaPolish() {
    this.drawZoneWash(4.3, 3.1, 310, 210, 0x2d7691, 'Luma Quay tideglass')
    this.drawZoneWash(4.8, 11.2, 360, 210, 0x4f9b47, 'South Garden hearth')
    this.drawZoneWash(15.8, 8.7, 260, 260, 0xd29b42, 'East Field wheatline')
    this.drawZoneWash(17.2, 3.4, 190, 270, 0x315d9a, 'Moonwake blue lane')
    this.drawZoneWash(10.7, 11.8, 210, 180, 0x256a3a, 'Verdant Archive canopy')
    this.drawZoneWash(17.4, 12.0, 170, 150, 0x7567b7, 'Skywell violet climb')

    this.drawRouteRibbon([{ x: 4, y: 1 }, { x: 4, y: 5 }, { x: 8, y: 5 }, { x: 11, y: 5 }, { x: 15, y: 8 }, { x: 17, y: 12 }], 0xd8ba83, 'main tan road')
    this.drawRouteRibbon([{ x: 11, y: 5 }, { x: 14, y: 2 }, { x: 18, y: 6 }, { x: 18, y: 10 }], 0x72d7ff, 'blue shrine road')
    this.drawRouteRibbon([{ x: 5, y: 12 }, { x: 8, y: 12 }, { x: 11, y: 12 }, { x: 15, y: 12 }], 0x6fe07e, 'green archive road')

    this.drawAreaLabel(4.5, 1.35, 'Luma Quay')
    this.drawAreaLabel(4.5, 10.55, 'South Garden / Home')
    this.drawAreaLabel(15.6, 8.15, 'East Field')
    this.drawAreaLabel(16.5, 2.05, 'Moonwake Shrine')
    this.drawAreaLabel(10.8, 11.05, 'Verdant Archive')
    this.drawAreaLabel(17.05, 12.65, 'Skywell Approach')

    this.drawFenceLine([{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }], 'Fallen bridge to Mira')
    this.drawFenceLine([{ x: 14, y: 9 }, { x: 14, y: 10 }, { x: 15, y: 10 }], 'Field fence')
    this.drawHedgeLine([{ x: 9, y: 3 }, { x: 11, y: 3 }, { x: 12, y: 3 }])
    this.drawHedgeLine([{ x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }])
    this.drawRouteLandmark({ x: 16, y: 12 }, 'FIELD GATE', 0xffcf76)
    this.drawRouteLandmark({ x: 18, y: 5 }, 'SHRINE ARCH', 0x8bd6ff)
    this.drawRouteLandmark({ x: 10, y: 12 }, 'ARCHIVE STEPS', 0x78d66b)
    this.drawRouteLandmark({ x: 17, y: 11 }, 'SKYWELL STAIRS', 0xbda7ff)
    this.drawGateBlocker(SHRINE_GATE_TILE, this.flag('shrine_gate_seen'), 'Shrine Gate', 0x8bd6ff)
    this.drawGateBlocker(FIELD_BATTLE_TILE, this.flag('field_battle_won'), 'Guardian Ward', 0xff5f5f)
    this.drawGateBlocker(ARCHIVE_TILE, this.saveData.home.workshop > 0, 'Overgrowth', 0x78d66b)
    this.drawGateBlocker(MID_BOSS_TILE, this.flag('thornheart_won'), 'Root Wall', 0x5bc779)
    this.drawGateBlocker(FINAL_BOSS_TILE, this.flag('skywell_opened'), 'Skywell Barrier', 0xbda7ff)
  }

  private drawZoneWash(tileX: number, tileY: number, width: number, height: number, color: number, label: string) {
    this.add.ellipse(tileX * TILE_SIZE, tileY * TILE_SIZE, width, height, color, 0.16).setDepth(0.05).setName(`zone:${label}`)
  }

  private drawRouteRibbon(points: Array<{ x: number; y: number }>, color: number, label: string) {
    const graphics = this.add.graphics().setDepth(0.35).setName(`route:${label}`)
    graphics.lineStyle(28, 0x160f0b, 0.22)
    graphics.beginPath()
    points.forEach((point, index) => {
      const x = this.tileCenter(point.x)
      const y = this.tileCenter(point.y)
      if (index === 0) {
        graphics.moveTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })
    graphics.strokePath()
    graphics.lineStyle(20, color, 0.30)
    graphics.beginPath()
    points.forEach((point, index) => {
      const x = this.tileCenter(point.x)
      const y = this.tileCenter(point.y)
      if (index === 0) {
        graphics.moveTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })
    graphics.strokePath()
  }

  private drawRouteLandmark(tile: { x: number; y: number }, label: string, color: number) {
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    this.add.rectangle(x, y + 12, 54, 8, 0x120d12, 0.45).setDepth(2.45).setName(`landmark:${label}:shadow`)
    this.add.rectangle(x - 18, y - 1, 5, 32, color, 0.86).setDepth(2.5).setName(`landmark:${label}:post`)
    this.add.rectangle(x + 18, y - 1, 5, 32, color, 0.86).setDepth(2.5)
    this.add.rectangle(x, y - 16, 46, 6, color, 0.86).setDepth(2.55)
    this.add.text(x, y + 24, label, { color: '#fff7d5', fontFamily: 'Arial, sans-serif', fontSize: '9px', backgroundColor: '#090b12bb', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(2.6).setName(`landmark:${label}`)
  }

  private drawAreaLabel(tileX: number, tileY: number, label: string) {
    const x = tileX * TILE_SIZE
    const y = tileY * TILE_SIZE
    const panel = this.add.rectangle(x, y, label.length * 7.6 + 22, 22, 0x061019, 0.58).setDepth(2.2)
    panel.setStrokeStyle(1, 0xf3e1b0, 0.24)
    this.add.text(x, y, label, { color: '#f3e1b0', fontFamily: 'Georgia, serif', fontSize: '12px' }).setOrigin(0.5).setDepth(2.3)
  }

  private drawFenceLine(tiles: Array<{ x: number; y: number }>, label: string) {
    tiles.forEach((tile) => {
      const x = this.tileCenter(tile.x)
      const y = this.tileCenter(tile.y)
      this.add.rectangle(x, y + 3, 42, 8, 0x8b623c, 0.96).setDepth(2.4)
      this.add.rectangle(x - 13, y, 5, 22, 0x5a3b24, 0.96).setDepth(2.5)
      this.add.rectangle(x + 13, y, 5, 22, 0x5a3b24, 0.96).setDepth(2.5)
    })
    const first = tiles[0]
    this.add.text(this.tileCenter(first.x), this.tileCenter(first.y) - 23, label, { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5).setDepth(2.6)
  }

  private drawHedgeLine(tiles: Array<{ x: number; y: number }>) {
    tiles.forEach((tile) => {
      const x = this.tileCenter(tile.x)
      const y = this.tileCenter(tile.y)
      this.add.ellipse(x, y + 4, 42, 30, 0x1f5b2f, 0.94).setDepth(2.2)
      this.add.circle(x - 10, y - 4, 10, 0x2f7c3a, 0.9).setDepth(2.3)
      this.add.circle(x + 8, y - 5, 11, 0x3b9146, 0.9).setDepth(2.3)
    })
  }

  private drawGateBlocker(tile: { x: number; y: number }, isOpen: boolean, label: string, color: number) {
    this.routeClarityStates[label] = isOpen ? 'open' : 'closed'
    this.clearRouteStateVisuals(label)
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    const statePrefix = `route-state:${label}`
    this.add.rectangle(x, y + 23, isOpen ? 68 : 58, isOpen ? 8 : 6, isOpen ? 0x9ff3ff : color, isOpen ? 0.42 : 0.88).setDepth(2.7).setName(`${statePrefix}:${isOpen ? 'open' : 'closed'}:base`)
    if (!isOpen) {
      this.add.rectangle(x, y + 4, 52, 44, 0x070914, 0.48).setStrokeStyle(4, color, 0.95).setDepth(2.8).setName(`${statePrefix}:closed:frame`)
      this.add.rectangle(x, y + 4, 34, 56, color, 0.18).setDepth(2.82).setName(`${statePrefix}:closed:fill`)
      this.add.line(x, y + 4, -22, -18, 22, 18, color, 0.95).setLineWidth(5).setDepth(2.86).setName(`${statePrefix}:closed:cross-a`)
      this.add.line(x, y + 4, 22, -18, -22, 18, color, 0.95).setLineWidth(5).setDepth(2.86).setName(`${statePrefix}:closed:cross-b`)
      this.add.text(x, y - 34, `${label} closed`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914dd', padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(2.9).setName(`${statePrefix}:closed:label`)
      return
    }
    this.add.rectangle(x, y + 2, 64, 30, 0x9ff3ff, 0.08).setStrokeStyle(2, 0x9ff3ff, 0.42).setDepth(2.78).setName(`${statePrefix}:open:frame`)
    this.add.text(x, y - 32, `${label} open`, { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(2.9).setName(`${statePrefix}:open:label`)
  }

  private clearRouteStateVisuals(label: string) {
    const prefix = `route-state:${label}:`
    this.children.list
      .filter((child) => typeof child.name === 'string' && child.name.startsWith(prefix))
      .forEach((child) => child.destroy())
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
    this.drawMarker(SIGNPOST_TILE, GENERATED_ASSETS.objects.signpost, 'Route Sign')
    this.drawMarker(TIDE_BELL_TILE, GENERATED_ASSETS.objects.tideBell, 'Tide Bell')
    this.drawMarker(MURAL_TILE, GENERATED_ASSETS.objects.mural, 'Glass Mural')
    this.drawMarker(WATCH_LANTERN_TILE, GENERATED_ASSETS.objects.watchLantern, 'Watch Lantern')
    this.drawMarker(HOME_TILE, GENERATED_ASSETS.objects.signpost, this.getHomeName())
    this.drawNpc(ALLY_TILE, GENERATED_ASSETS.npcs.guideRin, this.flag('mira_recruited') ? 'Mira' : 'Bridge Scout')
    this.drawMarker(PET_TILE, GENERATED_ASSETS.objects.tideBell, this.saveData.pet.unlocked ? 'Pip' : 'Bell Thicket')
    this.drawMarker(ARCHIVE_TILE, GENERATED_ASSETS.objects.ruinMarker, 'Verdant Archive')
    this.drawMarker(MID_BOSS_TILE, GENERATED_ASSETS.objects.guardianField, this.flag('thornheart_won') ? 'Root-Cleared Path' : 'Thornheart Roots')
    this.drawMarker(FINAL_BOSS_TILE, GENERATED_ASSETS.objects.innerSeal, this.flag('final_boss_won') ? 'Quiet Skywell' : 'Skywell Rift')
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
      ? this.add.sprite(x, y, assetKey, 0).setScale(0.65).setDepth(4)
      : this.add.rectangle(x, y, 34, 44, 0x888888).setStrokeStyle(2, 0xffffff, 0.45).setDepth(4)
    if (npc instanceof Phaser.GameObjects.Sprite) {
      npc.play(`idle-${assetKey}`)
    }
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

  private createPlayer(x: number, y: number): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      const player = this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setScale(0.65).setDepth(11)
      player.play('nara-idle-down')
      return player
    }
    return this.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  private createPetFollower(x: number, y: number) {
    if (!this.saveData.pet.unlocked) {
      this.petFollower = undefined
      return
    }
    this.petFollower = this.add.circle(x, y, 10, 0xffa43a, 0.95).setStrokeStyle(2, 0xfff1a8, 0.7).setDepth(10.5)
    this.tweens.add({ targets: this.petFollower, y: y - 5, yoyo: true, repeat: -1, duration: 780, ease: 'Sine.easeInOut' })
  }

  private updatePetFollower() {
    if (!this.petFollower || !this.player) {
      return
    }
    this.petFollower.x += (this.player.x - 28 - this.petFollower.x) * 0.08
    this.petFollower.y += (this.player.y + 18 - this.petFollower.y) * 0.08
  }

  private createGeneratedAnimations() {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      for (const direction of Object.keys(HERO_ANIM_ROWS) as Direction[]) {
        const row = HERO_ANIM_ROWS[direction]
        if (!this.anims.exists(`nara-walk-${direction}`)) {
          this.anims.create({ key: `nara-walk-${direction}`, frames: this.anims.generateFrameNumbers(GENERATED_ASSETS.heroes.nara, { start: row * 4, end: row * 4 + 3 }), frameRate: 7, repeat: -1 })
        }
        if (!this.anims.exists(`nara-idle-${direction}`)) {
          this.anims.create({ key: `nara-idle-${direction}`, frames: [{ key: GENERATED_ASSETS.heroes.nara, frame: row * 4 }], frameRate: 1 })
        }
      }
    }
    for (const assetKey of [GENERATED_ASSETS.npcs.guideRin, GENERATED_ASSETS.npcs.elderMaelin, GENERATED_ASSETS.npcs.peddler, GENERATED_ASSETS.npc]) {
      if (hasTexture(this, assetKey) && !this.anims.exists(`idle-${assetKey}`)) {
        this.anims.create({ key: `idle-${assetKey}`, frames: this.anims.generateFrameNumbers(assetKey, { start: 0, end: 1 }), frameRate: 1.6, repeat: -1 })
      }
    }
  }

  private updatePlayerAnimation(isMoving: boolean) {
    if (!(this.player instanceof Phaser.GameObjects.Sprite)) {
      return
    }
    const key = `nara-${isMoving ? 'walk' : 'idle'}-${this.facing}`
    if (this.player.anims.currentAnim?.key !== key) {
      this.player.play(key)
    }
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
      this.showToast(this.flag('slice_complete') ? 'Route Sign: Moonwake east is open; Archive south waits for home repairs; Skywell opens after Thornheart.' : 'Route Sign: Elder north, marker east, broken bridge south, sealed Skywell beyond the archive.')
      this.addEvent('read_signpost')
    } else if (isAt(TIDE_BELL_TILE)) {
      this.ringTideBell()
    } else if (isAt(MURAL_TILE)) {
      this.inspectMural()
    } else if (isAt(WATCH_LANTERN_TILE)) {
      this.lightWatchLantern()
    } else if (isAt(HOME_TILE)) {
      this.restoreHome()
    } else if (isAt(ALLY_TILE)) {
      this.recruitMira()
    } else if (isAt(PET_TILE)) {
      this.rescuePet()
    } else if (isAt(ARCHIVE_TILE)) {
      this.enterArchive()
    } else if (isAt(MID_BOSS_TILE)) {
      this.startMidBossBattle()
    } else if (isAt(FINAL_BOSS_TILE)) {
      this.startFinalBossBattle()
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
      this.showToast('Elder Maelin: Take the Warding Ember. The blue Moonwake lane east is open now.')
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
      this.showToast('Guardian Ward: red stakes block the East Field battle lane. Inspect the ruin marker beside it first.')
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
      this.saveData.stage = 'shrine'
      this.setObjective(OBJECTIVES.recruitMira)
      this.addInventory('skywell_shard', 1)
      this.saveData.party[0].equipment.relic = 'skywell_shard'
      this.saveData.party.forEach((member) => {
        member.level = Math.max(member.level, 4)
      })
      audioManager.playResonancePulse('event')
    }
    if (result.battleId === ARCHIVE_SKIRMISH_ID) {
      this.setFlag('archive_skirmish_won')
      this.setObjective(OBJECTIVES.faceMidBoss)
    }
    if (result.battleId === MID_BOSS_BATTLE_ID) {
      this.setFlag('thornheart_won')
      this.saveData.stage = 'skywell'
      this.setObjective(OBJECTIVES.openSkywell)
      this.saveData.pet.forageReady = this.saveData.pet.unlocked
      this.saveData.party.forEach((member) => { member.level = Math.max(member.level, 5) })
    }
    if (result.battleId === FINAL_BOSS_BATTLE_ID) {
      this.setFlag('final_boss_won')
      this.setFlag('demo_complete')
      this.saveData.stage = 'homecoming'
      this.setObjective(OBJECTIVES.complete)
      this.saveData.pet.forageReady = this.saveData.pet.unlocked
      this.saveData.party.forEach((member) => { member.level = Math.max(member.level, 6) })
    }
    this.persist()
    this.time.delayedCall(250, () => {
      this.showEventBanner(
        this.getBattleResultTitle(result.battleId),
        this.getBattleResultSubtitle(result.battleId),
      )
      audioManager.playSfx(result.battleId === SHRINE_BOSS_BATTLE_ID ? 'equipment_gain' : 'reward_gain')
      this.time.delayedCall(320, () => audioManager.playSfx('reward_gain'))
      this.showRewardToast(`Rewards secured: ${rewards.gold}g, EXP ${rewards.exp}, new route objective updated.`)
      this.refreshHud()
      if (result.battleId === FINAL_BOSS_BATTLE_ID) {
        this.time.delayedCall(3050, () => this.showDemoCompletionCard())
      }
    })
  }

  private getBattleResultTitle(battleId?: string) {
    if (battleId === SHRINE_BOSS_BATTLE_ID) return 'Moonwake Guardian Defeated'
    if (battleId === ARCHIVE_SKIRMISH_ID) return 'Archive Path Cleared'
    if (battleId === MID_BOSS_BATTLE_ID) return 'Thornheart Felled'
    if (battleId === FINAL_BOSS_BATTLE_ID) return 'True Map Restored'
    return 'Guardian Felled'
  }

  private getBattleResultSubtitle(battleId?: string) {
    if (battleId === SHRINE_BOSS_BATTLE_ID) return 'The shrine opens a human route: find Mira at the broken bridge.'
    if (battleId === ARCHIVE_SKIRMISH_ID) return 'The lesser roots retreat. Thornheart waits south with the stolen maps.'
    if (battleId === MID_BOSS_BATTLE_ID) return 'Pip can now forage. The Skywell Lens points to the final rift.'
    if (battleId === FINAL_BOSS_BATTLE_ID) return 'The false horizon collapses into a road back to the restored home.'
    return 'The field exhales. Far east, a shrine bell answers once.'
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

  private recruitMira() {
    if (!this.flag('shrine_guardian_won')) {
      this.showToast('A scout watches the bridge: "Beat the shrine test first. Then I will believe the road is real."')
      return
    }
    if (!this.flag('mira_recruited')) {
      this.setFlag('mira_recruited')
      this.saveData.stage = 'archive'
      this.addInventory('mira_bridge_key', 1)
      this.addInventory('mana_potion', 1)
      this.setObjective(OBJECTIVES.rescuePet)
      this.saveData.party.forEach((member) => {
        member.currentHp += 12
        member.currentMp += 6
      })
      audioManager.playSfx('objective_update')
      this.showEventBanner('Mira Joins the Route', 'Mira, the bridge scout who stayed behind to mark safe stones, now travels with the party and steadies every route ahead.')
      this.showToast('Mira: I know every broken plank east of here. Scout bonus unlocked: party restored a little HP/MP and archive routes will stay marked.')
    } else {
      this.showToast('Mira: Bridge knots are set. Let us get the little bell-chime out of that thicket, then rebuild your house.')
    }
    this.persist()
  }

  private rescuePet() {
    if (!this.flag('mira_recruited')) {
      this.showToast('The thicket jingles fearfully. Someone nimble could help coax out whatever is hiding there.')
      return
    }
    if (!this.saveData.pet.unlocked) {
      this.saveData.pet = { unlocked: true, id: 'emberfox', name: 'Pip', forageReady: false, bonus: 'Finds one extra potion cache after major fights.' }
      this.setFlag('pet_pip_rescued')
      this.addInventory('health_potion', 1)
      this.setObjective(OBJECTIVES.restoreHome)
      this.createPetFollower((this.player?.x ?? this.tileCenter(PET_TILE.x)) - 28, (this.player?.y ?? this.tileCenter(PET_TILE.y)) + 18)
      audioManager.playSfx('reward_gain')
      this.showEventBanner('Pip Rescued', 'The emberfox kit curls around Nara\'s boots, then proudly trots behind the party.')
      this.showToast('Pip found a buried Potion x1. Pet benefit unlocked: extra cache after major victories.')
    } else if (this.saveData.pet.forageReady) {
      this.saveData.pet.forageReady = false
      this.addInventory('health_potion', 1)
      this.showToast('Pip digs up a hidden Potion x1 and looks impossibly pleased.')
    } else {
      this.showToast('Pip circles you, ears bright. Benefit: after major fights, Pip can sniff out a bonus potion cache here.')
    }
    this.persist()
  }

  private restoreHome() {
    const home = this.saveData.home
    if (!this.saveData.pet.unlocked) {
      this.showToast('Old Home: Cold rooms, cracked roof, empty bowls. Bring back warmth—and maybe someone small to fill them.')
      return
    }
    if (home.warmth === 0) {
      home.warmth = 1
      this.addInventory('hearth_ember', 1)
      this.setObjective(OBJECTIVES.restoreHome)
      audioManager.playSfx('save_point')
      this.showEventBanner('Home Restored: Hearth', 'The old stove catches. For the first time, Luma Quay smells like supper instead of smoke.')
      this.showToast('Mira: Your mother kept spare maps under that tile. We are not letting this place go dark again.')
    } else if (home.garden === 0) {
      home.garden = 1
      this.addInventory('health_elixir', 1)
      audioManager.playSfx('reward_gain')
      this.showEventBanner('Home Restored: Moon-Garden', 'Pip stamps the soil flat. Medicinal glassmint begins to glow.')
      this.showToast('Garden upgrade: Health Elixir x1 harvested. Resting here now feels like coming back to people.')
    } else if (home.workshop === 0) {
      home.workshop = 1
      this.addInventory('skywell_lens', 1)
      this.setObjective(OBJECTIVES.enterArchive)
      audioManager.playSfx('equipment_gain')
      this.showEventBanner('Home Restored: Map Workshop', 'The workbench lens focuses the route beyond the Verdant Archive.')
      this.drawGateBlocker(ARCHIVE_TILE, true, 'Overgrowth', 0x78d66b)
      this.showToast('Workshop upgrade: Skywell Lens crafted. The Verdant Archive lane is now visibly open.')
    } else if (this.flag('thornheart_won') && !this.flag('skywell_opened')) {
      this.setFlag('skywell_opened')
      this.setObjective(OBJECTIVES.finalBoss)
      audioManager.playResonancePulse('objective')
      audioManager.playSfx('scene_whoosh')
      this.showEventBanner('Skywell Lens Focused', 'Back at the workshop, Mira and Nara align the lens with Thornheart\'s crown and reveal the final climb.')
      this.drawGateBlocker(FINAL_BOSS_TILE, true, 'Skywell Barrier', 0xbda7ff)
      this.showToast('Skywell Barrier open: the home workshop locks a true route to the rift.')
    } else {
      this.showToast(this.flag('final_boss_won') ? 'Home: Warm hearth, living garden, open maps. Everyone has somewhere to return.' : 'Home: The hearth, garden, and map workshop are ready. Cross into the archive.')
    }
    this.persist()
  }

  private enterArchive() {
    if (this.saveData.home.workshop === 0) {
      this.showToast('Archive Overgrowth: vines cover this lane. Recruit Mira, rescue Pip, and restore the home workshop to mark a safe path.')
      return
    }
    if (!this.flag('archive_entered')) {
      this.setFlag('archive_entered')
      this.saveData.stage = 'archive'
      this.setObjective(OBJECTIVES.faceMidBoss)
      this.showAreaBanner('Verdant Archive', 'A living library of roots, ruined maps, and roads that remember footsteps.')
      this.showToast('Mira: Stay on my chalk marks. If a tree whispers your name, absolutely do not answer.')
      this.persist()
      return
    }
    if (!this.flag('archive_skirmish_won')) {
      this.startArchiveSkirmish()
      return
    }
    this.showToast(this.flag('thornheart_won') ? 'Verdant Archive: Thornheart is gone. The Skywell route shines overhead.' : 'Verdant Archive: Lesser roots are cleared. Thornheart blocks the south passage.')
  }

  private inspectShrineGate() {
    if (!this.flag('slice_complete')) {
      this.showToast('Shrine Gate: moon-silver bars block this lane. Return after the field guardian and Elder Maelin open the vow.')
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
      this.drawGateBlocker(SHRINE_GATE_TILE, true, 'Shrine Gate', 0x8bd6ff)
    } else {
      this.showToast(this.flag('shrine_guardian_won') ? 'Moonwake Gate: The guardian vow is fulfilled. The shrine keeps a road of silver fire.' : 'Moonwake Gate: The approach descends to a font and an inner seal. Prepare before touching it.')
    }
    this.persist()
    this.refreshHud()
  }

  private attuneShrineFont() {
    if (!this.flag('shrine_gate_seen')) {
      this.showToast('Shrine Lane: the visible gate is still closed. Inspect the Moonwake Gate at the top of the lane first.')
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
      this.showToast('Inner Seal: the shrine lane is blocked by the gate above. Open the Moonwake Gate first.')
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

  private startArchiveSkirmish() {
    this.startBattle(ARCHIVE_SKIRMISH_ID, ['glass_wasp', 'moss_knight', 'vinecrawler'], false, 'Archive Ambush', 'Map-eating roots drag lesser guardians into your path.')
  }

  private startMidBossBattle() {
    if (!this.flag('archive_entered')) {
      this.showToast('Root Wall: the Verdant Archive lane is still overgrown. Open the archive entrance first.')
      return
    }
    if (!this.flag('archive_skirmish_won')) {
      this.showToast('Root Wall: lesser roots still crowd the archive lane. Clear the archive ambush at the entrance marker first.')
      return
    }
    if (this.flag('thornheart_won')) {
      this.showToast('Root Wall open: Thornheart\'s stump has become a stair of green glass pointing toward the Skywell.')
      return
    }
    this.startBattle(MID_BOSS_BATTLE_ID, ['thornheart'], true, 'Thornheart Wakes', 'The archive root-crown rises to defend its stolen maps.')
  }

  private startFinalBossBattle() {
    if (!this.flag('thornheart_won')) {
      this.showToast('Skywell Barrier: the upper approach is sealed by Thornheart roots. Clear the Verdant Archive first.')
      return
    }
    if (!this.flag('skywell_opened')) {
      this.showToast('Skywell Barrier: the path glows but will not hold. Use the restored home workshop to focus the Skywell Lens.')
      return
    }
    if (this.flag('final_boss_won')) {
      this.showToast('Skywell Rift: Quiet now. The false horizon has been folded into a true road home.')
      return
    }
    this.startBattle(FINAL_BOSS_BATTLE_ID, ['cartographers_lie'], true, 'Skywell Rift', 'The final map tears open and a voice made of false routes answers.')
  }

  private startBattle(battleId: string, enemyIds: string[], isBoss: boolean, title: string, subtitle: string) {
    if (this.busy) {
      return
    }
    this.busy = true
    this.saveCurrentPosition()
    this.persist()
    audioManager.playSfx(isBoss ? 'boss_sting' : 'scene_whoosh')
    this.showEventBanner(title, subtitle)
    this.cameras.main.shake(isBoss ? 360 : 180, isBoss ? 0.007 : 0.004)
    this.time.delayedCall(isBoss ? 980 : 620, () => {
      this.cameras.main.fadeOut(420, 6, 8, 22)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('BattleScene', { battleId, enemyIds, isBoss })
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
                      : isAt(HOME_TILE)
                        ? 'Restore home base'
                        : isAt(ALLY_TILE)
                          ? 'Talk to Mira'
                          : isAt(PET_TILE)
                            ? (this.saveData.pet.unlocked ? 'Check on Pip' : 'Rescue bell-chime')
                            : isAt(ARCHIVE_TILE)
                              ? 'Enter Verdant Archive'
                              : isAt(MID_BOSS_TILE)
                                ? 'Challenge Thornheart'
                                : isAt(FINAL_BOSS_TILE)
                                  ? 'Confront final rift'
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
      stage: 'quay',
      pet: { unlocked: false, id: null, name: null, forageReady: false, bonus: null },
      home: { warmth: 0, garden: 0, workshop: 0 },
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
    this.inventoryText?.setText(`Gold ${this.saveData.gold}  |  Potion ${counts.potion}  Ether ${counts.ether}  Ember Shard ${counts.emberShard}  |  Home ${this.homeProgress()}/3${this.saveData.pet.unlocked ? '  Pip' : ''}`)
  }

  private homeProgress() {
    return this.saveData.home.warmth + this.saveData.home.garden + this.saveData.home.workshop
  }

  private getHomeName() {
    const progress = this.homeProgress()
    return progress === 0 ? 'Old Home' : progress === 3 ? 'Restored Home' : `Home ${progress}/3`
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
