import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { CHARACTERS, type CharacterStats } from '../data/characters'
import { ENEMIES_BY_ID, type EnemySkill } from '../data/enemies'
import { ITEMS_BY_ID } from '../data/items'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'
import { CombatSystem } from '../systems/CombatSystem'

const TILE_SIZE = 48
const MAP_WIDTH = 40
const MAP_HEIGHT = 30
const PLAYER_SPEED = 160
const REGULAR_ENEMY_TARGET_COUNT = 7
const ENEMY_RESPAWN_DELAY = 15000
const ENTITY_SCALE = {
  hero: 0.72,
  npc: 0.65,
  companion: 0.62,
  enemy: 0.55,
  bossEnemy: 0.75,
  object: 0.6,
} as const
type Direction = 'up' | 'down' | 'left' | 'right'
const HERO_ANIM_ROWS: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 }
type TileVisual = 'grass' | 'path' | 'water' | 'wall' | 'shrine' | 'flowers' | 'ruins' | 'bridge' | 'lava' | 'gate'
type TileDef = {
  passable: boolean
  swimPassable: boolean
  visual: TileVisual
  depth: number
  eventOnStep?: string
  eventOnInteract?: string
  connectWith?: string[]
}
const TILE_DEFS: Record<string, TileDef> = {
  G: { passable: true, swimPassable: true, visual: 'grass', depth: 0, connectWith: ['P', 'F', 'R'] },
  P: { passable: true, swimPassable: true, visual: 'path', depth: 0, connectWith: ['G', 'F', 'R'] },
  B: { passable: false, swimPassable: true, visual: 'water', depth: 0, connectWith: ['G', 'P', 'A'] },
  W: { passable: false, swimPassable: false, visual: 'wall', depth: 1, connectWith: [] },
  F: { passable: true, swimPassable: true, visual: 'flowers', depth: 0, connectWith: ['G', 'P'] },
  R: { passable: true, swimPassable: true, visual: 'ruins', depth: 0, connectWith: ['G', 'P'] },
  S: { passable: true, swimPassable: true, visual: 'shrine', depth: 0, connectWith: ['P', 'G'] },
  A: { passable: true, swimPassable: true, visual: 'bridge', depth: 0, connectWith: ['G', 'P', 'B'] },
}
const MAP_LAYOUT = [
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
  'WGGGGGGGGGWWGGGGGGGGGGGGGGGGGGGGGGGGGGGW',
  'WGGPPPPGGGWWGGGGGGGGGGPPPPPPGGGGGFFGGGGW',
  'WGGPGGPGGGWWGGGGFFFFGGPGGGGPGGGGGGGGGGGW',
  'WGGPGGPPPPPPPPPPPGGGGGPGSSSPGGFFGGGGGGGW',
  'WGGPGGGGGGWWGGGGGPGGGGPGSPSPGGGGGGRGGGGW',
  'WGGPPPPGGGWWGGGGGPPPPPPGSSSPGGGGGGGGGGGW',
  'WGGGGGPGGGWWGGGGGGGGGGPGGGGGGGFFGGGGGGGW',
  'WGGGGGPGGGWWGGGFFGGGGGPGGGGGGGGGGGGGBGGW',
  'WGGPPPPPPPPPPPPPPPPPPPPPGGGGGGRGGGGBBBGW',
  'WGGPGGGGGGWWGGGGGGGGGGGGGGGGGGGGGGBBBGGW',
  'WGGPGGGGGGWWGGGGGFFGGGGGGGGRGGGGGGGBGGGW',
  'WGGPGGGGGGWWGGGGGGGGGGGGGGGGGGGGGGGGGGGW',
  'WGGPPPPGGGWWGGGGGGGGGGGGGGGGGGGGGGGGGGGW',
  'WWWWPGWWWWWWWWWWWWPPPPPPWWWWWWWWWWWWPGWW',
  'WGGGPGGBBBBBBGGGGGPAAAPPPGGGGGGGGGPGGGGW',
  'WGBBPPBBGGGBBGGGGGPAAAPGPGGGGGGGGGPGGGGW',
  'WGBGGPGGGGGBBGGGGGPAAAPGPGGGGGGGGGPGGGGW',
  'WGBGGPPPPPPPPPPPPPPAAAPGPPPPPPPPPPPGGGGW',
  'WGBBBGGGGGGBBGGGGGPAAAPGGGGGGGGGGGPGGGGW',
  'WGGGBBGGGGBBBGGGGGPAAAPGGGGGGGGGGGPGGGGW',
  'WGGGPPPPGGGBBGGGGGPPPPPGGGGGGGGGGGPGGGGW',
  'WGGGGGGPPPPPPPPPPPGGGGGPPPPPPPGGGGPGGGGW',
  'WGGGGGGBBGGGGGGGGGRRRRGGGGGGPPPGGGPGGGGW',
  'WGGGGGBBBGGGGGGGGGGGGGGGGGGGGGPGGGPGGGGW',
  'WGGGGGGBGGGGGGGGGGGGGGGGGGGGGGPGGGPGGGGW',
  'WGGGGGGPPPPPPPPPPPPPPPPPPPPPPPPGGGPGGGGW',
  'WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGPGGFGW',
  'WGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGPPPPGW',
  'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW',
] as const
const SAVE_TILE = { x: 4, y: 6 }
const CHEST_TILE = { x: 8, y: 3 }
const GUIDE_TILE = { x: 5, y: 4 }
const ELDER_TILE = { x: 7, y: 4 }
const MERCHANT_TILE = { x: 4, y: 9 }
const MARKER_TILE = { x: 24, y: 9 }
const SIGNPOST_TILE = { x: 3, y: 13 }
const TIDE_BELL_TILE = { x: 5, y: 21 }
const MURAL_TILE = { x: 10, y: 18 }
const WATCH_LANTERN_TILE = { x: 7, y: 16 }
const SHRINE_GATE_TILE = { x: 25, y: 4 }
const SHRINE_FONT_TILE = { x: 27, y: 5 }
const SHRINE_SEAL_TILE = { x: 27, y: 6 }
const FIELD_BATTLE_TILE = { x: -100, y: -100 }
const HOME_TILE = { x: 4, y: 12 }
const ALLY_TILE = { x: 9, y: 21 }
const PET_TILE = { x: 12, y: 20 }
const ARCHIVE_TILE = { x: 20, y: 18 }
const MID_BOSS_TILE = { x: 20, y: 23 }
const FINAL_BOSS_TILE = { x: 36, y: 28 }
const TREASURE_CHESTS = [
  { id: 'quay_supply_chest', x: 8, y: 3 },
  { id: 'field_cache_chest', x: 18, y: 11 },
  { id: 'shrine_gold_chest', x: 31, y: 4 },
  { id: 'archive_relic_chest', x: 16, y: 22 },
  { id: 'skywell_hidden_chest', x: 34, y: 27 },
] as const
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


type MapEnemy = {
  id: string
  enemyId: string
  sprite: Phaser.GameObjects.Container
  body: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Arc | Phaser.GameObjects.Ellipse
  aura?: Phaser.GameObjects.Arc
  hpBar: Phaser.GameObjects.Graphics
  hpBarBg: Phaser.GameObjects.Graphics
  nameText: Phaser.GameObjects.Text
  currentHp: number
  maxHp: number
  currentMp: number
  maxMp: number
  stats: CharacterStats
  x: number
  y: number
  speed: number
  element: string
  weaknesses: string[]
  resists: string[]
  skills: EnemySkill[]
  state: 'idle' | 'chase' | 'attack' | 'hurt' | 'dead'
  aggroRange: number
  attackRange: number
  attackCooldown: number
  lastAttackTime: number
  wanderTimer: number
  wanderTarget: { x: number; y: number } | null
  hitFlashTimer: number
  isBoss: boolean
  dead: boolean
  expReward: number
  goldReward: number
  battleId?: string
}

type PartyCompanion = {
  characterId: string
  name: string
  container: Phaser.GameObjects.Container
  body: Phaser.GameObjects.Rectangle
  aura: Phaser.GameObjects.Arc
  sprite?: Phaser.GameObjects.Sprite
  nameText: Phaser.GameObjects.Text
  hpBar: Phaser.GameObjects.Graphics
  hpBarBg: Phaser.GameObjects.Graphics
  mpBar: Phaser.GameObjects.Graphics
  x: number
  y: number
  partyIndex: number
  state: 'follow' | 'idle' | 'dead'
  offsetX: number
  offsetY: number
  attackCooldown: number
  lastAttackTime: number
  lastSkillTime: number
  hitFlashTimer: number
  bobSeed: number
}

type InventoryCounts = { potion: number; ether: number; emberShard: number }
type MenuOverlay = { container: Phaser.GameObjects.Container }
type MiniMapOverlay = { container: Phaser.GameObjects.Container; graphics: Phaser.GameObjects.Graphics; visible: boolean }
type BossHud = { container: Phaser.GameObjects.Container; bar: Phaser.GameObjects.Graphics; nameText: Phaser.GameObjects.Text }
type HudPanel = { graphics: Phaser.GameObjects.Graphics; nameText: Phaser.GameObjects.Text; hpText: Phaser.GameObjects.Text; mpText: Phaser.GameObjects.Text; goldText: Phaser.GameObjects.Text; companionTexts: Phaser.GameObjects.Text[]; swordTexts: Phaser.GameObjects.Text[]; portraits: Phaser.GameObjects.Arc[] }
type TreasureChest = { id: string; tile: { x: number; y: number }; base: Phaser.GameObjects.Rectangle; lid: Phaser.GameObjects.Rectangle; trim: Phaser.GameObjects.Rectangle; opened: boolean }
type GroundLoot = {
  x: number
  y: number
  itemId: string
  quantity: number
  sprite: Phaser.GameObjects.Arc
  label: Phaser.GameObjects.Text
  bobTween: Phaser.Tweens.Tween
  kind: 'item' | 'gold' | 'exp'
  expireTween?: Phaser.Tweens.Tween
}
type RealtimeSkill = { name: string; mpCost: number; cooldown: number; color: number; effect: 'emberSlash' | 'tidalHeal' | 'stoneGuard' | 'windStep' }

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private player?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle
  private playerShadow?: Phaser.GameObjects.Ellipse
  private petFollower?: Phaser.GameObjects.Arc | Phaser.GameObjects.Image | Phaser.GameObjects.Container
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'e' | 'space' | 'shift' | 'q' | 'm' | 't' | 'h' | 'f' | 'one' | 'two' | 'three' | 'four' | 'escape', Phaser.Input.Keyboard.Key>
  private walls = new Set<string>()
  private facing: Direction = 'down'
  private saveNoticeShown = false
  private busy = false
  private initData: OverworldInitData = {}
  private saveData!: SaveData
  private objectiveText?: Phaser.GameObjects.Text
  private objectivePanel?: Phaser.GameObjects.Rectangle
  private hudPanel?: HudPanel
  private inventoryText?: Phaser.GameObjects.Text
  private promptText?: Phaser.GameObjects.Text
  private areaText?: Phaser.GameObjects.Text
  private menuOverlay?: MenuOverlay
  private miniMap?: MiniMapOverlay
  private helpOverlay?: Phaser.GameObjects.Container
  private toast?: Phaser.GameObjects.Container
  private touchMove: { x: number; y: number } | null = null
  private touchButtons: Phaser.GameObjects.GameObject[] = []
  private activeBanners: Phaser.GameObjects.GameObject[] = []
  private routeClarityStates: Record<string, 'open' | 'closed'> = {}
  private emberParticles: Phaser.GameObjects.Arc[] = []
  private waterShimmers: Phaser.GameObjects.Rectangle[] = []
  private homeVisuals: Phaser.GameObjects.GameObject[] = []
  private npcActors: Partial<Record<'guide' | 'elder' | 'peddler' | 'mira', Phaser.GameObjects.GameObject>> = {}
  private miraCompanion?: Phaser.GameObjects.Container
  private companions: PartyCompanion[] = []
  private companionHudGraphics?: Phaser.GameObjects.Graphics
  private lastArea: string | null = null
  private discoveredAreas = new Set<string>()
  private dustCooldown = 0
  private mapEnemies: MapEnemy[] = []
  private playerHpBarBg?: Phaser.GameObjects.Graphics
  private playerHpBar?: Phaser.GameObjects.Graphics
  private playerMpBar?: Phaser.GameObjects.Graphics
  private playerHpText?: Phaser.GameObjects.Text
  private playerMpText?: Phaser.GameObjects.Text
  private playerXpBar?: Phaser.GameObjects.Graphics
  private bossHud?: BossHud

  private uiWidth(fraction: number, maxPx: number = 800): number {
    return Math.min(this.scale.width * fraction, maxPx)
  }

  private uiHeight(fraction: number, maxPx: number = 600): number {
    return Math.min(this.scale.height * fraction, maxPx)
  }
  private playerInvulnerableUntil = 0
  private dashUntil = 0
  private nextDashAt = 0
  private nextPlayerAttackAt = 0
  private killCount = 0
  private groundLoot: GroundLoot[] = []
  private treasureChests: TreasureChest[] = []
  private respawnTimer?: Phaser.Time.TimerEvent
  private skillBar?: Phaser.GameObjects.Container
  private skillCooldownGraphics: Phaser.GameObjects.Graphics[] = []
  private skillTexts: Phaser.GameObjects.Text[] = []
  private skillSlotFrames: Phaser.GameObjects.Rectangle[] = []
  private killCounterText?: Phaser.GameObjects.Text
  private comboText?: Phaser.GameObjects.Text
  private dashReadyText?: Phaser.GameObjects.Text
  private levelText?: Phaser.GameObjects.Text
  private shieldArc?: Phaser.GameObjects.Arc
  private isBlocking = false
  private stoneGuardUntil = 0
  private skillReadyAt = [0, 0, 0, 0]
  private comboCount = 0
  private lastComboHitAt = 0
  private lastDashAfterimageAt = 0
  private pipBobTween?: Phaser.Tweens.Tween
  private homeWarmthUsedThisVisit = false
  private homeGardenUsedThisVisit = false
  private lastForageTime = 0
  private pipIdleAngle = 0
  private cameraZoom = 1

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
    this.emberParticles = []
    this.waterShimmers = []
    this.homeVisuals = []
    this.npcActors = {}
    this.miraCompanion = undefined
    this.companions.forEach((companion) => {
      companion.container.destroy()
      companion.hpBar.destroy()
      companion.hpBarBg.destroy()
      companion.mpBar.destroy()
    })
    this.companions = []
    this.companionHudGraphics?.destroy()
    this.companionHudGraphics = undefined
    this.lastArea = null
    this.discoveredAreas = new Set()
    this.dustCooldown = 0
    this.mapEnemies = []
    this.groundLoot.forEach((loot) => this.destroyGroundLoot(loot))
    this.groundLoot = []
    this.respawnTimer?.destroy()
    this.respawnTimer = undefined
    this.playerInvulnerableUntil = 0
    this.dashUntil = 0
    this.nextDashAt = 0
    this.nextPlayerAttackAt = 0
    this.killCount = 0
    this.skillReadyAt = [0, 0, 0, 0]
    this.stoneGuardUntil = 0
    this.isBlocking = false
    this.comboCount = 0
    this.lastComboHitAt = 0
    this.lastDashAfterimageAt = 0
    this.skillCooldownGraphics = []
    this.skillTexts = []
    this.skillBar = undefined
    this.killCounterText = undefined
    this.comboText = undefined
    this.dashReadyText = undefined
    this.playerXpBar = undefined
    this.bossHud = undefined
    this.treasureChests = []
    this.levelText = undefined
    this.shieldArc = undefined
    this.pipBobTween = undefined
    this.homeWarmthUsedThisVisit = false
    this.homeGardenUsedThisVisit = false
    this.lastForageTime = this.time.now
    this.objectiveText = undefined
    this.inventoryText = undefined
    this.promptText = undefined
    this.areaText = undefined
    this.menuOverlay = undefined
    this.miniMap = undefined
    this.helpOverlay = undefined

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
    this.playerShadow = this.add.ellipse(startX, startY + 18, 44, 18, 0x101014, 0.32).setDepth(10).setStrokeStyle(3, 0xfff1a8, 0.72)
    this.tweens.add({ targets: this.playerShadow, scaleX: 1.16, scaleY: 1.08, alpha: 0.62, yoyo: true, repeat: -1, duration: 1050, ease: 'Sine.easeInOut' })
    this.player = this.createPlayer(startX, startY)
    this.createPetFollower(startX - 28, startY + 18)
    this.createMiraCompanion(startX + 28, startY + 18)
    this.companions = [this.createCompanion(1), this.createCompanion(2)].filter((companion): companion is PartyCompanion => Boolean(companion))
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      e: Phaser.Input.Keyboard.KeyCodes.E,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      q: Phaser.Input.Keyboard.KeyCodes.Q,
      m: Phaser.Input.Keyboard.KeyCodes.M,
      t: Phaser.Input.Keyboard.KeyCodes.T,
      h: Phaser.Input.Keyboard.KeyCodes.H,
      f: Phaser.Input.Keyboard.KeyCodes.F,
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      escape: Phaser.Input.Keyboard.KeyCodes.ESC,
    }) as Record<'w' | 'a' | 's' | 'd' | 'e' | 'space' | 'shift' | 'q' | 'm' | 't' | 'h' | 'f' | 'one' | 'two' | 'three' | 'four' | 'escape', Phaser.Input.Keyboard.Key>

    this.spawnEnemiesForStage()
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => { if (!pointer.event.defaultPrevented && !this.menuOverlay) this.performPlayerAttack(pointer.worldX, pointer.worldY) })
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => this.handleCameraZoom(deltaY))
    this.createHud()
    this.createMiniMap()
    this.createTouchControls()
    this.refreshHud()
    this.cameras.main.fadeIn(420, 5, 6, 18)
    this.showAreaBanner('Luma Quay', 'A harbor village holding its breath beneath emberlit glass.')
    if (!continuedSave && !this.initData.continueGame) {
      this.time.delayedCall(850, () => this.showFirstSessionGuide())
    }
    this.notifyWorkshopBuff()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameraZoom = 1
    this.cameras.main.setZoom(this.cameraZoom)
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

    this.isBlocking = this.keys.f.isDown && (velocityX !== 0 || velocityY !== 0 || !this.menuOverlay)

    if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      this.startDash()
    }
    const dashing = this.time.now < this.dashUntil
    const isMoving = velocityX !== 0 || velocityY !== 0
    const speedMultiplier = (dashing ? 2.5 : 1) * (this.isBlocking ? 0.4 : 1)
    this.movePlayer(velocityX * seconds * speedMultiplier, velocityY * seconds * speedMultiplier)
    if (dashing && isMoving) this.updateDashTrail()
    this.updatePlayerAnimation(isMoving)
    this.playerShadow.setPosition(this.player.x, this.player.y + 18)
    this.updateWalkDust(delta, isMoving)
    this.updatePetFollower(isMoving)
    this.updateMiraCompanion()
    this.updateCompanions()
    this.updateMiraNpcFacing()
    this.updateMiniMap()
    this.updateAreaPop()
    this.checkSavePoint()
    this.checkHomeBenefits()
    this.checkPetForage()
    this.updateMapEnemies(delta)
    this.updateGroundLoot()
    this.updateShieldVisual()
    this.updateSkillHud()
    this.updateComboHud()
    this.updatePlayerBars()
    this.updateInteractionPrompt()

    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      this.openMenu()
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.m) || Phaser.Input.Keyboard.JustDown(this.keys.t)) {
      this.toggleMiniMap()
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.h)) {
      this.openHelpOverlay()
      return
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.q)) {
      this.useHealthPotion()
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) this.useRealtimeSkill(0)
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) this.useRealtimeSkill(1)
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) this.useRealtimeSkill(2)
    if (Phaser.Input.Keyboard.JustDown(this.keys.four)) this.useRealtimeSkill(3)

    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.isBlocking) {
      this.performPlayerAttack()
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      this.interact()
    }
  }

  private createMap() {
    const useTileset = false
    void useTileset

    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const layoutTile = MAP_LAYOUT[tileY][tileX]
        const def = TILE_DEFS[layoutTile] ?? TILE_DEFS.G
        const blocksTravel = !this.checkGateOverrides(tileX, tileY, def)
        this.renderTile(layoutTile, def, tileX, tileY)
        if (blocksTravel) {
          this.walls.add(this.tileKey(tileX, tileY))
        }
      }
    }

    this.createWaterShimmer()
    this.drawAreaPolish()
  }

  private checkGateOverrides(tileX: number, tileY: number, def: TileDef): boolean {
    if (tileX === SHRINE_GATE_TILE.x && tileY === SHRINE_GATE_TILE.y && !this.flag('shrine_gate_seen')) return true
    return def.passable
  }

  private renderTile(char: string, def: TileDef, tileX: number, tileY: number) {
    const x = tileX * TILE_SIZE
    const y = tileY * TILE_SIZE
    const areaTint = tileX <= 6 && tileY >= 9 ? 0x4f9342 : tileX >= 14 && tileY <= 8 ? 0x355c75 : tileX >= 12 ? 0x526b3c : tileY >= 10 ? 0x3f7c43 : 0x3d8b37
    if (def.visual === 'path' || def.visual === 'ruins') {
      this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, def.visual === 'ruins' ? 0x827769 : 0xc4a882).setOrigin(0).setDepth(def.depth)
      this.drawPathDetails(x, y, tileX, tileY)
    } else if (def.visual === 'water') {
      this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x1e64a8).setOrigin(0).setDepth(def.depth)
      this.add.ellipse(x + 24, y + 24, 38, 34, 0x154f8e, 0.28).setDepth(def.depth + 0.02)
      this.drawWaterDetails(x, y, tileX, tileY)
    } else if (def.visual === 'wall') {
      this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x5a4a3a).setOrigin(0).setDepth(def.depth)
      this.drawWallDetails(x, y, tileX, tileY)
    } else if (def.visual === 'shrine') {
      this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x8d8374).setOrigin(0).setDepth(def.depth)
      this.drawShrineDetails(x, y, tileX, tileY)
    } else if (def.visual === 'bridge') {
      this.drawBridgeTile(x, y, def.depth)
    } else {
      this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, areaTint).setOrigin(0).setDepth(def.depth)
      this.drawGrassDetails(x, y, tileX, tileY, areaTint)
      if (char === 'F') this.drawFlowerDetails(x, y, tileX, tileY)
    }
    this.drawTileBorders(char, x, y, tileX, tileY, def.depth)
  }

  private drawGrassDetails(x: number, y: number, tileX: number, tileY: number, areaTint: number) {
    const shade = [0x69a64f, 0x2f7133, 0x86bd5d][(tileX * 17 + tileY * 23) % 3]
    this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, shade, 0.08).setOrigin(0).setDepth(0.03)
    this.add.rectangle(x, y + TILE_SIZE - 7, TILE_SIZE, 7, areaTint, 0.18).setOrigin(0).setDepth(0.04)
    for (let index = 0; index < 4; index += 1) {
      const bladeX = x + 7 + ((tileX * 13 + tileY * 7 + index * 12) % 34)
      const bladeY = y + 9 + ((tileX * 5 + tileY * 19 + index * 9) % 28)
      this.add.triangle(bladeX, bladeY, 0, 7, 2, 0, 4, 7, shade, 0.34).setRotation(Phaser.Math.DegToRad(((tileX + tileY + index) % 3 - 1) * 14)).setDepth(0.12)
    }
    if ((tileX * 31 + tileY * 11) % 17 === 0) this.drawBush(x + 24, y + 25, 0.16)
    if ((tileX * 7 + tileY * 29) % 10 < 3) this.drawRock(x + 16 + ((tileX * 3) % 14), y + 28, 0.16)
  }

  private drawPathDetails(x: number, y: number, tileX: number, tileY: number) {
    this.add.rectangle(x, y, 4, TILE_SIZE, 0x5f8d4a, 0.16).setOrigin(0).setDepth(0.08)
    this.add.rectangle(x + TILE_SIZE - 4, y, 4, TILE_SIZE, 0x5f8d4a, 0.16).setOrigin(0).setDepth(0.08)
    for (let index = 0; index < 5; index += 1) {
      const pebbleX = x + 8 + ((tileX * 9 + index * 13) % 31)
      const pebbleY = y + 10 + ((tileY * 15 + index * 11) % 27)
      this.add.ellipse(pebbleX, pebbleY, 4 + (index % 3), 2 + (index % 2), index % 2 ? 0xe0c899 : 0x8d7657, 0.28).setDepth(0.14)
    }
    if ((tileX * 5 + tileY * 11) % 4 === 0) this.add.ellipse(x + 18, y + 28, 8, 3, 0x6e563d, 0.18).setAngle(-12).setDepth(0.15)
  }

  private drawWaterDetails(x: number, y: number, tileX: number, tileY: number) {
    this.add.rectangle(x + 3, y + 3, TILE_SIZE - 6, 2, 0x80cfff, 0.16).setOrigin(0).setDepth(0.08)
    for (let index = 0; index < 2; index += 1) {
      const wave = this.add.arc(x + 12 + index * 20, y + 17 + ((tileX + tileY + index) % 3) * 7, 8, 200, 340, false, 0x9bdcff, 0).setStrokeStyle(2, 0xc7f9ff, 0.22).setDepth(0.18)
      this.tweens.add({ targets: wave, x: wave.x + 5, alpha: 0.06, yoyo: true, repeat: -1, duration: 1500 + index * 250, ease: 'Sine.easeInOut' })
    }
    if ((tileX * 19 + tileY * 7) % 5 === 0) {
      const sparkle = this.add.circle(x + 12 + ((tileX * 11) % 24), y + 14 + ((tileY * 13) % 22), 1.4, 0xffffff, 0.36).setDepth(0.2)
      this.tweens.add({ targets: sparkle, alpha: 0.04, scale: ENTITY_SCALE.object * 2.5, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })
    }
  }

  private drawWallDetails(x: number, y: number, tileX: number, tileY: number) {
    this.add.rectangle(x, y + TILE_SIZE - 10, TILE_SIZE, 10, 0x241b16, 0.28).setOrigin(0).setDepth(1.22)
    this.add.rectangle(x, y, TILE_SIZE, 3, 0x9b846c, 0.34).setOrigin(0).setDepth(1.24)
    this.add.rectangle(x + 2, y + 7, TILE_SIZE - 4, 2, 0x8a745f, 0.28).setOrigin(0).setDepth(1.23)
    this.add.rectangle(x + 2, y + 24, TILE_SIZE - 4, 2, 0x31271f, 0.22).setOrigin(0).setDepth(1.23)
    this.add.rectangle(x + ((tileX + tileY) % 2 ? 15 : 30), y + 9, 2, 15, 0x34291f, 0.25).setDepth(1.24)
    this.add.rectangle(x + ((tileX + tileY) % 2 ? 30 : 14), y + 26, 2, 13, 0x34291f, 0.22).setDepth(1.24)
    if ((tileX * 5 + tileY) % 5 === 0) this.drawBush(x + 24, y + 40, 1.31)
  }

  private drawFlowerDetails(x: number, y: number, tileX: number, tileY: number) {
    const flowerColors = [0xffd166, 0xff7aa2, 0xc7f9ff, 0xffffff, 0xf3a0ff]
    for (let index = 0; index < 5; index += 1) {
      const flowerX = x + 9 + ((tileX * 9 + tileY * 5 + index * 11) % 30)
      const flowerY = y + 10 + ((tileX * 4 + tileY * 8 + index * 7) % 26)
      this.add.line(flowerX, flowerY + 4, 0, 0, 0, 5, 0x2d722d, 0.36).setDepth(0.18)
      this.add.circle(flowerX, flowerY, 2, flowerColors[index], 0.9).setDepth(0.22)
    }
    if ((tileX * 13 + tileY * 17) % 20 < 3) {
      this.add.ellipse(x + 30, y + 12, 5, 3, 0xffe47a, 0.72).setDepth(0.25)
      this.add.circle(x + 27, y + 11, 2, 0xc7f9ff, 0.48).setDepth(0.26)
      this.add.circle(x + 33, y + 11, 2, 0xc7f9ff, 0.48).setDepth(0.26)
    }
  }

  private drawShrineDetails(x: number, y: number, tileX: number, tileY: number) {
    this.add.circle(x + 24, y + 24, 14, 0x1a5f74, 0.24).setStrokeStyle(2, 0x9ff3ff, 0.62).setDepth(0.22)
    this.add.arc(x + 24, y + 24, 8, 25, 320, false, 0x9ff3ff, 0).setStrokeStyle(2, 0xc7f9ff, 0.5).setDepth(0.24)
    for (let index = 0; index < 2; index += 1) {
      const mote = this.add.circle(x + 16 + ((tileX * 7 + index * 13) % 18), y + 14 + ((tileY * 9 + index * 11) % 20), 1.5, 0x9ff3ff, 0.32).setDepth(0.28)
      this.tweens.add({ targets: mote, y: mote.y - 8, alpha: 0.06, yoyo: true, repeat: -1, duration: 1600 + index * 300, ease: 'Sine.easeInOut' })
    }
  }

  private drawBridgeTile(x: number, y: number, depth: number) {
    this.add.rectangle(x, y + 38, TILE_SIZE, 8, 0x1b120d, 0.28).setOrigin(0).setDepth(depth)
    this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x8a5a32).setOrigin(0).setDepth(depth + 0.02)
    for (let index = 0; index < 5; index += 1) this.add.rectangle(x + 2, y + index * 10, TILE_SIZE - 4, 7, index % 2 ? 0x9d6a3d : 0x704522, 0.95).setOrigin(0).setDepth(depth + 0.06)
    this.add.rectangle(x + 4, y, 4, TILE_SIZE, 0x4b2f1d, 0.95).setOrigin(0).setDepth(depth + 0.12)
    this.add.rectangle(x + TILE_SIZE - 8, y, 4, TILE_SIZE, 0x4b2f1d, 0.95).setOrigin(0).setDepth(depth + 0.12)
  }

  private drawTileBorders(char: string, x: number, y: number, tileX: number, tileY: number, depth: number) {
    const neighbors = [
      { dx: 0, dy: -1, side: 'top' }, { dx: 1, dy: 0, side: 'right' }, { dx: 0, dy: 1, side: 'bottom' }, { dx: -1, dy: 0, side: 'left' },
    ] as const
    neighbors.forEach((neighbor) => {
      const other = MAP_LAYOUT[tileY + neighbor.dy]?.[tileX + neighbor.dx]
      if (!other || other === char) return
      const pair = `${char}${other}`
      const color = pair.includes('B') && pair.includes('W') ? 0x8b8d86 : pair.includes('B') ? 0xd6bd83 : pair.includes('W') ? 0x234421 : 0x9b7a4e
      const alpha = pair.includes('B') ? 0.48 : 0.28
      if (neighbor.side === 'top') this.add.rectangle(x + 2, y, TILE_SIZE - 4, 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'bottom') this.add.rectangle(x + 2, y + TILE_SIZE - 4, TILE_SIZE - 4, 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'left') this.add.rectangle(x, y + 2, 4, TILE_SIZE - 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'right') this.add.rectangle(x + TILE_SIZE - 4, y + 2, 4, TILE_SIZE - 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
    })
  }

  private drawBush(x: number, y: number, depth: number) {
    this.add.circle(x - 7, y + 2, 7, 0x2f7d3f, 0.92).setDepth(depth)
    this.add.circle(x, y - 2, 9, 0x3fa456, 0.92).setDepth(depth)
    this.add.circle(x + 8, y + 3, 7, 0x256d36, 0.92).setDepth(depth)
  }

  private drawRock(x: number, y: number, depth: number) {
    this.add.ellipse(x, y, 14, 9, 0x7c8076, 0.72).setDepth(depth).setStrokeStyle(1, 0xb8b49f, 0.28)
    this.add.ellipse(x - 2, y - 2, 7, 3, 0xc0c6b5, 0.18).setDepth(depth + 0.01)
  }

  private createWaterShimmer() {
    const visited = new Set<string>()
    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        if (MAP_LAYOUT[tileY][tileX] !== 'B' || visited.has(this.tileKey(tileX, tileY))) {
          continue
        }
        let width = 1
        while (tileX + width < MAP_WIDTH && MAP_LAYOUT[tileY][tileX + width] === 'B') {
          width += 1
        }
        for (let index = 0; index < width; index += 1) {
          visited.add(this.tileKey(tileX + index, tileY))
        }
        const shimmer = this.add.rectangle(tileX * TILE_SIZE, tileY * TILE_SIZE + 14, width * TILE_SIZE, 16, 0x9bdcff, 0.04).setOrigin(0).setDepth(1.35).setName('ambient:water-shimmer')
        this.waterShimmers.push(shimmer)
        this.tweens.add({ targets: shimmer, alpha: 0.08, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut' })
      }
    }
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
    this.add.text(x, y + 24, label, { color: '#fff7d5', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#090b12bb', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(2.6).setName(`landmark:${label}`)
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
    const useBgImage = false
    if (useBgImage && hasTexture(this, GENERATED_ASSETS.overworldBg)) {
      this.add.image((MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2, GENERATED_ASSETS.overworldBg).setDisplaySize(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE).setDepth(-10)
    }
    this.add.rectangle(0, 0, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 3, 0x142846).setOrigin(0).setDepth(-10)
    this.add.rectangle(0, (MAP_HEIGHT * TILE_SIZE) / 3, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 3, 0x405884, 0.72).setOrigin(0).setDepth(-9.9)
    this.add.rectangle(0, (MAP_HEIGHT * TILE_SIZE) / 2, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 2, 0x355d36, 0.34).setOrigin(0).setDepth(-9.8)
    for (let index = 0; index < 5; index += 1) {
      const cloudX = 170 + index * 360
      const cloudY = 70 + (index % 3) * 46
      this.add.ellipse(cloudX, cloudY, 90, 26, 0xffffff, 0.13).setDepth(-8)
      this.add.ellipse(cloudX - 34, cloudY + 5, 54, 20, 0xffffff, 0.10).setDepth(-8)
      this.add.ellipse(cloudX + 38, cloudY + 4, 62, 22, 0xf4f1ff, 0.09).setDepth(-8)
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
    for (let i = 0; i < 18; i++) {
      const ember = this.add.circle(Phaser.Math.Between(36, MAP_WIDTH * TILE_SIZE - 36), Phaser.Math.Between(48, MAP_HEIGHT * TILE_SIZE - 48), Phaser.Math.FloatBetween(1, 2.5), Phaser.Utils.Array.GetRandom([0xffd36e, 0x9ff3ff, 0x78d66b]), Phaser.Math.FloatBetween(0.05, 0.16)).setDepth(7)
      this.tweens.add({
        targets: ember,
        x: `+=${Phaser.Math.Between(-26, 26)}`,
        y: `+=${Phaser.Math.Between(-36, -12)}`,
        alpha: Phaser.Math.FloatBetween(0.02, 0.12),
        yoyo: true,
        repeat: -1,
        duration: Phaser.Math.Between(3600, 7200),
        delay: Phaser.Math.Between(0, 1800),
        ease: 'Sine.easeInOut',
      })
    }
    for (let i = 0; i < Phaser.Math.Between(5, 8); i += 1) {
      this.createFloatingEmber(Phaser.Math.Between(0, 2500))
    }
  }

  private createFloatingEmber(delay = 0) {
    const ember = this.add.circle(Phaser.Math.Between(24, MAP_WIDTH * TILE_SIZE - 24), MAP_HEIGHT * TILE_SIZE + Phaser.Math.Between(8, 120), Phaser.Math.FloatBetween(1.8, 3.5), Phaser.Utils.Array.GetRandom([0xffa43a, 0xffd36e, 0xfff1a8]), Phaser.Math.FloatBetween(0.2, 0.5)).setDepth(8).setName('ambient:floating-ember')
    this.emberParticles.push(ember)
    this.tweens.add({
      targets: ember,
      x: ember.x + Phaser.Math.Between(-24, 24),
      y: -24,
      alpha: 0.08,
      duration: Phaser.Math.Between(3000, 7000),
      delay,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.emberParticles = this.emberParticles.filter((particle) => particle !== ember)
        ember.destroy()
        if (this.scene.isActive()) {
          this.createFloatingEmber(Phaser.Math.Between(200, 1200))
        }
      },
    })
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
    this.drawHomeUpgradeVisuals()
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
    TREASURE_CHESTS.forEach((chest) => this.drawTreasureChest(chest.id, chest.x, chest.y))
  }

  private drawTreasureChest(id: string, tileX: number, tileY: number) {
    const x = this.tileCenter(tileX)
    const y = this.tileCenter(tileY)
    const opened = this.saveData.openedChests.includes(id) || this.flag(`chest_${id}`)
    this.add.ellipse(x, y + 14, 34, 12, 0x101014, 0.28).setDepth(3.5)
    const base = this.add.rectangle(x, y + 5, 34, 18, opened ? 0x49351e : 0x8a5a21, opened ? 0.62 : 0.95).setStrokeStyle(2, 0xf0c040, 0.82).setDepth(4)
    const lid = this.add.rectangle(x, y - 8, 34, 12, opened ? 0x3e2c19 : 0x7a451a, opened ? 0.5 : 0.95).setStrokeStyle(2, 0xffd166, 0.86).setDepth(4.1)
    const trim = this.add.rectangle(x, y + 2, 5, 26, 0xf0c040, opened ? 0.45 : 0.9).setDepth(4.2)
    this.add.rectangle(x - 11, y - 8, 5, 5, 0xffe08a, opened ? 0.35 : 0.76).setDepth(4.3)
    this.add.rectangle(x + 11, y - 8, 5, 5, 0xffe08a, opened ? 0.35 : 0.76).setDepth(4.3)
    if (opened) lid.y -= 7
    this.treasureChests.push({ id, tile: { x: tileX, y: tileY }, base, lid, trim, opened })
  }

  private drawNpc(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    this.add.ellipse(x, y + 18, 34, 13, 0x101014, 0.32).setDepth(3.5)
    const npc = hasTexture(this, assetKey)
      ? this.add.sprite(x, y, assetKey, 0).setScale(ENTITY_SCALE.npc).setDepth(4)
      : this.createProceduralNpc(x, y, label)
    if (npc instanceof Phaser.GameObjects.Sprite) npc.play(`idle-${assetKey}`)
    const actorKey = this.getNpcActorKey(label)
    if (actorKey) {
      this.npcActors[actorKey] = npc
    }
    this.applyNpcIdleBehavior(npc, label, tile)
  }

  private createProceduralNpc(x: number, y: number, label: string): Phaser.GameObjects.Container {
    const container = this.add.container(x, y).setDepth(4)
    const isElder = label === 'Elder'
    const isPeddler = label === 'Peddler'
    const proceduralScale = ENTITY_SCALE.npc / 0.55
    const outfit = isElder ? 0xd8d5ca : isPeddler ? 0x6e4728 : 0x2e8f8a
    const trim = isElder ? 0xf5f1df : isPeddler ? 0x9c6b3d : 0x75d7c8
    const hair = isElder ? 0xd9d9d9 : isPeddler ? 0x3a2518 : 0x6b3b22
    container.add(this.add.ellipse(0, -17, 15, 16, 0xd9a06f, 1).setStrokeStyle(1, 0x2a1a12, 0.35))
    container.add(this.add.arc(0, -22, 8, 190, 350, false, hair, 1))
    container.add(this.add.rectangle(0, 2, isElder ? 26 : 22, isElder ? 34 : 30, outfit, 0.98).setStrokeStyle(2, trim, 0.62))
    container.add(this.add.rectangle(-7, 18, 5, 12, 0x2c221b, 0.9))
    container.add(this.add.rectangle(7, 18, 5, 12, 0x2c221b, 0.9))
    if (isElder) {
      container.add(this.add.rectangle(16, 1, 3, 42, 0x7b5634, 0.95))
      container.add(this.add.circle(16, -22, 4, 0x9ff3ff, 0.75))
    } else if (isPeddler) {
      container.add(this.add.rectangle(13, 1, 9, 22, 0x4a321d, 0.92).setStrokeStyle(1, 0xd2a05d, 0.5))
      container.add(this.add.rectangle(-12, 0, 5, 18, 0x4a321d, 0.9))
    } else {
      container.add(this.add.rectangle(-11, 1, 5, 20, 0x1d5f5e, 0.9))
      container.add(this.add.rectangle(11, 1, 5, 20, 0x1d5f5e, 0.9))
    }
    return container.setScale(proceduralScale)
  }

  private getNpcActorKey(label: string): 'guide' | 'elder' | 'peddler' | 'mira' | null {
    if (label === 'Guide Rin') return 'guide'
    if (label === 'Elder') return 'elder'
    if (label === 'Peddler') return 'peddler'
    if (label === 'Mira') return 'mira'
    return null
  }

  private applyNpcIdleBehavior(npc: Phaser.GameObjects.GameObject, label: string, tile: { x: number; y: number }) {
    if (label === 'Guide Rin') {
      this.tweens.add({ targets: npc, x: this.tileCenter(tile.x + 2), yoyo: true, repeat: -1, duration: 2600, hold: 900, ease: 'Sine.easeInOut' })
    } else if (label === 'Peddler') {
      this.tweens.add({ targets: npc, angle: 3, y: '-=2', yoyo: true, repeat: -1, duration: 880, ease: 'Sine.easeInOut' })
    } else if (label === 'Elder') {
      this.tweens.add({ targets: npc, angle: -2, x: '-=3', yoyo: true, repeat: -1, duration: 1800, hold: 5200, repeatDelay: 4200, ease: 'Sine.easeInOut' })
    } else {
      this.tweens.add({ targets: npc, y: '-=1.5', yoyo: true, repeat: -1, duration: 1600 + tile.x * 35, ease: 'Sine.easeInOut' })
    }
  }

  private drawHomeUpgradeVisuals() {
    const x = this.tileCenter(HOME_TILE.x)
    const y = this.tileCenter(HOME_TILE.y)
    const home = this.saveData.home
    const progress = this.homeProgress()
    if (home.warmth > 0) {
      this.homeVisuals.push(this.add.ellipse(x, y + 18, 62, 28, 0xff8a32, 0.28).setDepth(2.75).setName('home:warmth-glow'))
      this.homeVisuals.push(this.add.rectangle(HOME_TILE.x * TILE_SIZE, HOME_TILE.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0xffb347, 0.16).setOrigin(0).setDepth(0.42).setName('home:warmth-tint'))
    }
    if (home.garden > 0) {
      for (const offset of [{ x: -22, y: 10 }, { x: -14, y: 22 }, { x: 18, y: 18 }, { x: 26, y: 4 }, { x: 3, y: 26 }]) {
        this.homeVisuals.push(this.add.circle(x + offset.x, y + offset.y, 3, 0x72d66b, 0.92).setDepth(3.2).setName('home:garden-herb'))
      }
    }
    if (home.workshop > 0) {
      const lens = this.add.polygon(x, y - 30, [0, -10, 11, 0, 0, 10, -11, 0], 0xffd36e, 0.92).setDepth(4.2).setName('home:workshop-lens')
      this.homeVisuals.push(lens)
      this.tweens.add({ targets: lens, angle: 10, alpha: 0.68, yoyo: true, repeat: -1, duration: 1250, ease: 'Sine.easeInOut' })
    }
    const label = this.add.text(x, y - 47, `Home ${progress}/3`, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#070914bb', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(4.5).setName('home:progress-label')
    this.homeVisuals.push(label)
  }

  private refreshHomeUpgradeVisuals() {
    this.homeVisuals.forEach((visual) => visual.destroy())
    this.homeVisuals = []
    this.drawHomeUpgradeVisuals()
  }

  private drawMarker(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.tileCenter(tile.x)
    const y = this.tileCenter(tile.y)
    void label
    this.add.ellipse(x, y + 16, 34, 12, 0x101014, 0.28).setDepth(2.5)
    const marker = hasTexture(this, assetKey)
      ? this.add.image(x, y, assetKey).setScale(ENTITY_SCALE.object).setDepth(3)
      : this.add.rectangle(x, y, 34, 34, 0x888888, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
    this.tweens.add({ targets: marker, scale: hasTexture(this, assetKey) ? ENTITY_SCALE.object * 1.05 : ENTITY_SCALE.object * 1.73, yoyo: true, repeat: -1, duration: 1350, ease: 'Sine.easeInOut' })
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      const player = this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setScale(ENTITY_SCALE.hero).setDepth(11)
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
    const pip = this.add.container(x, y).setDepth(10.5).setName('companion:pip')
    pip.add(this.add.circle(0, 0, 12, 0xf2d16b, 0.2))
    pip.add(this.add.circle(0, 0, 6, 0xf2d16b, 0.95).setStrokeStyle(2, 0xfff1a8, 0.72))
    pip.add(this.add.circle(-2, -2, 2, 0xfff4df, 0.92))
    this.petFollower = pip
    this.pipBobTween = this.tweens.add({ targets: pip, y: y - 7, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' })
  }

  private updatePetFollower(isMoving: boolean) {
    if (!this.petFollower || !this.player) {
      return
    }
    this.pipIdleAngle += isMoving ? 0.025 : 0.055
    const orbitX = isMoving ? 0 : Math.cos(this.pipIdleAngle) * 28
    const orbitY = isMoving ? 0 : Math.sin(this.pipIdleAngle) * 12
    const side = this.facing === 'left' ? 26 : this.facing === 'right' ? -26 : -20
    this.petFollower.x += (this.player.x + side + orbitX - this.petFollower.x) * 0.075
    this.petFollower.y += (this.player.y + 18 + orbitY - this.petFollower.y) * 0.075
    if (this.pipBobTween) {
      this.pipBobTween.setTimeScale(isMoving ? 1.45 : 1)
    }
  }

  private createMiraCompanion(x: number, y: number) {
    if (!this.flag('mira_recruited') || this.busy) {
      this.miraCompanion = undefined
      return
    }
    const companion = this.add.container(x, y).setDepth(10.45).setName('companion:mira')
    companion.add(this.add.circle(0, 0, 11, 0x7fd8ff, 0.92).setStrokeStyle(2, 0xfff1a8, 0.7))
    companion.add(this.add.text(0, -23, 'Mira', { color: '#d7f6ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 3, y: 1 } }).setOrigin(0.5))
    this.miraCompanion = companion
  }

  private updateMiraCompanion() {
    if (!this.flag('mira_recruited') || !this.player || this.busy) {
      this.miraCompanion?.setVisible(false)
      return
    }
    if (!this.miraCompanion) {
      this.createMiraCompanion(this.player.x + 28, this.player.y + 18)
    }
    this.miraCompanion?.setVisible(true)
    const offset = this.getFollowerOffset(false)
    this.miraCompanion!.x += (this.player.x + offset.x - this.miraCompanion!.x) * 0.07
    this.miraCompanion!.y += (this.player.y + offset.y - this.miraCompanion!.y) * 0.07
  }

  private createCompanion(partyIndex: number): PartyCompanion | null {
    if (!this.player) return null
    const member = this.saveData.party[partyIndex]
    if (!member) return null
    const character = CHARACTERS[member.characterId]
    if (!character) return null

    const isKael = member.characterId === 'kael'
    const offsetX = isKael ? -40 : -60
    const offsetY = isKael ? -16 : -34
    const x = this.player.x + offsetX
    const y = this.player.y + offsetY
    const container = this.add.container(x, y).setDepth(10.5).setName(`companion:${member.characterId}`)
    const companionVisualScale = ENTITY_SCALE.companion / 0.58
    const companionBodySize = 32 * companionVisualScale
    const body = this.add.rectangle(0, 0, companionBodySize, companionBodySize, isKael ? 0x5c8a4d : 0x7fb3ff, 0.94)
      .setStrokeStyle(2, isKael ? 0xb8d8a8 : 0xe0f2fe, 0.78)
      .setVisible(false)
    const textureKey = member.characterId === 'kael' ? GENERATED_ASSETS.heroes.kael : member.characterId === 'io' ? GENERATED_ASSETS.heroes.io : null
    const aura = this.add.circle(0, 14 * companionVisualScale, 20 * companionVisualScale, isKael ? 0x55d27a : 0x60a5fa, 0.16).setStrokeStyle(3, isKael ? 0x86efac : 0x93c5fd, 0.72)
    const sprite = textureKey && hasTexture(this, textureKey) ? this.add.sprite(0, 0, textureKey, 0).setScale(ENTITY_SCALE.companion).setDepth(10.51) : undefined
    const fallbackVisuals: Phaser.GameObjects.GameObject[] = sprite ? [] : [
      this.add.rectangle(0, 0, companionBodySize, companionBodySize, isKael ? 0x5c8a4d : 0x7fb3ff, 0.96).setStrokeStyle(2, isKael ? 0xd9f7c8 : 0xe0f2fe, 0.8),
      this.add.rectangle(0, -5 * companionVisualScale, 22 * companionVisualScale, 10 * companionVisualScale, isKael ? 0x79b35f : 0xbfe3ff, 0.62),
      this.add.rectangle((isKael ? -8 : 8) * companionVisualScale, 7 * companionVisualScale, 6 * companionVisualScale, 12 * companionVisualScale, isKael ? 0x314d2b : 0x2563eb, 0.72),
      this.add.circle((isKael ? 8 : -8) * companionVisualScale, -8 * companionVisualScale, 4 * companionVisualScale, 0xfff1a8, 0.84),
    ]
    const nameText = this.add.text(0, -25, character.name, { color: isKael ? '#d9f7c8' : '#dbeafe', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 3, y: 1 } }).setOrigin(0.5)
    const hpBarBg = this.add.graphics().setDepth(10.55)
    const hpBar = this.add.graphics().setDepth(10.56)
    const mpBar = this.add.graphics().setDepth(10.57)
    container.add(sprite ? [aura, body, sprite, nameText] : [aura, body, ...fallbackVisuals, nameText])
    this.tweens.add({ targets: aura, scaleX: 1.12, scaleY: 1.08, alpha: 0.34, yoyo: true, repeat: -1, duration: isKael ? 900 : 1100, ease: 'Sine.easeInOut' })

    const companion: PartyCompanion = {
      characterId: member.characterId,
      name: character.name,
      container,
      body,
      aura,
      sprite,
      nameText,
      hpBar,
      hpBarBg,
      mpBar,
      x,
      y,
      partyIndex,
      state: member.currentHp <= 0 ? 'dead' : 'follow',
      offsetX,
      offsetY,
      attackCooldown: isKael ? 800 : 900,
      lastAttackTime: 0,
      lastSkillTime: 0,
      hitFlashTimer: 0,
      bobSeed: Phaser.Math.FloatBetween(0, Math.PI * 2),
    }
    this.updateCompanionBars(companion)
    return companion
  }

  private updateCompanions() {
    if (!this.player) return
    this.companions.forEach((companion) => {
      const member = this.saveData.party[companion.partyIndex]
      if (!member) return
      companion.state = member.currentHp <= 0 ? 'dead' : 'follow'
      if (companion.state === 'dead') {
        companion.container.setAlpha(0.3)
        this.updateCompanionBars(companion)
        return
      }

      companion.container.setAlpha(1)
      const attackRange = companion.characterId === 'io' ? 200 : 55
      const nearestEnemy = this.getNearestEnemy(companion.x, companion.y, companion.characterId === 'io' ? 200 : 180)

      if (companion.characterId === 'kael' && nearestEnemy) {
        const distance = Phaser.Math.Distance.Between(companion.x, companion.y, nearestEnemy.x, nearestEnemy.y)
        if (distance > attackRange) {
          const previousX = companion.x
          const previousY = companion.y
          const nextX = Phaser.Math.Linear(companion.x, nearestEnemy.x, 0.05)
          const nextY = Phaser.Math.Linear(companion.y, nearestEnemy.y, 0.05)
          if (!this.isWallAtWorld(nextX, companion.y)) companion.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
          if (!this.isWallAtWorld(companion.x, nextY)) companion.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
          if (companion.sprite) this.playCompanionAnimation(companion, true, companion.x - previousX, companion.y - previousY)
          companion.container.setPosition(companion.x, companion.y)
          this.updateCompanionBars(companion)
          return
        }
        if (this.time.now - companion.lastAttackTime >= companion.attackCooldown) {
          const stats = this.scaleCharacterStats(CHARACTERS.kael, member.level)
          const damage = CombatSystem.calculateRealtimePlayerDamage(stats.atk, nearestEnemy.stats.def)
          const angle = Phaser.Math.Angle.Between(companion.x, companion.y, nearestEnemy.x, nearestEnemy.y)
          const swing = this.add.arc(nearestEnemy.x, nearestEnemy.y, 24, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0xff9f1c, 0.38).setDepth(25).setStrokeStyle(4, 0xffd166, 0.8)
          this.tweens.add({ targets: swing, alpha: 0, duration: 180, onComplete: () => swing.destroy() })
          this.spawnKaelSlash(companion, nearestEnemy)
          if (companion.sprite) companion.sprite.play(`${companion.characterId}-attack-${this.directionFromVector(nearestEnemy.x - companion.x, nearestEnemy.y - companion.y)}`, true)
          this.tweens.add({ targets: companion.body, scale: ENTITY_SCALE.hero * 1.6, yoyo: true, duration: 75 })
          nearestEnemy.currentHp = Math.max(0, nearestEnemy.currentHp - damage)
          nearestEnemy.hitFlashTimer = 120
          nearestEnemy.body.setFillStyle(0xffffff)
          this.showDamageNumber(nearestEnemy.x, nearestEnemy.y - 22, damage, 'player')
          this.updateEnemyBars(nearestEnemy)
          companion.lastAttackTime = this.time.now
          if (nearestEnemy.currentHp <= 0) this.killEnemy(nearestEnemy)
          this.persist()
        }
        companion.container.setPosition(companion.x, companion.y)
        this.updateCompanionBars(companion)
        return
      }

      if (companion.characterId === 'io') {
        const healTarget = this.getLowestHpPartyMember()
        if (healTarget && healTarget.hpRatio < 0.5 && member.currentMp >= 6 && this.time.now - companion.lastSkillTime > 2500) {
          const previousHp = healTarget.member.currentHp
          healTarget.member.currentHp = Math.min(healTarget.maxHp, healTarget.member.currentHp + 24)
          member.currentMp = Math.max(0, member.currentMp - 6)
          const targetCompanion = this.companions.find((entry) => entry.partyIndex === healTarget.partyIndex)
          const healX = healTarget.partyIndex === 0 ? this.player!.x : targetCompanion?.x ?? companion.x
          const healY = healTarget.partyIndex === 0 ? this.player!.y : targetCompanion?.y ?? companion.y
          this.showDamageNumber(healX, healY - 28, 24, 'heal')
          this.spawnHealSparkles(healX, healY)
          this.spawnHealPulse(healX, healY)
          companion.lastSkillTime = this.time.now
          if (previousHp <= 0 && targetCompanion) {
            targetCompanion.state = 'follow'
            targetCompanion.container.setAlpha(1)
          }
          this.refreshHud()
          this.updatePlayerBars()
          this.updateCompanionBars(companion)
          this.persist()
          companion.container.setPosition(companion.x, companion.y)
          return
        }
        if (nearestEnemy && this.time.now - companion.lastAttackTime >= companion.attackCooldown) {
          const stats = this.scaleCharacterStats(CHARACTERS.io, member.level)
          const projectile = this.add.circle(companion.x, companion.y, 5, 0x60a5fa, 0.9).setDepth(25).setStrokeStyle(2, 0xbfdbfe, 0.8)
          companion.lastAttackTime = this.time.now
          let trailDrops = 0
          this.tweens.add({
            targets: projectile,
            x: nearestEnemy.x,
            y: nearestEnemy.y,
            duration: 300,
            onUpdate: () => {
              if (trailDrops >= 3 || !projectile.active) return
              trailDrops += 1
              const trail = this.add.circle(projectile.x, projectile.y, 4, 0x93c5fd, 0.42).setDepth(24)
              this.tweens.add({ targets: trail, alpha: 0, scale: ENTITY_SCALE.enemy * 0.64, duration: 220, onComplete: () => trail.destroy() })
            },
            onComplete: () => {
              projectile.destroy()
              if (nearestEnemy.dead) return
              const damage = Math.max(1, Math.round(CombatSystem.calculateRealtimePlayerDamage(stats.mag, nearestEnemy.stats.def) * 0.7))
              nearestEnemy.currentHp = Math.max(0, nearestEnemy.currentHp - damage)
              nearestEnemy.hitFlashTimer = 120
              nearestEnemy.body.setFillStyle(0xffffff)
              this.showDamageNumber(nearestEnemy.x, nearestEnemy.y - 22, damage, 'player')
              this.updateEnemyBars(nearestEnemy)
              if (nearestEnemy.currentHp <= 0) this.killEnemy(nearestEnemy)
              this.persist()
            },
          })
          this.persist()
          companion.container.setPosition(companion.x, companion.y)
          this.updateCompanionBars(companion)
          return
        }
      }

      const targetX = this.player!.x + companion.offsetX
      const targetY = this.player!.y + companion.offsetY
      const previousX = companion.x
      const previousY = companion.y
      const nextX = Phaser.Math.Linear(companion.x, targetX, 0.12)
      const nextY = Phaser.Math.Linear(companion.y, targetY, 0.12)
      if (!this.isWallAtWorld(nextX, companion.y)) companion.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
      if (!this.isWallAtWorld(companion.x, nextY)) companion.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
      if (companion.sprite) {
        const moving = Phaser.Math.Distance.Between(previousX, companion.y, companion.x, companion.y) > 0.2 || Phaser.Math.Distance.Between(companion.x, companion.y, targetX, targetY) > 3
        companion.sprite.y = Math.sin(this.time.now * 0.005 + companion.bobSeed) * 2
        this.playCompanionAnimation(companion, moving, companion.x - previousX, companion.y - previousY)
      }
      companion.container.setPosition(companion.x, companion.y)
      this.updateCompanionBars(companion)
    })
  }

  private playCompanionAnimation(companion: PartyCompanion, moving: boolean, deltaX: number, deltaY: number) {
    if (!companion.sprite) return
    if (companion.sprite.anims.currentAnim?.key?.includes('-attack-') && companion.sprite.anims.isPlaying) return
    const direction = this.directionFromVector(deltaX, deltaY)
    const animKey = `${companion.characterId}-${moving ? 'walk' : 'idle'}-${direction}`
    if (this.anims.exists(animKey) && companion.sprite.anims.currentAnim?.key !== animKey) companion.sprite.play(animKey)
  }

  private directionFromVector(deltaX: number, deltaY: number): Direction {
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX < 0 ? 'left' : 'right'
    if (Math.abs(deltaY) > 0.1) return deltaY < 0 ? 'up' : 'down'
    return 'down'
  }

  private getNearestEnemy(x: number, y: number, maxDistance: number): MapEnemy | null {
    let nearest: MapEnemy | null = null
    let nearestDistance = maxDistance
    this.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (distance <= nearestDistance) {
        nearest = enemy
        nearestDistance = distance
      }
    })
    return nearest
  }

  private getLowestHpPartyMember(): { member: SaveData['party'][number]; partyIndex: number; maxHp: number; hpRatio: number } | null {
    let lowest: { member: SaveData['party'][number]; partyIndex: number; maxHp: number; hpRatio: number } | null = null
    this.saveData.party.slice(0, 3).forEach((member, partyIndex) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const stats = this.scaleCharacterStats(character, member.level)
      const hpRatio = stats.hp > 0 ? member.currentHp / stats.hp : 1
      if (!lowest || hpRatio < lowest.hpRatio) lowest = { member, partyIndex, maxHp: stats.hp, hpRatio }
    })
    return lowest
  }

  private updateCompanionBars(companion: PartyCompanion) {
    const member = this.saveData.party[companion.partyIndex]
    const character = member ? CHARACTERS[member.characterId] : undefined
    if (!member || !character) return
    const stats = this.scaleCharacterStats(character, member.level)
    const width = 32
    const x = companion.x - width / 2
    companion.hpBarBg.clear().fillStyle(0x050509, 0.75).fillRect(x, companion.y - 20, width, 3)
    companion.hpBar.clear().fillStyle(0x4ade80, 1).fillRect(x, companion.y - 20, width * Phaser.Math.Clamp(member.currentHp / stats.hp, 0, 1), 3)
    companion.mpBar.clear().fillStyle(0x60a5fa, 1).fillRect(x, companion.y - 16, width * Phaser.Math.Clamp(member.currentMp / stats.mp, 0, 1), 3)
  }

  private getFollowerOffset(forPip: boolean) {
    const distance = TILE_SIZE * 0.78
    const offsets: Record<Direction, { x: number; y: number }> = {
      up: { x: forPip ? -24 : 24, y: distance },
      down: { x: forPip ? -24 : 24, y: -distance },
      left: { x: distance, y: forPip ? 18 : -18 },
      right: { x: -distance, y: forPip ? 18 : -18 },
    }
    return offsets[this.facing]
  }

  private updateWalkDust(delta: number, isMoving: boolean) {
    this.dustCooldown -= delta
    if (!isMoving || !this.player || this.dustCooldown > 0) {
      return
    }
    this.dustCooldown = 300
    const dust = this.add.circle(this.player.x + Phaser.Math.Between(-7, 7), this.player.y + 22, 4, 0xd0c8b8, 0.3).setDepth(10.2).setName('ambient:walk-dust')
    this.tweens.add({ targets: dust, scale: ENTITY_SCALE.object * 2.5, alpha: 0, duration: 300, ease: 'Sine.easeOut', onComplete: () => dust.destroy() })
  }

  private updateMiraNpcFacing() {
    const mira = this.npcActors.mira
    if (!mira || !this.player) {
      return
    }
    const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.tileCenter(ALLY_TILE.x), this.tileCenter(ALLY_TILE.y))
    if (distance <= TILE_SIZE * 3 && 'scaleX' in mira) {
      const transform = mira as unknown as Phaser.GameObjects.Components.Transform
      transform.scaleX = this.player.x < this.tileCenter(ALLY_TILE.x) ? -Math.abs(transform.scaleX) : Math.abs(transform.scaleX)
    }
  }

  private updateAreaPop() {
    if (!this.player) {
      return
    }
    const tile = this.worldToTile(this.player.x, this.player.y)
    const area = this.getAreaNameForTile(tile.x, tile.y)
    if (area === this.lastArea) {
      return
    }
    this.lastArea = area
    if (!this.discoveredAreas.has(area)) {
      this.discoveredAreas.add(area)
      this.showAreaPop(area)
    }
  }

  private getAreaNameForTile(tileX: number, tileY: number) {
    if (tileX >= 16 && tileY >= 11) return 'SKYWELL APPROACH'
    if (tileX >= 14 && tileY <= 8) return 'MOONWAKE SHRINE'
    if (tileX >= 13 && tileY >= 8) return 'EAST FIELD'
    if (tileX >= 9 && tileY >= 10) return 'VERDANT ARCHIVE'
    if (tileY >= 9) return 'SOUTH GARDEN'
    return 'LUMA QUAY'
  }

  private showAreaPop(area: string) {
    const text = this.add.text(this.scale.width / 2, this.scale.height / 2 - 110, area, { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '42px' }).setOrigin(0.5).setScrollFactor(0).setDepth(118).setAlpha(0.48).setName('area-pop')
    this.tweens.add({ targets: text, y: text.y - 18, alpha: 0, delay: 1400, duration: 600, ease: 'Sine.easeInOut', onComplete: () => text.destroy() })
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
        if (!this.anims.exists(`nara-attack-${direction}`)) {
          this.anims.create({ key: `nara-attack-${direction}`, frames: this.anims.generateFrameNumbers(GENERATED_ASSETS.heroes.nara, { start: row * 4 + 1, end: row * 4 + 3 }), frameRate: 14, repeat: 0 })
        }
      }
    }
    for (const [characterId, assetKey] of Object.entries({ kael: GENERATED_ASSETS.heroes.kael, io: GENERATED_ASSETS.heroes.io })) {
      if (!hasTexture(this, assetKey)) continue
      for (const direction of Object.keys(HERO_ANIM_ROWS) as Direction[]) {
        const row = HERO_ANIM_ROWS[direction]
        if (!this.anims.exists(`${characterId}-walk-${direction}`)) {
          this.anims.create({ key: `${characterId}-walk-${direction}`, frames: this.anims.generateFrameNumbers(assetKey, { start: row * 4, end: row * 4 + 3 }), frameRate: 7, repeat: -1 })
        }
        if (!this.anims.exists(`${characterId}-idle-${direction}`)) {
          this.anims.create({ key: `${characterId}-idle-${direction}`, frames: [{ key: assetKey, frame: row * 4 }], frameRate: 1 })
        }
        if (!this.anims.exists(`${characterId}-attack-${direction}`)) {
          this.anims.create({ key: `${characterId}-attack-${direction}`, frames: this.anims.generateFrameNumbers(assetKey, { start: row * 4 + 1, end: row * 4 + 3 }), frameRate: 13, repeat: 0 })
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
    if (this.player.anims.currentAnim?.key?.startsWith('nara-attack') && this.player.anims.isPlaying) {
      return
    }
    if (this.player.anims.currentAnim?.key !== key) {
      this.player.play(key)
    }
  }

  private createHud() {
    const hudGraphics = this.add.graphics().setScrollFactor(0).setDepth(90)
    const nameText = this.add.text(54, 22, 'Nara Lv.3', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(92)
    const hpText = this.add.text(180, 42, '', { color: '#f8fff9', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(92)
    const mpText = this.add.text(180, 58, '', { color: '#eff6ff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(92)
    const goldText = this.add.text(198, 22, '', { color: '#ffd166', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(92)
    const companionTexts = [this.add.text(50, 100, 'Kael', { color: '#d7fbe8', fontFamily: 'Arial, sans-serif', fontSize: '11px' }), this.add.text(50, 128, 'Io', { color: '#dbeafe', fontFamily: 'Arial, sans-serif', fontSize: '11px' })]
    const swordTexts = [this.add.text(28, 100, '⚔', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }), this.add.text(28, 128, '⚔', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '10px' })]
    const portraits = [this.add.circle(25, 105, 10, 0x55d27a, 0.94), this.add.circle(25, 133, 10, 0x60a5fa, 0.94)]
    ;[...companionTexts, ...swordTexts, ...portraits].forEach((entry) => entry.setScrollFactor(0).setDepth(92))
    this.hudPanel = { graphics: hudGraphics, nameText, hpText, mpText, goldText, companionTexts, swordTexts, portraits }
    this.add.circle(30, 30, 15, 0xff8a3d, 0.95).setStrokeStyle(2, 0xfff1a8, 0.7).setScrollFactor(0).setDepth(92)
    this.add.text(30, 30, 'N', { color: '#111827', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(93)
    this.objectivePanel = this.add.rectangle(this.scale.width / 2, 18, this.uiWidth(0.45, 430), 32, 0x050713, 0.72).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90).setStrokeStyle(1, 0x9ff3ff, 0.32)
    this.objectiveText = this.add.text(this.scale.width / 2, 34, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '14px', wordWrap: { width: 400 } }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
    this.inventoryText = this.add.text(16, 156, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#05071388', padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(91)
    this.levelText = this.add.text(0, 0, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '1px' }).setVisible(false)
    this.killCounterText = this.add.text(this.scale.width - 24, 24, 'Kills: 0', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }).setOrigin(1, 0).setScrollFactor(0).setDepth(91)
    this.comboText = this.add.text(this.scale.width - 24, 24, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true } }).setOrigin(1, 0).setScrollFactor(0).setDepth(96)
    this.dashReadyText = this.add.text(this.scale.width - 24, 54, 'DASH READY', { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold' }).setOrigin(1, 0).setScrollFactor(0).setDepth(96).setAlpha(0)
    const areaPanel = this.add.rectangle(this.scale.width / 2, 14, 190, 38, 0x0b0e1a, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90)
    areaPanel.setStrokeStyle(1, 0x9ff3ff, 0.58)
    this.areaText = this.add.text(this.scale.width / 2, 31, 'Luma Quay', { color: '#9ff3ff', fontFamily: 'Georgia, serif', fontSize: '16px' }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
    this.promptText = this.add.text(this.scale.width / 2, this.scale.height - 24, 'WASD: Move | Space: Attack | 1-4: Skills | F: Block | Q: Potion | E: Interact', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px', backgroundColor: '#08091acc', padding: { x: 12, y: 6 }, wordWrap: { width: this.uiWidth(0.86, 760) } }).setOrigin(0.5).setScrollFactor(0).setDepth(95)
    this.tweens.add({ targets: this.promptText, alpha: 0, delay: 10000, duration: 900 })
    this.createSkillBar()
    this.playerHpBarBg = this.add.graphics().setDepth(22)
    this.playerHpBar = this.add.graphics().setDepth(23)
    this.playerMpBar = this.add.graphics().setDepth(23)
    this.playerHpText = this.add.text(0, 0, '', { color: '#f8fff9', fontFamily: 'Arial, sans-serif', fontSize: '10px', shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 1, fill: true } }).setOrigin(0.5).setDepth(24)
    this.playerMpText = this.add.text(0, 0, '', { color: '#eff6ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 1, fill: true } }).setOrigin(0.5).setDepth(24)
    this.playerXpBar = this.add.graphics().setScrollFactor(0).setDepth(91)
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

    const interact = this.add.text(width - 92, height - 94, 'E', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', backgroundColor: '#0a0a2e88', padding: { x: 20, y: 14 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
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
      this.restorePartyMissingPercent(0.5, 0.3)
      this.persist()
      audioManager.playSfx('save_point')
      this.cameras.main.flash(180, 159, 243, 255, false)
      let revivedCompanions = 0
      this.companions.forEach((companion) => {
        const member = this.saveData.party[companion.partyIndex]
        const character = member ? CHARACTERS[member.characterId] : undefined
        if (!member || !character || companion.state !== 'dead') return
        const stats = this.scaleCharacterStats(character, member.level)
        member.currentHp = Math.max(1, Math.floor(stats.hp * 0.5))
        companion.state = 'follow'
        companion.container.setAlpha(1)
        revivedCompanions += 1
      })
      if (revivedCompanions > 0) {
        this.persist()
        this.showToast('The save crystal revives fallen companions.')
      }
      this.showToast('The save crystal hums. Strength returns.')
    }
  }

  private checkHomeBenefits() {
    if (!this.player) {
      return
    }

    const tile = this.worldToTile(this.player.x, this.player.y)
    const distanceFromHome = Phaser.Math.Distance.Between(tile.x, tile.y, HOME_TILE.x, HOME_TILE.y)
    if (distanceFromHome > 3) {
      this.homeWarmthUsedThisVisit = false
      this.homeGardenUsedThisVisit = false
      return
    }

    if (tile.x !== HOME_TILE.x || tile.y !== HOME_TILE.y) {
      return
    }

    if (this.saveData.home.warmth === 1 && !this.homeWarmthUsedThisVisit) {
      this.homeWarmthUsedThisVisit = true
      this.restorePartyMissingPercent(0.3, 0.2)
      audioManager.playSfx('save_point')
      this.showToast('The hearth embraces you. HP and MP partially restored.')
      this.persist()
    }

    if (this.saveData.home.garden === 1 && !this.homeGardenUsedThisVisit) {
      this.homeGardenUsedThisVisit = true
      const itemId = this.rollGardenItem()
      if (itemId) {
        this.addInventory(itemId, 1)
        audioManager.playSfx('reward_gain')
        this.showToast(`The garden yields a ${this.getItemName(itemId)}.`)
        this.persist()
      }
    }
  }

  private checkPetForage() {
    if (!this.saveData.pet.unlocked || !this.saveData.pet.forageReady || this.time.now - this.lastForageTime < 45000) {
      return
    }

    const itemId = this.rollPetForageItem()
    this.lastForageTime = this.time.now
    this.saveData.pet.forageReady = false
    this.addInventory(itemId, 1)
    audioManager.playSfx('reward_gain')
    this.showToast(`Pip returns with a ${this.getItemName(itemId)}!`)
    this.persist()
    this.time.delayedCall(60000, () => {
      if (!this.saveData?.pet.unlocked) {
        return
      }
      this.saveData.pet.forageReady = true
      this.persist()
    })
  }

  private notifyWorkshopBuff() {
    if (this.saveData.home.workshop !== 1 || this.flag('workshopBuffNotified')) {
      return
    }

    this.setFlag('workshopBuffNotified')
    this.time.delayedCall(900, () => this.showToast('The workshop hums with purpose. All allies gain ATK +2, DEF +1.'))
    this.persist()
  }

  private interact() {
    audioManager.playSfx('field_interact')
    const tile = this.getInteractionTile()
    const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.matchesTile(tile, target) || this.matchesTile(playerTile, target)

    const chest = TREASURE_CHESTS.find((entry) => isAt(entry))
    if (chest) {
      this.openChest(chest.id)
    } else if (isAt(GUIDE_TILE)) {
      this.talkGuide()
    } else if (isAt(ELDER_TILE)) {
      this.talkElder()
    } else if (isAt(MERCHANT_TILE)) {
      this.openShop()
    } else if (isAt(MARKER_TILE)) {
      this.inspectMarker()
    } else if (isAt(SIGNPOST_TILE)) {
      this.showSignpostGuide()
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
    } else {
      audioManager.playSfx('ui_cancel')
      this.showToast('Nothing responds here. Check the objective or face an object and press E.')
    }
  }

  private openChest(chestId = CHEST_ID) {
    if (this.saveData.openedChests.includes(chestId) || this.flag(`chest_${chestId}`)) {
      audioManager.playSfx('ui_cancel')
      this.showToast('The treasure chest is empty.')
      return
    }
    this.saveData.openedChests.push(chestId)
    this.setFlag(`chest_${chestId}`)
    const reward = this.rollChestReward(chestId)
    if (reward.gold > 0) this.saveData.gold += reward.gold
    reward.items.forEach((item) => this.addInventory(item.itemId, item.quantity))
    if (reward.equipCharm) this.saveData.party[0].equipment.charm = reward.equipCharm
    audioManager.playSfx('chest_open')
    this.animateChestOpen(chestId)
    this.time.delayedCall(230, () => audioManager.playSfx('equipment_gain'))
    this.showToast(`Treasure chest: ${reward.label}`)
    this.persist()
    if (this.objectiveText && this.inventoryText) {
      this.refreshHud()
    }
  }

  private rollChestReward(chestId: string): { gold: number; items: Array<{ itemId: string; quantity: number }>; equipCharm?: string; label: string } {
    if (chestId === CHEST_ID) return { gold: 0, items: [{ itemId: 'health_potion', quantity: 2 }, { itemId: 'mana_potion', quantity: 1 }, { itemId: 'wind_charm', quantity: 1 }], equipCharm: 'wind_charm', label: 'Potion x2, Ether x1, Wind Charm equipped' }
    const rolls = [
      { gold: 90, items: [] as Array<{ itemId: string; quantity: number }>, label: '90 gold' },
      { gold: 0, items: [{ itemId: 'health_potion', quantity: 2 }], label: 'Potion x2' },
      { gold: 0, items: [{ itemId: 'mana_potion', quantity: 1 }], label: 'Ether x1' },
      { gold: 30, items: [{ itemId: 'wind_charm', quantity: 1 }], equipCharm: 'wind_charm', label: '30 gold and Wind Charm' },
    ]
    return rolls[Phaser.Math.Between(0, rolls.length - 1)]
  }

  private animateChestOpen(chestId: string) {
    const chest = this.treasureChests.find((entry) => entry.id === chestId)
    if (!chest) return
    chest.opened = true
    chest.base.setFillStyle(0x49351e, 0.62)
    chest.trim.setAlpha(0.45)
    this.tweens.add({ targets: chest.lid, y: chest.lid.y - 9, alpha: 0.55, duration: 180, ease: 'Back.easeOut' })
    const x = this.tileCenter(chest.tile.x)
    const y = this.tileCenter(chest.tile.y)
    for (let index = 0; index < 8; index += 1) {
      const sparkle = this.add.circle(x, y - 10, 2, 0xfff1a8, 0.95).setDepth(24)
      this.tweens.add({ targets: sparkle, x: x + Phaser.Math.Between(-24, 24), y: y - Phaser.Math.Between(18, 42), alpha: 0, duration: 560, onComplete: () => sparkle.destroy() })
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
      this.spawnStoryBoss('clay_sentinel', MARKER_TILE, FIELD_BATTLE_ID)
      this.showToast('Marker: Guardian wake confirmed. Step southeast to challenge it.')
    } else if (!this.flag('field_battle_won')) {
      this.showToast('Marker: The guardian waits in the red-lit field southeast.')
    } else {
      this.showToast(this.flag('slice_complete') ? 'Marker: Guardian vow fulfilled. Moonwake Shrine accepts passage east.' : 'Marker: The path is calm. Report back to Elder Maelin.')
    }
    this.persist()
    this.refreshHud()
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
    const previousLevels = new Map(this.saveData.party.map((member) => [member.characterId, member.level]))
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
    const levelUps = this.saveData.party
      .filter((member) => member.level > (previousLevels.get(member.characterId) ?? member.level))
      .map((member) => ({ name: CHARACTERS[member.characterId]?.name ?? member.characterId, level: member.level }))
    this.time.delayedCall(250, () => {
      this.showEventBanner(
        this.getBattleResultTitle(result.battleId),
        this.getBattleResultSubtitle(result.battleId),
      )
      audioManager.playSfx(result.battleId === SHRINE_BOSS_BATTLE_ID ? 'equipment_gain' : 'reward_gain')
      this.time.delayedCall(320, () => audioManager.playSfx('reward_gain'))
      this.showRewardToast(`Rewards secured: ${rewards.gold}g, EXP ${rewards.exp}, new route objective updated.`)
      this.showLevelUpCeremony(levelUps)
      this.refreshHud()
      if (result.battleId === FINAL_BOSS_BATTLE_ID) {
        this.time.delayedCall(3050, () => this.showDemoCompletionCard())
      }
    })
  }

  private showLevelUpCeremony(levelUps: Array<{ name: string; level: number }>) {
    levelUps.forEach((levelUp, index) => {
      this.time.delayedCall(800 * index, () => {
        audioManager.playSfx('level_up')
        this.flashHudGold()
        this.showToast(`${levelUp.name} ascends to Level ${levelUp.level}!`)
      })
    })
  }

  private flashHudGold() {
    const flash = this.add.rectangle(0, 0, this.scale.width, 118, 0xffd36e, 0.28).setOrigin(0).setScrollFactor(0).setDepth(96)
    this.tweens.add({ targets: flash, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => flash.destroy() })
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
      this.createMiraCompanion((this.player?.x ?? this.tileCenter(ALLY_TILE.x)) + 28, (this.player?.y ?? this.tileCenter(ALLY_TILE.y)) + 18)
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
      this.refreshHomeUpgradeVisuals()
      this.showToast('Mira: Your mother kept spare maps under that tile. We are not letting this place go dark again.')
    } else if (home.garden === 0) {
      home.garden = 1
      this.addInventory('health_elixir', 1)
      audioManager.playSfx('reward_gain')
      this.showEventBanner('Home Restored: Moon-Garden', 'Pip stamps the soil flat. Medicinal glassmint begins to glow.')
      this.refreshHomeUpgradeVisuals()
      this.showToast('Garden upgrade: Health Elixir x1 harvested. Resting here now feels like coming back to people.')
    } else if (home.workshop === 0) {
      home.workshop = 1
      this.addInventory('skywell_lens', 1)
      this.setObjective(OBJECTIVES.enterArchive)
      audioManager.playSfx('equipment_gain')
      this.showEventBanner('Home Restored: Map Workshop', 'The workbench lens focuses the route beyond the Verdant Archive.')
      this.drawGateBlocker(ARCHIVE_TILE, true, 'Overgrowth', 0x78d66b)
      this.refreshHomeUpgradeVisuals()
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
      this.spawnStoryBoss('storm_wisp', ARCHIVE_TILE, ARCHIVE_SKIRMISH_ID)
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
    if (!this.flag('shrine_gate_seen')) { this.showToast('Inner Seal: the shrine lane is blocked by the gate above. Open the Moonwake Gate first.'); return }
    if (!this.flag('shrine_font_attuned')) { this.showToast('Inner Seal: A cold pressure turns you back. Attune the pilgrim font first.'); return }
    if (this.flag('shrine_guardian_won')) { this.showToast('Inner Seal: Broken glass floats upward, forming a map toward the Skywell.'); return }
    this.spawnStoryBoss('moonwake_guardian', SHRINE_SEAL_TILE, SHRINE_BOSS_BATTLE_ID)
  }

  private startArchiveSkirmish() {
    this.setFlag('archive_skirmish_won')
    this.setObjective(OBJECTIVES.faceMidBoss)
    this.showToast('Archive entrance cleared. Thornheart waits deeper in the roots.')
    this.persist()
  }

  private startMidBossBattle() {
    if (!this.flag('archive_entered')) { this.showToast('Root Wall: the Verdant Archive lane is still overgrown. Open the archive entrance first.'); return }
    if (this.flag('thornheart_won')) { this.showToast("Root Wall open: Thornheart's stump has become a stair of green glass pointing toward the Skywell."); return }
    this.spawnStoryBoss('thornheart', MID_BOSS_TILE, MID_BOSS_BATTLE_ID)
  }

  private startFinalBossBattle() {
    if (!this.flag('thornheart_won')) { this.showToast('Skywell Barrier: the upper approach is sealed by Thornheart roots. Clear the Verdant Archive first.'); return }
    if (!this.flag('skywell_opened')) { this.showToast('Skywell Barrier: the path glows but will not hold. Use the restored home workshop to focus the Skywell Lens.'); return }
    if (this.flag('final_boss_won')) { this.showToast('Skywell Rift: Quiet now. The false horizon has been folded into a true road home.'); return }
    this.spawnStoryBoss('cartographers_lie', FINAL_BOSS_TILE, FINAL_BOSS_BATTLE_ID)
  }

  private showToast(message: string) {
    const { width } = this.scale
    this.toast?.destroy()
    const lower = message.toLowerCase()
    const color = lower.includes('failed') || lower.includes("can't") || lower.includes('not enough') ? '#ff8a8a' : lower.includes('no health') || lower.includes('already') || lower.includes('low') ? '#ffb86b' : lower.includes('purchased') || lower.includes('yields') || lower.includes('restored') || lower.includes('complete') ? '#86efac' : '#ffffff'
    const panelW = Math.min(message.length * 9 + 48, this.uiWidth(0.78, 740))
    const wrapWidth = Math.max(160, panelW - 32)
    const estimatedCharsPerLine = Math.max(22, Math.floor(wrapWidth / 8.2))
    const panelH = Math.max(Math.ceil(message.length / estimatedCharsPerLine) * 22 + 52, 52)
    const container = this.add.container(width / 2, 82).setScrollFactor(0).setDepth(125).setAlpha(0)
    const glow = this.add.rectangle(0, 0, panelW + 14, panelH + 12, 0xffd36e, 0.1)
    const panel = this.add.rectangle(0, 0, panelW, panelH, 0x0a0e1e, 0.94).setStrokeStyle(1, 0xd4a84b, 0.72)
    const accent = this.add.rectangle(-panelW / 2 + 3, 0, 3, panelH - 8, 0xd4a84b, 0.8)
    const text = this.add.text(0, 0, message, { color, fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: wrapWidth } }).setOrigin(0.5)
    container.add([glow, panel, accent, text])
    this.toast = container
    this.tweens.add({ targets: container, y: 104, alpha: 1, duration: 180, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: container, y: 88, alpha: 0, delay: 3000, duration: 520, onComplete: () => { if (this.toast === container) { this.toast = undefined }; container.destroy() } })
  }

  private showRewardToast(message: string) {
    const { width } = this.scale
    this.toast?.destroy()
    const container = this.add.container(width / 2, 128).setScrollFactor(0).setDepth(125)
    const panelW = this.uiWidth(0.79, 760)
    container.add(this.add.rectangle(0, 0, panelW, 48, 0x231525, 0.94).setStrokeStyle(2, 0xffd36e, 0.72))
    container.add(this.add.text(0, 0, message, { color: '#86efac', fontFamily: 'Arial, sans-serif', fontSize: '18px', wordWrap: { width: panelW - 60 } }).setOrigin(0.5))
    this.toast = container
    this.tweens.add({ targets: container, y: '-=10', alpha: 0, delay: 3000, duration: 520, onComplete: () => { if (this.toast === container) { this.toast = undefined }; container.destroy() } })
  }

  private showAreaBanner(title: string, subtitle: string) {
    this.dismissBanners()
    this.areaText?.setText(title)
    const { width } = this.scale
    const bannerW = this.uiWidth(0.6, 580)
    const bannerH = this.uiHeight(0.13, 84)
    const glow = this.add.rectangle(width / 2, 84, bannerW + 24, bannerH + 20, 0x9ff3ff, 0.08).setScrollFactor(0).setDepth(119.8)
    const panel = this.add.rectangle(width / 2, 84, bannerW, bannerH, 0x071023, 0.9).setScrollFactor(0).setDepth(120).setStrokeStyle(1, 0x9ff3ff, 0.62)
    const rule = this.add.rectangle(width / 2, 110, Math.min(bannerW - 80, 430), 2, 0xffd36e, 0.62).setScrollFactor(0).setDepth(121)
    const heading = this.add.text(width / 2, 62, title, { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: `${Math.min(26, Math.max(18, Math.floor(width / 37)))}px`, wordWrap: { width: bannerW - 32 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    const body = this.add.text(width / 2, 92, subtitle, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: bannerW - 60 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    this.activeBanners.push(glow, panel, rule, heading, body)
    this.tweens.add({ targets: [glow, panel, rule, heading, body], alpha: 0, delay: 2300, duration: 600, onComplete: () => { glow.destroy(); panel.destroy(); rule.destroy(); heading.destroy(); body.destroy(); this.activeBanners = this.activeBanners.filter(b => b.scene && b.active) } })
  }

  private showEventBanner(title: string, subtitle: string) {
    this.dismissBanners()
    const { width, height } = this.scale
    const eventW = this.uiWidth(0.69, 660)
    const panel = this.add.rectangle(width / 2, height / 2 - 140, eventW, this.uiHeight(0.14, 92), 0x1b1020, 0.92).setScrollFactor(0).setDepth(130).setStrokeStyle(2, 0xffd36e, 0.72)
    const accent = this.add.rectangle(width / 2, height / 2 - 186, 0, 2, 0xffd36e, 0.9).setScrollFactor(0).setDepth(131)
    const heading = this.add.text(width / 2, height / 2 - 162, title, { color: '#ffd36e', fontFamily: 'Georgia, serif', fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const body = this.add.text(width / 2, height / 2 - 130, subtitle, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: eventW - 60 } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
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

  private showSignpostGuide() {
    const routes = ['◄ North: Elder Maelin\'s quarters']
    if (this.flag('elder_intro') || this.flag('marker_read') || this.flag('field_battle_won')) {
      routes.push('► East: Guardian Field → Moonwake Shrine')
    }
    if (this.flag('mira_recruited') || this.saveData.pet.unlocked || this.homeProgress() > 0) {
      routes.push('▼ South: Home, Bell Thicket, Verdant Archive')
    }
    if (this.flag('thornheart_won') || this.flag('skywell_opened')) {
      routes.push('▲ Beyond Archive: Skywell Approach')
    }
    routes.slice(0, 4).forEach((route, index) => {
      this.time.delayedCall(index * 200, () => this.showToast(route))
    })
  }

  private showDemoCompletionCard() {
    this.dismissBanners()
    const { width, height } = this.scale
    const playTime = this.formatPlayTime(this.saveData.playTime)
    const partyLevels = this.saveData.party.map((member) => `${CHARACTERS[member.characterId]?.name ?? member.characterId} Lv.${member.level}`).join('  •  ')
    const glow = this.add.ellipse(width / 2, height / 2 + 20, 820, 270, 0xffa43a, 0.14).setScrollFactor(0).setDepth(179)
    const panel = this.add.rectangle(width / 2, height / 2 + 20, this.uiWidth(0.81, 780), this.uiHeight(0.39, 250), 0x190d16, 0.96).setScrollFactor(0).setDepth(180).setStrokeStyle(2, 0xffd36e, 0.82)
    const heading = this.add.text(width / 2, height / 2 - 82, 'Luma Quay Endures', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '30px' }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const body = this.add.text(width / 2, height / 2 - 24, `Play time: ${playTime}\n✓ Shrine purified   ✓ Thornheart felled   ✓ Skywell restored\n${partyLevels}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', align: 'center', lineSpacing: 8, wordWrap: { width: 710 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const footer = this.add.text(width / 2, height / 2 + 83, 'Save at the Skywell to keep this clear file, or return to the title and press R to reset for another showcase run.', { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '15px', align: 'center', wordWrap: { width: 660 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    this.tweens.add({ targets: glow, alpha: 0.25, scale: ENTITY_SCALE.object * 1.73, yoyo: true, repeat: -1, duration: 1150, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: [glow, panel, heading, body, footer], alpha: 0, delay: 7600, duration: 900, onComplete: () => { glow.destroy(); panel.destroy(); heading.destroy(); body.destroy(); footer.destroy(); this.showCreditsScroll() } })
  }

  private showCreditsScroll() {
    const { width, height } = this.scale
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0).setScrollFactor(0).setDepth(240)
    const credits = this.add.text(width / 2, height + 80, 'Emberglass: Covenant of the Skywell\nA handcrafted JRPG experience\n\nGame Design & Development\nZai & Hermes\n\nArt\nProgrammatic Pixel Art (Pillow)\n\nMusic & SFX\nWeb Audio API\n\nThank you for playing.', { align: 'center', color: '#ffffff', fontFamily: 'Georgia, serif', fontSize: `${Math.min(25, Math.max(18, Math.floor(width / 38)))}px`, lineSpacing: 14, wordWrap: { width: this.uiWidth(0.84, 800) } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(241)
    this.tweens.add({ targets: overlay, alpha: 0.86, duration: 900, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: credits, y: -360, duration: 8000, ease: 'Linear', onComplete: () => {
      this.tweens.add({ targets: [overlay, credits], alpha: 0, duration: 800, onComplete: () => this.scene.start('TitleScene') })
    } })
  }

  private formatPlayTime(playTime: number) {
    const totalSeconds = Math.max(0, Math.floor(playTime || this.time.now / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  private openShop() {
    if (this.menuOverlay) {
      return
    }

    this.busy = true
    audioManager.playSfx('ui_menu_open')
    const { width, height } = this.scale
    const container = this.add.container(0, 0).setScrollFactor(0).setDepth(130)
    const shopItems = [
      { itemId: 'health_potion', price: 25 },
      { itemId: 'mana_potion', price: 35 },
      { itemId: 'antidote', price: 20 },
      { itemId: 'burn_salve', price: 20 },
      { itemId: 'wind_charm', price: 95 },
      { itemId: 'ember_charm', price: 95 },
      { itemId: 'arcane_charm', price: 95 },
    ].filter((entry) => ITEMS_BY_ID[entry.itemId]?.type !== 'charm' || !this.hasInventoryItem(entry.itemId))

    container.add(this.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.6))
    const shopW = this.uiWidth(0.52, 500)
    const shopH = this.uiHeight(0.6, 380)
    container.add(this.add.rectangle(width / 2, height / 2, shopW, shopH, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.75))
    container.add(this.add.text(width / 2, height / 2 - 160, 'Quay Merchant', { color: '#f0c040', fontFamily: 'Georgia, serif', fontSize: '30px' }).setOrigin(0.5))
    const goldText = this.add.text(width / 2 - 210, height / 2 - 122, `Your Gold: ${this.saveData.gold}`, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '18px' })
    container.add(goldText)

    shopItems.forEach((entry, index) => {
      const item = ITEMS_BY_ID[entry.itemId]
      const y = height / 2 - 82 + index * 34
      const row = this.add.text(width / 2 - 210, y, `${item.name} — ${entry.price}g`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px' })
      container.add(row)
      const buy = this.add.text(width / 2 + 150, y, 'Buy', { color: this.saveData.gold >= entry.price ? '#8fffb0' : '#74788f', fontFamily: 'Arial, sans-serif', fontSize: '17px' })
        .setInteractive({ useHandCursor: true })
      buy.on('pointerdown', () => {
        if (ITEMS_BY_ID[entry.itemId]?.type === 'charm' && this.hasInventoryItem(entry.itemId)) {
          audioManager.playSfx('ui_cancel')
          this.showToast('Peddler: You already own that charm.')
          return
        }

        if (this.saveData.gold < entry.price) {
          audioManager.playSfx('ui_cancel')
          this.showToast('Peddler: Not enough gold for that.')
          return
        }

        this.saveData.gold -= entry.price
        this.addInventory(entry.itemId, 1)
        this.autoEquipCharm(entry.itemId)
        this.persist()
        goldText.setText(`Your Gold: ${this.saveData.gold}`)
        audioManager.playSfx('merchant_trade')
        this.showToast(`Purchased ${item.name} for ${entry.price}g.`)
        if (item.type === 'charm') {
          row.setColor('#74788f')
          buy.setText('Owned').setColor('#74788f').disableInteractive()
        }
      })
      container.add(buy)
    })

    const close = this.add.text(width / 2, height / 2 + 152, 'Close', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => this.closeMenu())
    container.add(close)
    this.menuOverlay = { container }
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
    const playTime = this.formatPlayTime(this.saveData.playTime)

    const inventoryLines = [
      `Potion x${counts.potion}`,
      `Ether x${counts.ether}`,
      `Ember Shard x${counts.emberShard}`,
      ...this.saveData.inventory
        .filter((entry) => ['wind_charm', 'warding_ember', 'skywell_shard', 'glass_lens'].includes(entry.itemId))
        .map((entry) => `${ITEMS_BY_ID[entry.itemId]?.name ?? entry.itemId} x${entry.quantity}`),
    ]

    container.add(this.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.58))
    container.add(this.add.rectangle(width / 2, 18, width, 36, 0x000000, 0.34))
    container.add(this.add.rectangle(width / 2, height - 18, width, 36, 0x000000, 0.34))
    container.add(this.add.rectangle(18, height / 2, 36, height, 0x000000, 0.34))
    container.add(this.add.rectangle(width - 18, height / 2, 36, height, 0x000000, 0.34))
    const menuW = this.uiWidth(0.73, 700)
    const menuH = this.uiHeight(0.78, 500)
    const panel = this.add.rectangle(width / 2, height / 2, menuW, menuH, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.6)
    container.add(panel)
    container.add(this.add.rectangle(width / 2, height / 2 - 136, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.add.rectangle(width / 2, height / 2 - 52, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.add.rectangle(width / 2, height / 2 + 160, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.add.text(width / 2 - 310, height / 2 - 220, '◈', { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '22px' }))
    container.add(this.add.text(width / 2 - 290, height / 2 - 220, 'Emberglass Menu', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '28px' }))
    container.add(this.add.text(width / 2 + 112, height / 2 - 216, `${this.saveData.gold}g  •  ${playTime}`, { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '21px' }))
    container.add(this.add.text(width / 2 - 310, height / 2 - 168, `Objective\n${this.saveData.currentObjective}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: menuW - 90 } }))
    this.saveData.party.forEach((member, index) => this.addMenuPartyRow(container, width / 2 - 300 + index * 198, height / 2 - 74, member))
    container.add(this.add.text(width / 2 + 64, height / 2 - 86, `Inventory\n${inventoryLines.join('\n')}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 7 }))
    const status = this.add.text(width / 2 - 74, height / 2 + 146, 'Status', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    status.on('pointerdown', () => this.openStatusScreen())
    container.add(status)
    container.add(this.add.text(width / 2 - 310, height / 2 + 184, 'Controls: Move WASD/Arrows or touch pad • Interact Enter/Space/ACT • Menu M/Esc • Shop trades shards first, then sells potions.', { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: menuW - 80 } }))
    this.menuOverlay = { container }
  }

  private closeMenu() {
    this.menuOverlay?.container.destroy()
    this.menuOverlay = undefined
    this.busy = false
    audioManager.playSfx('ui_cancel')
  }

  private addMenuPartyRow(container: Phaser.GameObjects.Container, x: number, y: number, member: SaveData['party'][number]) {
    const character = CHARACTERS[member.characterId]
    if (!character) return
    const stats = this.scaleCharacterStats(character, member.level)
    const hpRatio = Phaser.Math.Clamp(member.currentHp / stats.hp, 0, 1)
    container.add(this.add.text(x, y, `${character.name} Lv.${member.level}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '15px' }))
    container.add(this.add.rectangle(x + 56, y + 28, 116, 8, 0x281018, 0.95).setOrigin(0.5))
    container.add(this.add.rectangle(x - 2, y + 28, 112 * hpRatio, 6, 0x45e67a, 0.95).setOrigin(0, 0.5))
    container.add(this.add.text(x, y + 40, `HP ${member.currentHp}/${stats.hp}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
  }

  private openStatusScreen() {
    if (!this.menuOverlay) return
    const { width, height } = this.scale
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(215)
    this.menuOverlay.container.add(overlay)
    overlay.add(this.add.rectangle(width / 2, height / 2, this.uiWidth(0.79, 760), this.uiHeight(0.78, 500), 0x090d20, 0.94).setStrokeStyle(2, 0x8ab4f8, 0.72))
    overlay.add(this.add.text(width / 2 - 340, height / 2 - 226, 'Party Status', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '27px' }))
    this.saveData.party.forEach((member, index) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const stats = this.scaleCharacterStats(character, member.level)
      const x = width / 2 - 320
      const y = height / 2 - 172 + index * 126
      overlay.add(this.add.text(x, y, `${character.name} (Lv.${member.level})`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '19px' }))
      this.addStatusBar(overlay, x, y + 36, 'HP', member.currentHp, stats.hp, 0x45e67a)
      this.addStatusBar(overlay, x, y + 58, 'MP', member.currentMp, stats.mp, 0x6db7ff)
      overlay.add(this.add.text(x + 220, y + 32, `ATK ${stats.atk}  DEF ${stats.def}  SPD ${stats.spd}  MAG ${stats.mag}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px' }))
      const equipment = `Weapon: ${this.itemName(member.equipment.weapon)}   Charm: ${this.itemName(member.equipment.charm)}   Relic: ${this.itemName(member.equipment.relic)}`
      overlay.add(this.add.text(x, y + 88, `${equipment}\nLevel progress: Showcase milestone ${member.level}/6`, { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }))
    })
    const close = this.add.text(width / 2, height / 2 + 216, 'Close', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    overlay.add(close)
  }

  private addStatusBar(container: Phaser.GameObjects.Container, x: number, y: number, label: string, current: number, max: number, color: number) {
    container.add(this.add.text(x, y - 8, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
    container.add(this.add.rectangle(x + 90, y, 134, 9, 0x12182d, 0.98).setOrigin(0.5))
    container.add(this.add.rectangle(x + 23, y, 130 * Phaser.Math.Clamp(current / max, 0, 1), 7, color, 0.95).setOrigin(0, 0.5))
    container.add(this.add.text(x + 164, y - 8, `${current}/${max}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
  }

  private itemName(itemId: string | null) {
    return itemId ? ITEMS_BY_ID[itemId]?.name ?? itemId : 'None'
  }

  private handleCameraZoom(deltaY: number) {
    if (!this.player) return
    const zoomStep = deltaY < 0 ? 0.15 : -0.15
    this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomStep, 0.4, 2)
    this.tweens.killTweensOf(this.cameras.main)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
    this.cameras.main.zoomTo(this.cameraZoom, 200, 'Sine.easeInOut', true)
  }

  private createMiniMap() {
    const container = this.add.container(this.scale.width - 176, 18).setScrollFactor(0).setDepth(120).setVisible(true)
    const graphics = this.add.graphics()
    container.add(graphics)
    this.miniMap = { container, graphics, visible: true }
    this.updateMiniMap()
  }

  private toggleMiniMap() {
    if (!this.miniMap) return
    this.miniMap.visible = !this.miniMap.visible
    this.miniMap.container.setVisible(this.miniMap.visible)
    audioManager.playSfx('ui_blip')
  }

  private updateMiniMap() {
    if (!this.miniMap || !this.miniMap.visible || !this.player) return
    const graphics = this.miniMap.graphics
    const width = 160
    const height = 120
    const padding = 8
    const mapWidth = width - padding * 2
    const mapHeight = height - padding * 2
    const scaleX = mapWidth / MAP_WIDTH
    const scaleY = mapHeight / MAP_HEIGHT
    const playerTile = this.worldToTile(this.player.x, this.player.y)
    graphics.clear()
    graphics.fillStyle(0x02030a, 0.72).fillRoundedRect(0, 0, width, height, 8)
    for (let y = 0; y < MAP_HEIGHT; y += 1) {
      for (let x = 0; x < MAP_WIDTH; x += 1) {
        const tile = MAP_LAYOUT[y]?.[x] ?? 'G'
        const color = tile === 'W' || tile === 'B' ? 0x1f2433 : tile === 'P' || tile === 'R' ? 0xd2b48c : 0x8fcf88
        graphics.fillStyle(color, 0.78).fillRect(padding + x * scaleX, padding + y * scaleY, Math.ceil(scaleX), Math.ceil(scaleY))
      }
    }
    const dot = (tile: { x: number; y: number }, color: number, size = 2.4) => {
      graphics.fillStyle(color, 1).fillCircle(padding + (tile.x + 0.5) * scaleX, padding + (tile.y + 0.5) * scaleY, size)
    }
    ;[GUIDE_TILE, ELDER_TILE, MERCHANT_TILE, ALLY_TILE].forEach((tile) => dot(tile, 0xfacc15))
    this.companions.filter((companion) => companion.state !== 'dead').forEach((companion, index) => dot(this.worldToTile(companion.x, companion.y), index % 2 === 0 ? 0x22c55e : 0x60a5fa, 2.4))
    this.treasureChests.filter((chest) => !chest.opened).forEach((chest) => dot(chest.tile, 0xffd166, 2.2))
    this.groundLoot.forEach((loot) => dot(this.worldToTile(loot.x, loot.y), 0xffd166, 1.8))
    this.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => dot(this.worldToTile(enemy.x, enemy.y), 0xef4444, enemy.isBoss ? 3.6 : 2.4))
    dot(playerTile, 0xf8fafc, 3.6)
    graphics.lineStyle(1, 0xd4a84b, 0.72).strokeRoundedRect(0.5, 0.5, width - 1, height - 1, 8)
  }

  private getRealtimeSkills(): RealtimeSkill[] {
    return [
      { name: 'Ember Slash', mpCost: 8, cooldown: 3000, color: 0xff7a3d, effect: 'emberSlash' },
      { name: 'Tidal Heal', mpCost: 12, cooldown: 6000, color: 0x45e67a, effect: 'tidalHeal' },
      { name: 'Stone Guard', mpCost: 10, cooldown: 8000, color: 0x9ca3af, effect: 'stoneGuard' },
      { name: 'Wind Step', mpCost: 6, cooldown: 2000, color: 0x9ff3ff, effect: 'windStep' },
    ]
  }

  private createSkillBar() {
    const skills = this.getRealtimeSkills()
    const x = this.scale.width / 2 - 114
    const y = this.scale.height - 92
    this.skillBar = this.add.container(x, y).setScrollFactor(0).setDepth(96)
    this.skillCooldownGraphics = []
    this.skillTexts = []
    this.skillSlotFrames = []
    skills.forEach((skill, index) => {
      const slotX = index * 76
      const frame = this.add.rectangle(slotX, 0, 58, 58, 0x0b0e1a, 0.92).setStrokeStyle(2, index === 0 ? 0xfff1a8 : 0xf3e1b0, index === 0 ? 0.95 : 0.55)
      this.skillSlotFrames.push(frame)
      this.skillBar!.add(frame)
      this.skillBar!.add(this.add.circle(slotX, -4, 16, skill.color, 0.9))
      this.skillBar!.add(this.add.text(slotX, -12, `${index + 1}`, { color: '#111827', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5))
      this.skillBar!.add(this.add.text(slotX, 15, `${skill.mpCost} MP`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5))
      this.skillBar!.add(this.add.text(slotX, 38, `${index + 1}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5))
      const cooldown = this.add.graphics()
      const text = this.add.text(slotX, -3, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold' }).setOrigin(0.5)
      this.skillCooldownGraphics.push(cooldown)
      this.skillTexts.push(text)
      this.skillBar!.add(cooldown)
      this.skillBar!.add(text)
    })
  }

  private updateSkillHud() {
    if (!this.skillBar) return
    const hero = this.saveData.party[0]
    const skills = this.getRealtimeSkills()
    this.skillCooldownGraphics.forEach((graphics, index) => {
      const skill = skills[index]
      const remaining = Math.max(0, this.skillReadyAt[index] - this.time.now)
      const disabled = hero.currentMp < skill.mpCost || remaining > 0
      graphics.clear()
      if (disabled) graphics.fillStyle(0x02030a, 0.62).fillRect(index * 76 - 29, -29, 58, 58)
      if (remaining > 0) graphics.fillStyle(0x111827, 0.78).slice(index * 76, 0, 30, -90, -90 + 360 * (remaining / skill.cooldown), true).fillPath()
      this.skillSlotFrames[index]?.setStrokeStyle(2, index === 0 ? 0xfff1a8 : 0xf3e1b0, index === 0 ? 0.95 : 0.55)
      this.skillTexts[index]?.setText(remaining > 0 ? `${Math.ceil(remaining / 1000)}` : hero.currentMp < skill.mpCost ? `${skill.mpCost} MP` : '')
    })
  }

  private openHelpOverlay() {
    if (this.helpOverlay) { this.helpOverlay.destroy(); this.helpOverlay = undefined; return }
    const { width, height } = this.scale
    const overlay = this.add.container(width / 2, height - 58).setScrollFactor(0).setDepth(230)
    overlay.add(this.add.rectangle(0, 0, 640, 34, 0x050713, 0.9).setStrokeStyle(1, 0x8ab4f8, 0.35))
    overlay.add(this.add.text(0, 0, 'WASD: Move | Space: Attack | 1-4: Skills | F: Block | Q: Potion | E: Interact', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px' }).setOrigin(0.5))
    this.helpOverlay = overlay
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

  private spawnEnemiesForStage() {
    this.mapEnemies.forEach((enemy) => this.destroyEnemy(enemy))
    this.mapEnemies = []
    if (this.saveData.stage === 'homecoming') return
    this.spawnRegularEnemiesForStage()
    if (!this.flag('field_battle_won') && (this.saveData.currentObjective === OBJECTIVES.winBattle || this.flag('field_marker_seen'))) {
      this.spawnStoryBoss('clay_sentinel', MARKER_TILE, FIELD_BATTLE_ID)
    }
    if (this.flag('archive_entered') && !this.flag('archive_skirmish_won')) {
      this.spawnStoryBoss('storm_wisp', ARCHIVE_TILE, ARCHIVE_SKIRMISH_ID)
    }
  }

  private spawnRegularEnemiesForStage() {
    const regularByStage: Record<SaveData['stage'], Array<{ ids: string[]; x: number; y: number }>> = {
      quay: [
        { ids: ['ash_slime', 'frost_shard', 'vinecrawler'], x: 8, y: 10 }, { ids: ['ash_slime', 'frost_shard'], x: 12, y: 13 }, { ids: ['vinecrawler', 'ash_slime'], x: 18, y: 10 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 31, y: 7 },
      ],
      field: [
        { ids: ['ash_slime', 'frost_shard'], x: 9, y: 10 }, { ids: ['vinecrawler', 'moss_knight', 'sporefiend'], x: 20, y: 9 }, { ids: ['moss_knight', 'sporefiend', 'glass_scorpion'], x: 25, y: 12 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 33, y: 8 }, { ids: ['storm_wisp', 'clay_sentinel'], x: 36, y: 11 },
      ],
      shrine: [
        { ids: ['frost_shard', 'ash_slime'], x: 20, y: 5 }, { ids: ['storm_wisp', 'hollow_wisp'], x: 29, y: 5 }, { ids: ['hollow_wisp', 'clay_sentinel'], x: 32, y: 7 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 35, y: 9 }, { ids: ['frost_shard', 'storm_wisp'], x: 30, y: 11 },
      ],
      archive: [
        { ids: ['vinecrawler', 'sporefiend'], x: 16, y: 17 }, { ids: ['hollow_wisp', 'storm_wisp'], x: 22, y: 17 }, { ids: ['archive_guardian', 'clay_sentinel'], x: 19, y: 20 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 27, y: 20 }, { ids: ['hollow_wisp', 'clay_sentinel'], x: 21, y: 24 },
      ],
      skywell: [
        { ids: ['hollow_wisp', 'storm_wisp'], x: 31, y: 22 }, { ids: ['clay_sentinel', 'storm_wisp'], x: 34, y: 23 }, { ids: ['emberglass_wisp', 'memory_phantom'], x: 36, y: 24 }, { ids: ['void_walker', 'skywell_guardian'], x: 36, y: 26 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 32, y: 28 },
      ],
      homecoming: [],
    }
    regularByStage[this.saveData.stage].forEach((spawn, index) => this.spawnMapEnemy(spawn.ids[Phaser.Math.Between(0, spawn.ids.length - 1)], spawn.x, spawn.y, false, `${this.saveData.stage}-${index}`))
    for (let attempt = 0; attempt < REGULAR_ENEMY_TARGET_COUNT && this.mapEnemies.filter((enemy) => !enemy.isBoss && !enemy.dead).length < REGULAR_ENEMY_TARGET_COUNT; attempt += 1) {
      this.spawnRandomRegularEnemyForStage()
    }
    this.spawnMinibossForStage()
  }

  private spawnRandomRegularEnemyForStage() {
    const spawnPool: Record<SaveData['stage'], string[]> = {
      quay: ['ash_slime', 'frost_shard', 'vinecrawler', 'storm_wisp'],
      field: ['ash_slime', 'frost_shard', 'vinecrawler', 'moss_knight', 'sporefiend', 'glass_scorpion'],
      shrine: ['frost_shard', 'storm_wisp', 'hollow_wisp', 'clay_sentinel'],
      archive: ['vinecrawler', 'sporefiend', 'hollow_wisp', 'storm_wisp', 'archive_guardian'],
      skywell: ['hollow_wisp', 'storm_wisp', 'clay_sentinel', 'emberglass_wisp', 'memory_phantom', 'void_walker'],
      homecoming: [],
    }
    const ids = spawnPool[this.saveData.stage]
    if (!ids.length) return
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const tileX = Phaser.Math.Between(3, MAP_WIDTH - 4)
      const tileY = Phaser.Math.Between(3, MAP_HEIGHT - 4)
      const x = this.tileCenter(tileX)
      const y = this.tileCenter(tileY)
      if (this.isWallAtWorld(x, y)) continue
      if (this.player && Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y) < 220) continue
      if (this.mapEnemies.some((enemy) => !enemy.dead && Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y) < 180)) continue
      this.spawnMapEnemy(ids[Phaser.Math.Between(0, ids.length - 1)], tileX, tileY, false, `${this.saveData.stage}-respawn-${this.time.now}-${attempt}`)
      return
    }
  }

  private spawnMinibossForStage() {
    const minibossByStage: Record<SaveData['stage'], { id: string; x: number; y: number } | null> = {
      quay: { id: 'clay_sentinel', x: 34, y: 10 },
      field: { id: 'moss_knight', x: 30, y: 12 },
      shrine: { id: 'hollow_wisp', x: 34, y: 8 },
      archive: { id: 'archive_guardian', x: 22, y: 23 },
      skywell: { id: 'skywell_guardian', x: 35, y: 25 },
      homecoming: null,
    }
    const miniboss = minibossByStage[this.saveData.stage]
    if (!miniboss || this.mapEnemies.some((enemy) => enemy.id === `${this.saveData.stage}-miniboss` && !enemy.dead)) return
    this.spawnMapEnemy(miniboss.id, miniboss.x, miniboss.y, true, `${this.saveData.stage}-miniboss`)
  }

  private spawnStoryBoss(enemyId: string, tile: { x: number; y: number }, battleId: string) {
    if (this.mapEnemies.some((enemy) => enemy.battleId === battleId && !enemy.dead)) return
    this.showBossIntro(enemyId)
    this.spawnMapEnemy(enemyId, tile.x, tile.y, true, battleId, battleId)
  }

  private spawnMapEnemy(enemyId: string, tileX: number, tileY: number, isBoss: boolean, uniqueId: string, battleId?: string) {
    const data = ENEMIES_BY_ID[enemyId]
    if (!data) return
    const x = this.tileCenter(tileX)
    const y = this.tileCenter(tileY)
    const color = isBoss ? 0xb91c1c : enemyId === 'moonwake_guardian' ? 0x4da6ff : enemyId === 'thornheart' ? 0x3aa657 : enemyId === 'cartographers_lie' ? 0x8f63ff : data.region === 'moonwake' ? 0x8bd6ff : data.region === 'skywell' ? 0xbda7ff : 0x75c46b
    const size = isBoss ? 92 : 44
    const aura = isBoss ? this.add.circle(x, y, size * 0.72, color, 0.18).setDepth(17).setStrokeStyle(4, 0xfff1a8, 0.26) : undefined
    const { container: sprite, body } = this.createEnemyVisual(enemyId, x, y, color, isBoss)
    const targetScale = isBoss ? ENTITY_SCALE.bossEnemy : ENTITY_SCALE.enemy
    sprite.setAlpha(0).setScale(targetScale * 0.9)
    const hpBarBg = this.add.graphics().setDepth(19)
    const hpBar = this.add.graphics().setDepth(20)
    const nameText = this.add.text(x, y - size, data.name, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5).setDepth(21)
    nameText.setAlpha(0)
    const stats = { ...data.stats, hp: isBoss ? data.stats.hp * 5 : data.stats.hp, atk: Math.max(1, Math.round((isBoss ? data.stats.atk * 2 : data.stats.atk) * 0.92)) }
    const enemy: MapEnemy = { id: uniqueId, enemyId, sprite, body, aura, hpBar, hpBarBg, nameText, currentHp: stats.hp, maxHp: stats.hp, currentMp: data.stats.mp, maxMp: data.stats.mp, stats, x, y, speed: isBoss ? 42 : 55 + data.stats.spd, element: data.skills[0]?.element ?? 'neutral', weaknesses: data.weaknesses, resists: data.resists, skills: data.skills, state: 'idle', aggroRange: isBoss ? 340 : 240, attackRange: isBoss ? 78 : 50, attackCooldown: isBoss ? 1450 : 1600, lastAttackTime: 0, wanderTimer: 0, wanderTarget: null, hitFlashTimer: 0, isBoss, dead: false, expReward: isBoss ? data.expReward * 5 : Math.ceil(data.expReward * 1.25), goldReward: isBoss ? data.goldReward * 3 : data.goldReward, battleId }
    this.mapEnemies.push(enemy)
    this.updateEnemyBars(enemy)
    this.tweens.add({ targets: sprite, alpha: 0.95, scale: targetScale, duration: 400, ease: 'Back.easeOut' })
    this.tweens.add({ targets: sprite, scale: targetScale * 1.02, yoyo: true, repeat: -1, duration: 750, ease: 'Sine.easeInOut' })
    if (aura) this.tweens.add({ targets: aura, scale: ENTITY_SCALE.object * 1.87, alpha: 0.08, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' })
    this.tweens.add({ targets: nameText, alpha: 1, duration: 320 })
    if (isBoss) this.createBossHud(enemy)
  }

  private createEnemyVisual(enemyId: string, x: number, y: number, color: number, isBoss: boolean) {
    const container = this.add.container(x, y).setDepth(18).setName(`enemy:${enemyId}`)
    const scale = isBoss ? 1.55 : 1
    const shadow = this.add.ellipse(0, 20 * scale, 42 * scale, 14 * scale, 0x050713, 0.34)
    const body = this.add.ellipse(0, 0, 34 * scale, 40 * scale, color, 0.96).setStrokeStyle(isBoss ? 4 : 2, isBoss ? 0xfff1a8 : 0xffffff, isBoss ? 0.72 : 0.38)
    const eyeColor = enemyId.includes('moon') ? 0xc7f9ff : enemyId.includes('thorn') ? 0xfff1a8 : enemyId.includes('cartographer') ? 0xf0abfc : 0xffef9f
    const details: Phaser.GameObjects.GameObject[] = [shadow]

    if (enemyId.includes('thorn') || enemyId.includes('sprig') || enemyId.includes('root')) {
      details.push(this.add.triangle(-12 * scale, -19 * scale, 0, 16, 8, -12, 16, 16, 0x173b20, 0.9))
      details.push(this.add.triangle(12 * scale, -19 * scale, 0, 16, 8, -12, 16, 16, 0x173b20, 0.9))
      details.push(this.add.rectangle(-19 * scale, 5 * scale, 14 * scale, 5 * scale, 0x2f7d3f, 0.85).setRotation(-0.55))
      details.push(this.add.rectangle(19 * scale, 5 * scale, 14 * scale, 5 * scale, 0x2f7d3f, 0.85).setRotation(0.55))
    } else if (enemyId.includes('moon') || enemyId.includes('tide')) {
      details.push(this.add.arc(-20 * scale, 1 * scale, 18 * scale, 292, 68, false, 0x9bdcff, 0.2).setStrokeStyle(5 * scale, 0xc7f9ff, 0.72))
      details.push(this.add.arc(20 * scale, 1 * scale, 18 * scale, 112, 248, false, 0x9bdcff, 0.2).setStrokeStyle(5 * scale, 0xc7f9ff, 0.72))
      details.push(this.add.ellipse(0, 12 * scale, 22 * scale, 6 * scale, 0xe0f2fe, 0.28))
    } else if (enemyId.includes('cartographer') || enemyId.includes('sky')) {
      details.push(this.add.triangle(0, -27 * scale, 0, -16, 10, 8, -10, 8, 0x2e1065, 0.95))
      details.push(this.add.circle(-18 * scale, -6 * scale, 6 * scale, 0xbda7ff, 0.42))
      details.push(this.add.circle(18 * scale, -6 * scale, 6 * scale, 0xbda7ff, 0.42))
      details.push(this.add.rectangle(0, 16 * scale, 26 * scale, 4 * scale, 0xf0abfc, 0.45).setRotation(0.28))
    } else {
      details.push(this.add.triangle(-12 * scale, -22 * scale, 0, 16, 8, -10, 16, 16, 0x3b2417, 0.92))
      details.push(this.add.triangle(12 * scale, -22 * scale, 0, 16, 8, -10, 16, 16, 0x3b2417, 0.92))
      details.push(this.add.arc(0, 9 * scale, 16 * scale, 20, 160, false, 0xffd166, 0).setStrokeStyle(3 * scale, 0xffd166, 0.55))
    }

    details.push(body)
    details.push(this.add.circle(-7 * scale, -5 * scale, 3.5 * scale, eyeColor, 0.98))
    details.push(this.add.circle(7 * scale, -5 * scale, 3.5 * scale, eyeColor, 0.98))
    details.push(this.add.circle(-6 * scale, -6 * scale, 1.2 * scale, 0x111827, 0.95))
    details.push(this.add.circle(8 * scale, -6 * scale, 1.2 * scale, 0x111827, 0.95))
    container.add(details)
    return { container, body }
  }

  private updateMapEnemies(delta: number) {
    if (!this.player) return
    const seconds = delta / 1000
    this.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const companionTarget = Math.random() < 0.3 ? this.getNearestCompanion(enemy) : null
      const targetX = companionTarget?.x ?? this.player!.x
      const targetY = companionTarget?.y ?? this.player!.y
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY)
      enemy.state = distance <= enemy.attackRange ? 'attack' : distance <= enemy.aggroRange ? 'chase' : 'idle'
      if (enemy.state === 'chase') this.moveEnemyToward(enemy, targetX, targetY, enemy.speed * seconds)
      if (enemy.state === 'idle') this.updateEnemyWander(enemy, delta, seconds)
      if (enemy.state === 'attack') {
        if (companionTarget) this.tryEnemyAttackCompanion(enemy, companionTarget)
        else this.tryEnemyAttack(enemy)
      }
      if (enemy.hitFlashTimer > 0) { enemy.hitFlashTimer -= delta; if (enemy.hitFlashTimer <= 0) enemy.body.setFillStyle(this.getEnemyColor(enemy)) }
      enemy.sprite.setPosition(enemy.x, enemy.y)
      enemy.aura?.setPosition(enemy.x, enemy.y)
      this.updateEnemyBars(enemy)
    })
  }

  private getNearestCompanion(enemy: MapEnemy): PartyCompanion | null {
    let nearest: PartyCompanion | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    this.companions.filter((companion) => companion.state !== 'dead').forEach((companion) => {
      const member = this.saveData.party[companion.partyIndex]
      if (!member || member.currentHp <= 0) return
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, companion.x, companion.y)
      if (distance < nearestDistance) {
        nearest = companion
        nearestDistance = distance
      }
    })
    return nearest
  }

  private updateEnemyWander(enemy: MapEnemy, delta: number, seconds: number) {
    enemy.wanderTimer -= delta
    if (!enemy.wanderTarget || enemy.wanderTimer <= 0) {
      const tile = this.worldToTile(enemy.x, enemy.y)
      enemy.wanderTarget = { x: this.tileCenter(Phaser.Math.Clamp(tile.x + Phaser.Math.Between(-3, 3), 1, MAP_WIDTH - 2)), y: this.tileCenter(Phaser.Math.Clamp(tile.y + Phaser.Math.Between(-3, 3), 1, MAP_HEIGHT - 2)) }
      enemy.wanderTimer = Phaser.Math.Between(900, 2200)
    }
    this.moveEnemyToward(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed * 0.45 * seconds)
  }

  private moveEnemyToward(enemy: MapEnemy, targetX: number, targetY: number, distance: number) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY)
    const nextX = enemy.x + Math.cos(angle) * distance
    const nextY = enemy.y + Math.sin(angle) * distance
    if (!this.isWallAtWorld(nextX, enemy.y)) enemy.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
    if (!this.isWallAtWorld(enemy.x, nextY)) enemy.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
  }

  private performPlayerAttack(pointerX?: number, pointerY?: number) {
    if (!this.player || this.isBlocking || this.time.now < this.nextPlayerAttackAt) return
    this.nextPlayerAttackAt = this.time.now + 320
    if (pointerX !== undefined && pointerY !== undefined) this.updateFacingFromVector(pointerX - this.player.x, pointerY - this.player.y)
    const angle = this.facingToAngle()
    if (this.player instanceof Phaser.GameObjects.Sprite) this.player.play(`nara-attack-${this.facing}`, true)
    const swingX = this.player.x + Math.cos(angle) * 34
    const swingY = this.player.y + Math.sin(angle) * 34
    const swing = this.add.arc(swingX, swingY, 38, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0x9ff3ff, 0.32).setDepth(25).setStrokeStyle(7, 0xf8fdff, 0.9)
    this.tweens.add({ targets: swing, alpha: 0, scale: ENTITY_SCALE.object * 1.97, duration: 150, ease: 'Sine.easeOut', onComplete: () => swing.destroy() })
    audioManager.playSfx('field_interact')
    let hit = false
    this.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.player!.x, this.player!.y, enemy.x, enemy.y)
      const enemyAngle = Phaser.Math.Angle.Between(this.player!.x, this.player!.y, enemy.x, enemy.y)
      if (distance <= 60 && Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) <= Math.PI / 4) { hit = true; this.damageEnemy(enemy) }
    })
    if (hit) this.cameras.main.shake(100, 0.002)
  }

  private damageEnemy(enemy: MapEnemy, multiplier = 1) {
    const heroStats = this.getPlayerCombatStats()
    const damage = Math.max(1, Math.round(CombatSystem.calculateRealtimePlayerDamage(heroStats.atk, enemy.stats.def) * multiplier * this.getComboDamageMultiplier()))
    const critical = damage > heroStats.atk * 1.5
    enemy.currentHp = Math.max(0, enemy.currentHp - damage)
    enemy.hitFlashTimer = 80
    enemy.body.setFillStyle(0xffffff)
    this.showDamageNumber(enemy.x, enemy.y - 22, damage, 'player', critical)
    this.triggerHitstop(enemy.isBoss ? 50 : 30)
    this.updateEnemyBars(enemy)
    if (enemy.currentHp <= 0) this.killEnemy(enemy)
  }

  private useRealtimeSkill(index: number) {
    if (!this.player) return
    const skill = this.getRealtimeSkills()[index]
    const hero = this.saveData.party[0]
    if (!skill || !CombatSystem.canUseRealtimeSkill(hero.currentMp, skill.mpCost, this.time.now, this.skillReadyAt[index])) return
    hero.currentMp = Math.max(0, hero.currentMp - skill.mpCost)
    this.skillReadyAt[index] = this.time.now + skill.cooldown
    if (skill.effect === 'emberSlash') this.performEmberSlash()
    if (skill.effect === 'tidalHeal') this.performTidalHeal()
    if (skill.effect === 'stoneGuard') this.performStoneGuard()
    if (skill.effect === 'windStep') this.performWindStep()
    this.refreshHud(); this.updatePlayerBars(); this.persist()
  }

  private performEmberSlash() {
    if (!this.player) return
    const angle = this.facingToAngle()
    const arc = this.add.arc(this.player.x + Math.cos(angle) * 42, this.player.y + Math.sin(angle) * 42, 52, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0xff7a3d, 0.5).setDepth(26).setStrokeStyle(8, 0xfff1a8, 0.85)
    this.tweens.add({ targets: arc, alpha: 0, scale: ENTITY_SCALE.object * 2.08, duration: 240, onComplete: () => arc.destroy() })
    this.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.player!.x, this.player!.y, enemy.x, enemy.y)
      const enemyAngle = Phaser.Math.Angle.Between(this.player!.x, this.player!.y, enemy.x, enemy.y)
      if (distance <= 82 && Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) <= Math.PI / 3) this.damageEnemy(enemy, 2)
    })
  }

  private performTidalHeal() {
    if (!this.player) return
    const hero = this.saveData.party[0]
    const maxHp = this.getPlayerCombatStats().hp
    const heal = Math.ceil(maxHp * 0.3)
    hero.currentHp = Math.min(maxHp, hero.currentHp + heal)
    this.showDamageNumber(this.player.x, this.player.y - 34, heal, 'heal')
    this.cameras.main.flash(140, 60, 220, 120, false)
  }

  private performStoneGuard() {
    if (!this.player) return
    this.stoneGuardUntil = this.time.now + 4000
    const ring = this.add.circle(this.player.x, this.player.y, 30, 0x9ca3af, 0.2).setDepth(24).setStrokeStyle(3, 0xe5e7eb, 0.9)
    this.tweens.add({ targets: ring, scale: ENTITY_SCALE.object * 2.83, alpha: 0, duration: 520, onComplete: () => ring.destroy() })
  }

  private performWindStep() {
    if (!this.player) return
    const angle = this.facingToAngle()
    const targetX = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * 120, this.player.width / 2, MAP_WIDTH * TILE_SIZE - this.player.width / 2)
    const targetY = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * 120, this.player.height / 2, MAP_HEIGHT * TILE_SIZE - this.player.height / 2)
    if (!this.collidesAt(targetX, targetY)) this.player.setPosition(targetX, targetY)
    this.cameras.main.flash(80, 159, 243, 255, false)
  }

  private tryEnemyAttack(enemy: MapEnemy) {
    if (!this.player || this.time.now - enemy.lastAttackTime < enemy.attackCooldown) return
    enemy.lastAttackTime = this.time.now
    enemy.body.setFillStyle(0xff4d4d)
    this.time.delayedCall(300, () => {
      if (enemy.dead || !this.player || this.time.now < this.playerInvulnerableUntil || Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) > enemy.attackRange + 12) return
      const blocking = this.isBlocking
      const guarded = this.time.now < this.stoneGuardUntil
      const multiplier = (blocking ? 0.4 : 1) * (guarded ? 0.5 : 1)
      const damage = CombatSystem.calculateRealtimeEnemyDamage(enemy.stats.atk, this.getPlayerCombatStats().def, multiplier)
      const hero = this.saveData.party[0]
      hero.currentHp = Math.max(0, hero.currentHp - damage)
      this.cameras.main.flash(100, 180, 20, 20, false)
      this.cameras.main.shake(150, 0.003)
      if (blocking) this.showBlockFlash()
      this.showDamageDirection(enemy.x, enemy.y)
      this.showDamageNumber(this.player.x, this.player.y - 26, damage, 'enemy')
      this.refreshHud()
      this.updatePlayerBars()
      if (hero.currentHp <= 0) this.handlePlayerDefeat()
    })
  }

  private tryEnemyAttackCompanion(enemy: MapEnemy, companion: PartyCompanion) {
    if (this.time.now - enemy.lastAttackTime < enemy.attackCooldown) return
    enemy.lastAttackTime = this.time.now
    enemy.body.setFillStyle(0xff4d4d)
    this.time.delayedCall(300, () => {
      if (enemy.dead || companion.state === 'dead' || Phaser.Math.Distance.Between(enemy.x, enemy.y, companion.x, companion.y) > enemy.attackRange + 12) return
      const member = this.saveData.party[companion.partyIndex]
      const character = member ? CHARACTERS[member.characterId] : undefined
      if (!member || !character) return
      const stats = this.scaleCharacterStats(character, member.level)
      const damage = CombatSystem.calculateRealtimeEnemyDamage(enemy.stats.atk, stats.def)
      member.currentHp = Math.max(0, member.currentHp - damage)
      this.showDamageNumber(companion.x, companion.y - 26, damage, 'enemy')
      companion.body.setFillStyle(0xff4d4d)
      this.time.delayedCall(120, () => companion.body.setFillStyle(companion.characterId === 'kael' ? 0x5c8a4d : 0x7fb3ff, 0.94))
      if (member.currentHp <= 0) {
        companion.state = 'dead'
        companion.container.setAlpha(0.3)
        this.showToast(`${companion.name} falls!`)
      }
      this.updateCompanionBars(companion)
      this.refreshHud()
      this.persist()
    })
  }

  private killEnemy(enemy: MapEnemy) {
    enemy.dead = true
    enemy.state = 'dead'
    this.killCount += 1
    enemy.body.setFillStyle(0xffffff)
    this.cameras.main.shake(enemy.isBoss ? 400 : 200, enemy.isBoss ? 0.008 : 0.004)
    if (enemy.isBoss) this.triggerSlowMo(300, 0.3)
    this.spawnDeathExplosion(enemy.x, enemy.y, this.getEnemyColor(enemy))
    if (enemy.isBoss) {
      this.spawnBossExplosion(enemy.x, enemy.y)
      this.bossHud?.container.destroy()
      this.bossHud = undefined
    }
    this.registerComboKill(enemy.x, enemy.y)
    this.showFloatingText(enemy.x, enemy.y - 34, `+${enemy.goldReward}g`, '#ffd166')
    this.spawnGroundLoot(enemy.x, enemy.y, 'gold', 'gold', enemy.goldReward)
    this.spawnGroundLoot(enemy.x + 12, enemy.y, 'exp', 'exp', enemy.expReward)
    if (Math.random() < 0.35) this.spawnGroundLoot(enemy.x - 12, enemy.y, 'item', 'health_potion', 1)
    this.tweens.add({ targets: [enemy.sprite, enemy.aura, enemy.nameText], alpha: 0, delay: 100, duration: 260, onComplete: () => this.destroyEnemy(enemy) })
    if (enemy.battleId) this.completeOverworldBattle(enemy.battleId)
    this.checkRespawnTimer()
    this.refreshHud()
    this.persist()
  }

  private completeOverworldBattle(battleId: string) {
    const result = { battleId, victory: true, rewards: { exp: 0, gold: 0, emberShards: 0, items: [] } }
    this.initData.battleResult = result
    this.applyBattleResult()
    this.initData.battleResult = undefined
  }

  private destroyEnemy(enemy: MapEnemy) {
    enemy.sprite.destroy(); enemy.aura?.destroy(); enemy.hpBar.destroy(); enemy.hpBarBg.destroy(); enemy.nameText.destroy()
  }

  private spawnGroundLoot(x: number, y: number, kind: GroundLoot['kind'], itemId: string, quantity: number) {
    const color = kind === 'exp' ? 0x60a5fa : kind === 'gold' ? 0xffd166 : 0xffb84d
    const radius = kind === 'gold' ? 6 : 8
    const sprite = this.add.circle(x, y, radius, color, 0.95).setDepth(17).setStrokeStyle(2, 0xffffff, 0.6)
    const labelText = kind === 'gold' ? `+${quantity}g` : kind === 'exp' ? `+${quantity} EXP` : this.getItemName(itemId)
    const label = this.add.text(x, y - 20, labelText, { color: kind === 'exp' ? '#bfdbfe' : '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(18)
    const bobTween = this.tweens.add({ targets: [sprite, label], y: '+=3', yoyo: true, repeat: -1, duration: 760, ease: 'Sine.easeInOut' })
    const loot: GroundLoot = { x, y, itemId, quantity, sprite, label, bobTween, kind }
    loot.expireTween = this.tweens.add({ targets: [sprite, label], alpha: 0, delay: 14500, duration: 500, onComplete: () => this.destroyGroundLoot(loot) })
    this.groundLoot.push(loot)
  }

  private updateGroundLoot() {
    if (!this.player) return
    this.groundLoot.slice().forEach((loot) => {
      const distance = Phaser.Math.Distance.Between(this.player!.x, this.player!.y, loot.sprite.x, loot.sprite.y)
      if (distance <= 60) {
        loot.bobTween.pause()
        loot.sprite.x = Phaser.Math.Linear(loot.sprite.x, this.player!.x, distance < 24 ? 0.45 : 0.18)
        loot.sprite.y = Phaser.Math.Linear(loot.sprite.y, this.player!.y, distance < 24 ? 0.45 : 0.18)
        loot.label.setPosition(loot.sprite.x, loot.sprite.y - 20)
      }
      if (distance <= 18) this.pickupGroundLoot(loot)
    })
  }

  private pickupGroundLoot(loot: GroundLoot) {
    if (!this.player) return
    if (loot.kind === 'gold') {
      this.saveData.gold += loot.quantity
      this.saveData.battleRewards.gold += loot.quantity
      this.showFloatingText(this.player.x, this.player.y - 32, `+${loot.quantity}g`, '#ffd166')
      this.flashGoldCounter(loot.quantity)
    } else if (loot.kind === 'exp') {
      this.gainRealtimeExp(loot.quantity)
      this.showFloatingText(this.player.x, this.player.y - 32, `+${loot.quantity} EXP`, '#93c5fd')
    } else {
      this.addInventory(loot.itemId, loot.quantity)
      this.showFloatingText(this.player.x, this.player.y - 32, `+${loot.quantity} ${this.getItemName(loot.itemId)}`, '#fff1a8')
    }
    audioManager.playSfx('reward_gain')
    this.spawnPickupDing(loot.sprite.x, loot.sprite.y)
    this.destroyGroundLoot(loot)
    this.refreshHud(); this.persist()
  }

  private destroyGroundLoot(loot: GroundLoot) {
    this.groundLoot = this.groundLoot.filter((entry) => entry !== loot)
    loot.bobTween.stop(); loot.expireTween?.stop(); loot.sprite.destroy(); loot.label.destroy()
  }

  private gainRealtimeExp(amount: number) {
    const previousLevels = new Map(this.saveData.party.map((member) => [member.characterId, member.level]))
    this.saveData.battleRewards.exp += amount
    const nextLevel = Math.min(6, 1 + Math.floor(this.saveData.battleRewards.exp / 180))
    const leveledUp = this.saveData.party.some((member) => nextLevel > (previousLevels.get(member.characterId) ?? member.level))
    if (leveledUp) {
      this.saveData.party.forEach((member) => { member.level = Math.max(member.level, nextLevel) })
      this.showLevelUpEffect()
    }
  }

  private checkRespawnTimer() {
    if (this.respawnTimer || this.saveData.stage === 'homecoming') return
    this.respawnTimer = this.time.delayedCall(ENEMY_RESPAWN_DELAY, () => {
      this.respawnTimer = undefined
      this.mapEnemies = this.mapEnemies.filter((enemy) => enemy.isBoss || !enemy.dead)
      this.spawnRandomRegularEnemyForStage()
      this.showToast('New threats emerge...')
    })
  }

  private registerComboKill(x: number, y: number) {
    this.comboCount = this.time.now - this.lastComboHitAt <= 3000 ? this.comboCount + 1 : 1
    this.lastComboHitAt = this.time.now
    const color = this.getComboColor(this.comboCount)
    if (this.comboCount > 1) {
      const label = this.add.text(x, y - 48, `${this.comboCount}x COMBO`, { color, fontFamily: 'Arial, sans-serif', fontSize: this.comboCount >= 3 ? '18px' : '14px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(82)
      label.setScale(this.comboCount >= 3 ? ENTITY_SCALE.hero * 1.88 : ENTITY_SCALE.object / ENTITY_SCALE.object)
      this.tweens.add({ targets: label, y: y - 82, alpha: 0, scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 780, ease: 'Sine.easeOut', onComplete: () => label.destroy() })
    }
    if (this.comboCount === 5 || this.comboCount === 10 || this.comboCount === 15) {
      const milestone = this.comboCount === 5 ? 'UNSTOPPABLE!' : this.comboCount === 10 ? 'LEGENDARY!' : 'MYTHIC!'
      this.cameras.main.shake(180, 0.005)
      this.triggerSlowMo(220, 0.55)
      this.showFloatingText(this.player?.x ?? x, (this.player?.y ?? y) - 58, milestone, color)
    }
  }

  private getComboColor(combo: number) {
    if (combo >= 8) return '#ef4444'
    if (combo >= 5) return '#fb923c'
    if (combo >= 3) return '#fef08a'
    return '#ffffff'
  }

  private getComboDamageMultiplier() {
    if (this.time.now - this.lastComboHitAt > 3000) return 1
    const tier = this.comboCount >= 8 ? 4 : this.comboCount >= 5 ? 3 : this.comboCount >= 3 ? 2 : this.comboCount >= 1 ? 1 : 0
    return 1 + tier * 0.05
  }

  private updateComboHud() {
    if (!this.comboText) return
    if (this.comboCount > 0 && this.time.now - this.lastComboHitAt > 3000) this.comboCount = 0
    if (this.comboCount <= 1) {
      this.comboText.setText('')
      return
    }
    this.comboText.setText(`${this.comboCount}x COMBO`).setColor(this.getComboColor(this.comboCount))
  }

  private flashGoldCounter(amount: number) {
    if (!this.inventoryText) return
    const flash = this.add.text(this.inventoryText.x + 42, this.inventoryText.y - 18, `+${amount}`, { color: '#ffd166', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(96)
    this.tweens.add({ targets: [this.inventoryText, flash], alpha: 0.45, yoyo: true, duration: 80, repeat: 1, onComplete: () => flash.destroy() })
  }

  private spawnPickupDing(x: number, y: number) {
    const ring = this.add.circle(x, y, 8, 0xffffff, 0).setDepth(28).setStrokeStyle(2, 0xfff1a8, 0.82)
    this.tweens.add({ targets: ring, scale: ENTITY_SCALE.object * 4.67, alpha: 0, duration: 360, ease: 'Sine.easeOut', onComplete: () => ring.destroy() })
  }

  private spawnDeathExplosion(x: number, y: number, color = 0xffd166) {
    const count = Phaser.Math.Between(8, 12)
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.22, 0.22)
      const distance = Phaser.Math.Between(22, 52)
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.9).setDepth(30)
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, alpha: 0, scale: ENTITY_SCALE.object * 0.25, duration: Phaser.Math.Between(380, 680), ease: 'Sine.easeOut', onComplete: () => particle.destroy() })
    }
  }

  private spawnBossExplosion(x: number, y: number) {
    this.cameras.main.flash(240, 255, 96, 96, false)
    for (let index = 0; index < 18; index += 1) {
      const angle = (Math.PI * 2 * index) / 18
      const particle = this.add.circle(x, y, 5, index % 2 === 0 ? 0xff6b6b : 0xffd166, 0.95).setDepth(25)
      this.tweens.add({ targets: particle, x: x + Math.cos(angle) * Phaser.Math.Between(42, 92), y: y + Math.sin(angle) * Phaser.Math.Between(42, 92), scale: ENTITY_SCALE.object * 0.33, alpha: 0, duration: 720, onComplete: () => particle.destroy() })
    }
  }

  private showLevelUpEffect() {
    if (!this.player) return
    const flash = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xffd166, 0.3).setScrollFactor(0).setDepth(130)
    const title = this.add.text(this.scale.width / 2, this.scale.height / 2 - 24, 'LEVEL UP!', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '42px', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 4, fill: true } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const stats = this.add.text(this.scale.width / 2, this.scale.height / 2 + 24, 'ATK +2   DEF +1   HP +8', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const glow = this.add.circle(this.player.x, this.player.y, 28, 0xffd166, 0.22).setDepth(24).setStrokeStyle(4, 0xfff1a8, 0.85)
    audioManager.playSfx('level_up')
    this.triggerSlowMo(200, 0.25)
    this.companions.forEach((companion) => {
      companion.body.setFillStyle(0xffd166, 0.96)
      this.time.delayedCall(420, () => companion.body.setFillStyle(companion.characterId === 'kael' ? 0x5c8a4d : 0x7fb3ff, 0.94))
    })
    this.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() })
    this.tweens.add({ targets: [title, stats], y: '-=36', alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => { title.destroy(); stats.destroy() } })
    this.tweens.add({ targets: glow, scale: ENTITY_SCALE.object * 3.33, alpha: 0, duration: 850, onComplete: () => glow.destroy() })
  }

  private spawnHealPulse(x: number, y: number) {
    const pulse = this.add.circle(x, y, 20, 0x86efac, 0.18).setDepth(25).setStrokeStyle(3, 0xbbf7d0, 0.85)
    this.tweens.add({ targets: pulse, scale: ENTITY_SCALE.object * 3, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => pulse.destroy() })
  }

  private spawnKaelSlash(companion: PartyCompanion, enemy: MapEnemy) {
    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, enemy.x, enemy.y)
    const slash = this.add.arc(companion.x + Math.cos(angle) * 24, companion.y + Math.sin(angle) * 24, 34, Phaser.Math.RadToDeg(angle - Math.PI / 2.8), Phaser.Math.RadToDeg(angle + Math.PI / 2.8), false, 0xff4d2e, 0.34).setDepth(26).setStrokeStyle(6, 0xffb347, 0.86)
    this.tweens.add({ targets: slash, scale: ENTITY_SCALE.object * 2.03, alpha: 0, duration: 180, ease: 'Sine.easeOut', onComplete: () => slash.destroy() })
  }

  private spawnHealSparkles(x: number, y: number) {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4
      const sparkle = this.add.circle(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8), 3, 0x86efac, 0.85).setDepth(26)
      this.tweens.add({ targets: sparkle, x: x + Math.cos(angle) * Phaser.Math.Between(14, 28), y: y + Math.sin(angle) * Phaser.Math.Between(14, 28), alpha: 0, scale: ENTITY_SCALE.object * 0.335, duration: 420, onComplete: () => sparkle.destroy() })
    }
  }

  private getEnemyColor(enemy: MapEnemy) {
    if (enemy.enemyId === 'moonwake_guardian') return 0x4da6ff
    if (enemy.enemyId === 'thornheart') return 0x3aa657
    if (enemy.enemyId === 'cartographers_lie') return 0x8f63ff
    return enemy.isBoss ? 0xb91c1c : 0x75c46b
  }

  private createBossHud(enemy: MapEnemy) {
    this.bossHud?.container.destroy()
    const container = this.add.container(this.scale.width / 2, 116).setScrollFactor(0).setDepth(125)
    const nameText = this.add.text(0, -20, enemy.nameText.text, { color: '#ffe4b5', fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5)
    const bar = this.add.graphics()
    container.add([nameText, bar])
    this.bossHud = { container, bar, nameText }
    this.updateBossHud(enemy)
  }

  private updateBossHud(enemy: MapEnemy) {
    if (!this.bossHud || enemy.dead) return
    const width = 420
    const pct = Phaser.Math.Clamp(enemy.currentHp / enemy.maxHp, 0, 1)
    this.bossHud.bar.clear()
    this.bossHud.bar.fillStyle(0x050509, 0.88).fillRoundedRect(-width / 2, 0, width, 16, 6)
    this.bossHud.bar.fillStyle(0x991b1b, 1).fillRoundedRect(-width / 2 + 2, 2, (width - 4) * pct, 12, 5)
    this.bossHud.bar.lineStyle(2, 0xffd166, 0.72).strokeRoundedRect(-width / 2, 0, width, 16, 6)
    this.bossHud.nameText.setText(enemy.nameText.text)
  }

  private updateEnemyBars(enemy: MapEnemy) {
    const width = enemy.isBoss ? 34 : 20
    const pct = Phaser.Math.Clamp(enemy.currentHp / enemy.maxHp, 0, 1)
    const color = pct > 0.5 ? 0x4ade80 : pct > 0.25 ? 0xfacc15 : 0xef4444
    enemy.hpBarBg.clear().fillStyle(0x030407, 0.9).fillRoundedRect(enemy.x - width / 2 - 1, enemy.y - 29, width + 2, 5, 2)
    enemy.hpBar.clear().fillStyle(color, 1).fillRoundedRect(enemy.x - width / 2, enemy.y - 28, width * pct, 3, 1)
    enemy.nameText.setPosition(enemy.x, enemy.y - 39)
    if (enemy.isBoss) this.updateBossHud(enemy)
  }

  private startDash() {
    if (!this.player || this.time.now < this.nextDashAt) return
    this.dashUntil = this.time.now + 200
    this.playerInvulnerableUntil = this.time.now + 260
    this.nextDashAt = this.time.now + 1500
    this.lastDashAfterimageAt = 0
    audioManager.playSfx('scene_whoosh')
    this.cameras.main.zoomTo(1.03, 80, 'Sine.easeOut', true)
    this.time.delayedCall(120, () => this.cameras.main.zoomTo(1, 120, 'Sine.easeInOut', true))
    this.tweens.add({ targets: this.player, alpha: 0.45, yoyo: true, repeat: 3, duration: 45 })
    this.time.delayedCall(1500, () => this.showDashReady())
  }

  private updateDashTrail() {
    if (!this.player || this.time.now - this.lastDashAfterimageAt < 80) return
    this.lastDashAfterimageAt = this.time.now
    const afterAlpha = Phaser.Math.Clamp((this.dashUntil - this.time.now) / 200, 0.1, 0.4)
    const after = this.add.rectangle(this.player.x, this.player.y, this.player.width, this.player.height, 0xa7f3d0, afterAlpha).setDepth(11)
    this.tweens.add({ targets: after, alpha: 0, duration: 260, ease: 'Sine.easeOut', onComplete: () => after.destroy() })
    for (let index = 0; index < 3; index += 1) {
      const particle = this.add.circle(this.player.x + Phaser.Math.Between(-10, 10), this.player.y + Phaser.Math.Between(-10, 10), Phaser.Math.Between(2, 4), index % 2 === 0 ? 0x9ff3ff : 0xffffff, 0.72).setDepth(12)
      this.tweens.add({ targets: particle, x: particle.x + Phaser.Math.Between(-18, 18), y: particle.y + Phaser.Math.Between(-18, 18), alpha: 0, scale: ENTITY_SCALE.object * 0.33, duration: 260, onComplete: () => particle.destroy() })
    }
  }

  private showDashReady() {
    if (!this.dashReadyText || this.time.now < this.nextDashAt) return
    this.dashReadyText.setAlpha(0.9).setScale(ENTITY_SCALE.hero * 1.6)
    this.tweens.add({ targets: this.dashReadyText, alpha: 0, scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 620, ease: 'Sine.easeOut' })
  }

  private triggerHitstop(duration: number) {
    this.tweens.pauseAll()
    this.time.timeScale = 0.01
    this.time.delayedCall(duration, () => { this.time.timeScale = 1; this.tweens.resumeAll() })
  }

  private triggerSlowMo(duration: number, scale: number) {
    this.time.timeScale = scale
    this.time.delayedCall(duration, () => { this.time.timeScale = 1 })
  }

  private useHealthPotion() {
    const item = this.saveData.inventory.find((entry) => entry.itemId === 'health_potion' && entry.quantity > 0)
    if (!item || !this.player) { this.showToast('No Health Potions available.'); return }
    const hero = this.saveData.party[0]
    const maxHp = this.getPlayerCombatStats().hp
    if (hero.currentHp >= maxHp) { this.showToast('Nara is already at full HP.'); return }
    item.quantity -= 1
    hero.currentHp = Math.min(maxHp, hero.currentHp + 50)
    this.showFloatingText(this.player.x, this.player.y - 30, '+50 HP', '#86efac')
    this.tweens.add({ targets: this.player, alpha: 0.55, yoyo: true, repeat: 2, duration: 80 })
    audioManager.playSfx('item_use')
    this.refreshHud(); this.updatePlayerBars(); this.persist()
  }

  private handlePlayerDefeat() {
    this.busy = true
    const hero = this.saveData.party[0]
    const restoredHp = Math.max(1, Math.floor(this.getPlayerCombatStats().hp * 0.5))
    hero.currentHp = restoredHp
    const { width, height } = this.scale
    const overlay = this.add.container(0, 0).setScrollFactor(0).setDepth(240).setAlpha(0)
    overlay.add(this.add.rectangle(width / 2, height / 2, width, height, 0x2a0508, 0.62))
    overlay.add(this.add.ellipse(width / 2, height / 2, width * 1.15, height * 0.82, 0x000000, 0.18).setStrokeStyle(56, 0x7f1d1d, 0.48))
    overlay.add(this.add.text(width / 2, height / 2 - 22, 'DEFEATED', { color: '#ffb4b4', fontFamily: 'Georgia, serif', fontSize: '42px', fontStyle: 'bold' }).setOrigin(0.5))
    overlay.add(this.add.text(width / 2, height / 2 + 28, 'Reviving at skywell...', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px' }).setOrigin(0.5))
    this.tweens.add({ targets: overlay, alpha: 1, duration: 420, ease: 'Sine.easeOut' })
    this.time.delayedCall(2000, () => {
      if (this.player) {
        this.player.setPosition(this.tileCenter(SAVE_TILE.x), this.tileCenter(SAVE_TILE.y))
        this.companions.forEach((companion) => {
          companion.x = this.player!.x + companion.offsetX
          companion.y = this.player!.y + companion.offsetY
          companion.container.setPosition(companion.x, companion.y)
          this.updateCompanionBars(companion)
        })
        this.showFloatingText(this.player.x, this.player.y - 34, `HP restored to ${restoredHp}`, '#86efac')
        this.tweens.add({ targets: this.player, alpha: 0.25, yoyo: true, repeat: 5, duration: 120 })
      }
      this.tweens.add({ targets: overlay, alpha: 0, duration: 520, onComplete: () => overlay.destroy() })
      this.time.delayedCall(560, () => { this.busy = false })
      this.refreshHud(); this.updatePlayerBars(); this.persist()
    })
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const label = this.add.text(x, y, text, { color, fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', stroke: '#050509', strokeThickness: 3, shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 2, fill: true } }).setOrigin(0.5).setDepth(80)
    this.tweens.add({ targets: label, y: y - 34, alpha: 0, duration: 1000, onComplete: () => label.destroy() })
  }

  private showDamageNumber(x: number, y: number, amount: number, kind: 'player' | 'enemy' | 'heal', critical = false) {
    const offsetX = Phaser.Math.Between(-10, 10)
    const color = kind === 'heal' ? '#86efac' : kind === 'enemy' ? '#ff5f5f' : critical ? '#ffd166' : '#ffffff'
    const text = kind === 'heal' ? `+${amount}` : `${amount}`
    const label = this.add.text(x + offsetX, y, text, { color, fontFamily: 'Arial, sans-serif', fontSize: critical ? '16px' : '11px', fontStyle: 'bold', stroke: '#050509', strokeThickness: critical ? 4 : 3, shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 2, fill: true } }).setOrigin(0.5).setDepth(82)
    if (critical) this.tweens.add({ targets: label, x: label.x + 2, yoyo: true, repeat: 3, duration: 28 })
    this.tweens.add({ targets: label, y: y - 34, alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => label.destroy() })
  }

  private getPlayerCombatStats(): CharacterStats {
    const member = this.saveData.party[0]
    const character = CHARACTERS[member.characterId]
    const stats = this.scaleCharacterStats(character, member.level)
    Object.values(member.equipment).forEach((itemId) => {
      if (!itemId) return
      const effect = ITEMS_BY_ID[itemId]?.effect
      effect?.stat?.split(',').forEach((stat) => {
        const key = stat.trim() as keyof CharacterStats
        if (key in stats) stats[key] += effect.value ?? 0
      })
    })
    return stats
  }

  private updatePlayerBars() {
    if (!this.player || !this.playerHpBarBg || !this.playerHpBar || !this.playerMpBar || !this.playerHpText || !this.playerMpText) return
    const stats = this.getPlayerCombatStats()
    const hero = this.saveData.party[0]
    const width = 48
    const hpPct = Phaser.Math.Clamp(hero.currentHp / stats.hp, 0, 1)
    const mpPct = Phaser.Math.Clamp(hero.currentMp / stats.mp, 0, 1)
    const x = this.player.x - width / 2
    const hpY = this.player.y + 25
    const mpY = this.player.y + 31
    this.playerHpBarBg.clear().fillStyle(0x050509, 0.82).fillRoundedRect(x - 1, hpY - 1, width + 2, 6, 2)
    this.playerHpBar.clear()
    this.playerHpBar.fillGradientStyle(0x5cff8a, 0x5cff8a, 0x15803d, 0x15803d, 1).fillRoundedRect(x, hpY, width * hpPct, 4, 2)
    this.playerHpBar.fillStyle(0xffffff, 0.55).fillRect(x + 1, hpY, Math.max(0, width * hpPct - 2), 1)
    this.playerMpBar.clear().fillStyle(0x050509, 0.82).fillRoundedRect(x - 1, mpY - 1, width + 2, 5, 2)
    this.playerMpBar.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0x2563eb, 0x2563eb, 1).fillRoundedRect(x, mpY, width * mpPct, 3, 1)
    this.playerMpBar.fillStyle(0xffffff, 0.45).fillRect(x + 1, mpY, Math.max(0, width * mpPct - 2), 1)
    this.playerHpText.setText(`${hero.currentHp}/${stats.hp}`).setPosition(this.player.x, this.player.y + 40)
    this.playerMpText.setText(`${hero.currentMp}/${stats.mp}`).setPosition(this.player.x, this.player.y + 50)
    if (hpPct < 0.3 && !this.tweens.isTweening(this.playerHpText)) this.tweens.add({ targets: [this.playerHpBar, this.playerHpText], alpha: 0.35, yoyo: true, duration: 120, repeat: 1 })
  }

  private updateShieldVisual() {
    if (!this.player) return
    if (!this.isBlocking) {
      this.shieldArc?.destroy(); this.shieldArc = undefined
      return
    }
    const angle = this.facingToAngle()
    const x = this.player.x + Math.cos(angle) * 24
    const y = this.player.y + Math.sin(angle) * 24
    if (!this.shieldArc) this.shieldArc = this.add.arc(x, y, 24, -55, 55, false, 0x60a5fa, 0.18).setDepth(27).setStrokeStyle(5, 0x93c5fd, 0.8)
    this.shieldArc.setPosition(x, y).setAngle(Phaser.Math.RadToDeg(angle))
  }

  private showBlockFlash() {
    if (!this.shieldArc) return
    this.tweens.add({ targets: this.shieldArc, alpha: 1, yoyo: true, duration: 80 })
    this.showFloatingText(this.shieldArc.x, this.shieldArc.y - 18, 'BLOCK', '#93c5fd')
  }

  private showDamageDirection(attackerX: number, attackerY: number) {
    if (!this.player) return
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, attackerX, attackerY)
    const arrow = this.add.triangle(this.player.x + Math.cos(angle) * 42, this.player.y + Math.sin(angle) * 42, 0, -8, 14, 0, 0, 8, 0xff6b6b, 0.9).setDepth(28)
    arrow.setRotation(angle)
    this.tweens.add({ targets: arrow, alpha: 0, duration: 520, onComplete: () => arrow.destroy() })
  }

  private updateFacingFromVector(x: number, y: number) {
    if (Math.abs(x) > Math.abs(y)) this.facing = x < 0 ? 'left' : 'right'
    else this.facing = y < 0 ? 'up' : 'down'
  }

  private facingToAngle() {
    if (this.facing === 'right') return 0
    if (this.facing === 'left') return Math.PI
    if (this.facing === 'up') return -Math.PI / 2
    return Math.PI / 2
  }

  private showBossIntro(enemyId: string) {
    const name = ENEMIES_BY_ID[enemyId]?.name ?? 'Boss'
    audioManager.playSfx('boss_sting')
    const vignette = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x7f1d1d, 0).setScrollFactor(0).setDepth(124)
    this.time.timeScale = 0.5
    this.time.delayedCall(500, () => { this.time.timeScale = 1 })
    this.tweens.add({ targets: vignette, alpha: 0.28, yoyo: true, duration: 360, ease: 'Sine.easeInOut', onComplete: () => vignette.destroy() })
    this.cameras.main.zoomTo(1.15, 350, 'Sine.easeOut', true)
    this.time.delayedCall(800, () => this.cameras.main.zoomTo(1, 450, 'Sine.easeInOut', true))
    this.showEventBanner(name, 'A route guardian enters the overworld.')
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
    const changed = this.saveData.currentObjective !== objective
    this.saveData.currentObjective = objective
    if (changed) this.flashObjectiveBanner()
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

  private hasInventoryItem(itemId: string): boolean {
    return this.saveData.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0) ||
      this.saveData.party.some((member) => Object.values(member.equipment).includes(itemId))
  }

  private autoEquipCharm(itemId: string) {
    if (ITEMS_BY_ID[itemId]?.type !== 'charm') {
      return
    }

    const member = this.saveData.party.find((partyMember) => !partyMember.equipment.charm)
    if (member) {
      member.equipment.charm = itemId
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

  private restorePartyMissingPercent(hpPercent: number, mpPercent: number) {
    this.saveData.party.forEach((member) => {
      const character = CHARACTERS[member.characterId]
      if (!character) {
        return
      }
      const stats = this.scaleCharacterStats(character, member.level)
      const missingHp = Math.max(0, stats.hp - member.currentHp)
      const missingMp = Math.max(0, stats.mp - member.currentMp)
      member.currentHp = Math.min(stats.hp, member.currentHp + Math.ceil(missingHp * hpPercent))
      member.currentMp = Math.min(stats.mp, member.currentMp + Math.ceil(missingMp * mpPercent))
    })
  }

  private scaleCharacterStats(character: (typeof CHARACTERS)[string], level: number) {
    const levelUps = Math.max(0, level - 1)
    return {
      hp: character.baseStats.hp + character.growth.hp * levelUps,
      mp: character.baseStats.mp + character.growth.mp * levelUps,
      atk: character.baseStats.atk + character.growth.atk * levelUps,
      def: character.baseStats.def + character.growth.def * levelUps,
      spd: character.baseStats.spd + character.growth.spd * levelUps,
      mag: character.baseStats.mag + character.growth.mag * levelUps,
    }
  }

  private rollGardenItem(): string | null {
    if (Math.random() >= 0.4) {
      return null
    }
    const roll = Math.random()
    if (roll < 0.5) return 'health_potion'
    if (roll < 0.8) return 'mana_potion'
    return 'antidote'
  }

  private rollPetForageItem(): string {
    const roll = Math.random()
    if (roll < 0.35) return 'health_potion'
    if (roll < 0.6) return 'mana_potion'
    if (roll < 0.75) return 'ember_shard'
    if (roll < 0.9) return 'antidote'
    return 'burn_salve'
  }

  private getItemName(itemId: string) {
    return ITEMS_BY_ID[itemId]?.name ?? itemId.replace(/_/g, ' ')
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
    const hero = this.saveData.party[0]
    this.objectiveText?.setText(`▶ ${this.saveData.currentObjective}`)
    this.inventoryText?.setText(`Potion ${counts.potion}  Ether ${counts.ether}  Ember Shard ${counts.emberShard}  |  Home ${this.homeProgress()}/3${this.saveData.pet.unlocked ? '  Pip' : ''}`)
    this.levelText?.setText(`Lv.${hero.level}`)
    this.updateTopLeftHud()
    this.updateXpBar()
    this.killCounterText?.setText(`Kills: ${this.killCount}`)
    this.updateSkillHud()
  }

  private updateXpBar() {
    if (!this.playerXpBar) return
    const xpForLevel = 180
    const progress = (this.saveData.battleRewards.exp % xpForLevel) / xpForLevel
    this.playerXpBar.clear().fillStyle(0x111827, 0.9).fillRoundedRect(54, 73, 186, 5, 2).fillStyle(0xa855f7, 0.95).fillRoundedRect(54, 73, 186 * progress, 5, 2)
  }

  private updateTopLeftHud() {
    if (!this.hudPanel) return
    const hudPanel = this.hudPanel
    const hero = this.saveData.party[0]
    const stats = this.getPlayerCombatStats()
    const hpPct = Phaser.Math.Clamp(hero.currentHp / stats.hp, 0, 1)
    const mpPct = Phaser.Math.Clamp(hero.currentMp / stats.mp, 0, 1)
    const graphics = hudPanel.graphics
    graphics.clear()
    graphics.fillStyle(0x050713, 0.84).fillRoundedRect(12, 12, 242, 72, 10)
    graphics.lineStyle(1, 0xffffff, 0.16).strokeRoundedRect(12, 12, 242, 72, 10)
    graphics.fillStyle(0x111827, 0.95).fillRoundedRect(54, 39, 126, 8, 3).fillStyle(0x22c55e, 0.96).fillRoundedRect(54, 39, 126 * hpPct, 8, 3)
    graphics.fillStyle(0x111827, 0.95).fillRoundedRect(54, 55, 126, 7, 3).fillStyle(0x3b82f6, 0.96).fillRoundedRect(54, 55, 126 * mpPct, 7, 3)
    graphics.fillStyle(0x050713, 0.76).fillRoundedRect(12, 91, 168, 56, 9)
    graphics.lineStyle(1, 0xffffff, 0.13).strokeRoundedRect(12, 91, 168, 56, 9)
    hudPanel.nameText.setText(`Nara Lv.${hero.level}`)
    hudPanel.hpText.setText(`${hero.currentHp}/${stats.hp}`)
    hudPanel.mpText.setText(`${hero.currentMp}/${stats.mp}`)
    hudPanel.goldText.setText(`🪙 ${this.saveData.gold}g`)
    this.saveData.party.slice(1, 3).forEach((member, index) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const companionStats = this.scaleCharacterStats(character, member.level)
      const pct = Phaser.Math.Clamp(member.currentHp / companionStats.hp, 0, 1)
      const y = index === 0 ? 111 : 139
      const inCombat = this.mapEnemies.some((enemy) => !enemy.dead && this.player && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < enemy.aggroRange)
      graphics.fillStyle(0x111827, 0.95).fillRoundedRect(50, y + 4, 92, 5, 2).fillStyle(0x22c55e, 0.96).fillRoundedRect(50, y + 4, 92 * pct, 5, 2)
      hudPanel.companionTexts[index]?.setText(character.name)
      hudPanel.swordTexts[index]?.setVisible(inCombat)
      const portrait = hudPanel.portraits[index]
      if (portrait && pct < 0.3 && !this.tweens.isTweening(portrait)) this.tweens.add({ targets: portrait, fillColor: 0xef4444, alpha: 0.45, yoyo: true, duration: 180, repeat: 1 })
    })
  }

  private flashObjectiveBanner() {
    if (!this.objectivePanel || !this.objectiveText) return
    this.objectivePanel.setAlpha(1).setScale(ENTITY_SCALE.object * 1.72)
    this.objectiveText.setAlpha(1).setScale(ENTITY_SCALE.object * 1.72)
    this.tweens.add({ targets: [this.objectivePanel, this.objectiveText], scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 220, ease: 'Back.easeOut' })
    this.tweens.add({ targets: this.objectivePanel, alpha: 0.72, delay: 260, duration: 360 })
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
