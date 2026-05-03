import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import type { CharacterStats } from '../data/characters'
import type { EnemySkill } from '../data/enemies'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'
import { MapRenderer } from '../systems/MapRenderer'
import { EnemyManager } from '../systems/EnemyManager'
import { CompanionManager } from '../systems/CompanionManager'
import { UIManager } from '../systems/UIManager'
import { NPCManager } from '../systems/NPCManager'
import type { TouchControls } from '../input/TouchControls'

export const TILE_SIZE = 48
export const MAP_WIDTH = 40
export const MAP_HEIGHT = 30
export const PLAYER_SPEED = 175
export const REGULAR_ENEMY_TARGET_COUNT = 7
export const ENEMY_RESPAWN_DELAY = 15000
export const DEV_MODE = false
export const BOSS_PHASE_THRESHOLDS = [
  { hpPercent: 1.0, phase: 1, label: 'Guardian awakens' },
  { hpPercent: 0.70, phase: 2, label: 'Guardian channels power' },
  { hpPercent: 0.40, phase: 3, label: 'Guardian shatters the seal' },
  { hpPercent: 0.15, phase: 4, label: 'Last stand' },
] as const
export const ENTITY_SCALE = {
  hero: 0.72,
  npc: 0.65,
  companion: 0.62,
  enemy: 0.55,
  bossEnemy: 0.75,
  object: 0.6,
} as const
export type Direction = 'up' | 'down' | 'left' | 'right'
export const HERO_ANIM_ROWS: Record<Direction, number> = { down: 0, left: 1, right: 2, up: 3 }
export type TileVisual = 'grass' | 'path' | 'water' | 'wall' | 'shrine' | 'flowers' | 'ruins' | 'bridge' | 'lava' | 'gate'
export type TileDef = {
  passable: boolean
  swimPassable: boolean
  visual: TileVisual
  depth: number
  eventOnStep?: string
  eventOnInteract?: string
  connectWith?: string[]
}
export const TILE_DEFS: Record<string, TileDef> = {
  G: { passable: true, swimPassable: true, visual: 'grass', depth: 0, connectWith: ['P', 'F', 'R'] },
  P: { passable: true, swimPassable: true, visual: 'path', depth: 0, connectWith: ['G', 'F', 'R'] },
  B: { passable: false, swimPassable: true, visual: 'water', depth: 0, connectWith: ['G', 'P', 'A'] },
  W: { passable: false, swimPassable: false, visual: 'wall', depth: 1, connectWith: [] },
  F: { passable: true, swimPassable: true, visual: 'flowers', depth: 0, connectWith: ['G', 'P'] },
  R: { passable: true, swimPassable: true, visual: 'ruins', depth: 0, connectWith: ['G', 'P'] },
  S: { passable: true, swimPassable: true, visual: 'shrine', depth: 0, connectWith: ['P', 'G'] },
  A: { passable: true, swimPassable: true, visual: 'bridge', depth: 0, connectWith: ['G', 'P', 'B'] },
}
export const MAP_LAYOUT = [
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
export const SAVE_TILE = { x: 4, y: 6 }
export const CHEST_TILE = { x: 8, y: 3 }
export const GUIDE_TILE = { x: 5, y: 4 }
export const ELDER_TILE = { x: 7, y: 4 }
export const MERCHANT_TILE = { x: 4, y: 9 }
export const MARKER_TILE = { x: 24, y: 9 }
export const SIGNPOST_TILE = { x: 3, y: 13 }
export const TIDE_BELL_TILE = { x: 5, y: 21 }
export const MURAL_TILE = { x: 10, y: 18 }
export const WATCH_LANTERN_TILE = { x: 7, y: 16 }
export const SHRINE_GATE_TILE = { x: 25, y: 4 }
export const SHRINE_FONT_TILE = { x: 27, y: 5 }
export const SHRINE_SEAL_TILE = { x: 27, y: 6 }
export const FIELD_BATTLE_TILE = MARKER_TILE
export const HOME_TILE = { x: 4, y: 12 }
export const ALLY_TILE = { x: 9, y: 21 }
export const PET_TILE = { x: 12, y: 20 }
export const ARCHIVE_TILE = { x: 20, y: 18 }
export const MID_BOSS_TILE = { x: 20, y: 23 }
export const FINAL_BOSS_TILE = { x: 36, y: 28 }
export const TREASURE_CHESTS = [
  { id: 'quay_supply_chest', x: 8, y: 3 },
  { id: 'field_cache_chest', x: 18, y: 11 },
  { id: 'shrine_gold_chest', x: 31, y: 4 },
  { id: 'archive_relic_chest', x: 16, y: 22 },
  { id: 'skywell_hidden_chest', x: 34, y: 27 },
] as const
export const FIELD_BATTLE_ID = 'field_marker_battle'
export const SHRINE_BOSS_BATTLE_ID = 'moonwake_guardian_battle'
export const ARCHIVE_SKIRMISH_ID = 'archive_skirmish_battle'
export const MID_BOSS_BATTLE_ID = 'thornheart_battle'
export const FINAL_BOSS_BATTLE_ID = 'cartographers_lie_battle'
export const CHEST_ID = 'quay_supply_chest'
export const OBJECTIVES = {
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

export type OverworldInitData = {
  newGame?: boolean
  newGamePlus?: boolean
  continueGame?: boolean
  saveSlot?: number
  sourceSaveSlot?: number
  battleResult?: {
    battleId?: string
    victory?: boolean
    rewards?: { exp: number; gold: number; emberShards: number; items: Array<{ itemId: string; quantity: number }> }
  }
}


export type MapEnemy = {
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
  visualHp: number
  visualHpTarget: number
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
  staggeredUntil?: number
  wanderTimer: number
  wanderTarget: { x: number; y: number } | null
  hitFlashTimer: number
  isBoss: boolean
  dead: boolean
  expReward: number
  goldReward: number
  battleId?: string
  bossPhase?: number
  recoveringUntil?: number
  tutorialRole?: 'step1' | 'step2' | 'step3'
  noRewards?: boolean
}
export type TutorialState = 'none' | 'step1-kill' | 'step2-dash' | 'step3-block' | 'complete'

export type PartyCompanion = {
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

export type InventoryCounts = { potion: number; ether: number; emberShard: number }
export type MenuOverlay = { container: Phaser.GameObjects.Container }
export type MiniMapOverlay = { container: Phaser.GameObjects.Container; graphics: Phaser.GameObjects.Graphics; visible: boolean }
export type BossHud = { container: Phaser.GameObjects.Container; bar: Phaser.GameObjects.Graphics; nameText: Phaser.GameObjects.Text }
export type HudPanel = { graphics: Phaser.GameObjects.Graphics; nameText: Phaser.GameObjects.Text; hpText: Phaser.GameObjects.Text; mpText: Phaser.GameObjects.Text; goldText: Phaser.GameObjects.Text; companionTexts: Phaser.GameObjects.Text[]; swordTexts: Phaser.GameObjects.Text[]; portraits: Phaser.GameObjects.Arc[] }
export type TreasureChest = { id: string; tile: { x: number; y: number }; base: Phaser.GameObjects.Rectangle; lid: Phaser.GameObjects.Rectangle; trim: Phaser.GameObjects.Rectangle; opened: boolean }
export type GroundLoot = {
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
export type RealtimeSkill = { name: string; mpCost: number; cooldown: number; color: number; effect: 'emberSlash' | 'tidalHeal' | 'stoneGuard' | 'windStep' }

export class OverworldScene extends Phaser.Scene {
  [key: string]: any
  mapRenderer?: MapRenderer
  enemyManager?: EnemyManager
  companionManager?: CompanionManager
  uiManager?: UIManager
  npcManager?: NPCManager
  readonly DASH_ACTIVE_MS = 140
  readonly DASH_COOLDOWN_MS = 450
  readonly DASH_MULTIPLIER = 2.25
  readonly DASH_INVULN_MS = 90
  readonly INPUT_BUFFER_MS = 100
  readonly INTERACT_BUFFER_MS = 150
  readonly ATTACK_TOTAL_MS = 300
  readonly ATTACK_HITBOX_DELAY_MS = 90
  readonly ATTACK_RECOVERY_MS = 130
  readonly COMBO_WINDOW_MS = 150
  readonly HITSTOP_LIGHT_MS = 30
  readonly HITSTOP_HEAVY_MS = 55
  readonly PARRY_WINDOW_MS = 140
  readonly PARRY_STAGGER_MS = 2000
  readonly PARRY_REWARD_MANA = 5
  readonly PARRY_SLOW_MO_MS = 80
  cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  player?: Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle
  playerShadow?: Phaser.GameObjects.Ellipse
  petFollower?: Phaser.GameObjects.Arc | Phaser.GameObjects.Image | Phaser.GameObjects.Container
  keys?: Record<'w' | 'a' | 's' | 'd' | 'e' | 'space' | 'shift' | 'q' | 'm' | 't' | 'h' | 'f' | 'one' | 'two' | 'three' | 'four' | 'escape', Phaser.Input.Keyboard.Key>
  walls = new Set<string>()
  facing: Direction = 'down'
  saveNoticeShown = false
  busy = false
  initData: OverworldInitData = {}
  saveData!: SaveData
  objectiveText?: Phaser.GameObjects.Text
  objectivePanel?: Phaser.GameObjects.Rectangle
  hudPanel?: HudPanel
  inventoryText?: Phaser.GameObjects.Text
  promptText?: Phaser.GameObjects.Text
  areaText?: Phaser.GameObjects.Text
  menuOverlay?: MenuOverlay
  pauseOverlay?: Phaser.GameObjects.Container
  miniMap?: MiniMapOverlay
  helpOverlay?: Phaser.GameObjects.Container
  toast?: Phaser.GameObjects.Container
  touchMove: { x: number; y: number } | null = null
  touchButtons: Phaser.GameObjects.GameObject[] = []
  touchControls?: TouchControls
  isMobileDevice = false
  touchBlockActive = false
  activeBanners: Phaser.GameObjects.GameObject[] = []
  routeClarityStates: Record<string, 'open' | 'closed'> = {}
  emberParticles: Phaser.GameObjects.Arc[] = []
  waterShimmers: Phaser.GameObjects.Rectangle[] = []
  homeVisuals: Phaser.GameObjects.GameObject[] = []
  npcActors: Partial<Record<'guide' | 'elder' | 'peddler' | 'mira', Phaser.GameObjects.GameObject>> = {}
  miraCompanion?: Phaser.GameObjects.Container
  companions: PartyCompanion[] = []
  companionHudGraphics?: Phaser.GameObjects.Graphics
  lastArea: string | null = null
  discoveredAreas = new Set<string>()
  dustCooldown = 0
  mapEnemies: MapEnemy[] = []
  playerHpBarBg?: Phaser.GameObjects.Graphics
  playerHpBar?: Phaser.GameObjects.Graphics
  playerMpBar?: Phaser.GameObjects.Graphics
  playerHpText?: Phaser.GameObjects.Text
  playerMpText?: Phaser.GameObjects.Text
  playerXpBar?: Phaser.GameObjects.Graphics
  bossHud?: BossHud

  uiWidth(fraction: number, maxPx: number = 800): number {
    return Math.min(this.scale.width * fraction, maxPx)
  }

  uiHeight(fraction: number, maxPx: number = 600): number {
    return Math.min(this.scale.height * fraction, maxPx)
  }
  playerInvulnerableUntil = 0
  playerBlinkEvent?: Phaser.Time.TimerEvent
  dashUntil = 0
  nextDashAt = 0
  dashSlideMultiplier = 1
  dashWallSlideUsed = false
  nextPlayerAttackAt = 0
  attackState: 'idle' | 'anticipation' | 'contact' | 'recovery' = 'idle'
  attackStartTime = 0
  attackHitResolved = false
  inputBuffer: { action: string; time: number } | null = null
  killCount = 0
  groundLoot: GroundLoot[] = []
  treasureChests: TreasureChest[] = []
  respawnTimer?: Phaser.Time.TimerEvent
  skillBar?: Phaser.GameObjects.Container
  skillCooldownGraphics: Phaser.GameObjects.Graphics[] = []
  skillTexts: Phaser.GameObjects.Text[] = []
  skillSlotFrames: Phaser.GameObjects.Rectangle[] = []
  killCounterText?: Phaser.GameObjects.Text
  comboText?: Phaser.GameObjects.Text
  dashReadyText?: Phaser.GameObjects.Text
  levelText?: Phaser.GameObjects.Text
  shieldArc?: Phaser.GameObjects.Arc
  isBlocking = false
  blockStartTime = 0
  stoneGuardUntil = 0
  skillReadyAt = [0, 0, 0, 0]
  comboCount = 0
  lastComboHitAt = 0
  lastDashAfterimageAt = 0
  pipBobTween?: Phaser.Tweens.Tween
  homeWarmthUsedThisVisit = false
  homeGardenUsedThisVisit = false
  lastForageTime = 0
  pipIdleAngle = 0
  cameraZoom = 1
  visualHp = 0
  visualHpTarget = 0
  shownHints: Set<string> = new Set()
  hintContainer?: Phaser.GameObjects.Container
  hintQueue: Array<{ id: string; text: string; duration?: number }> = []
  movementMs = 0
  learnedAttack = false
  learnedInteract = false
  firstDamageTaken = false
  fpsText?: Phaser.GameObjects.Text
  lastHeartbeatAt = 0
  damageNumberPool: Phaser.GameObjects.Text[] = []
  tutorialState: TutorialState = 'none'
  tutorialOverlay?: Phaser.GameObjects.Container
  tutorialTimer?: Phaser.Time.TimerEvent
  tutorialStepStartedAt = 0
  currentAttackInput: 'space' | 'pointer' | 'buffer' | 'skill' = 'space'

  installSystems() {
    this.mapRenderer = new MapRenderer(this)
    this.enemyManager = new EnemyManager(this)
    this.companionManager = new CompanionManager(this)
    this.uiManager = new UIManager(this)
    this.npcManager = new NPCManager(this)
    this.mapRenderer.install()
    this.enemyManager.install()
    this.companionManager.install()
    this.uiManager.install()
    this.npcManager.install()
  }

  constructor() {
    super('OverworldScene')
  }

  readonly handleVisibilityChange = () => {
    if (document.hidden) { if (!this.pauseOverlay && !this.menuOverlay) this.openPauseOverlay() }
    else void audioManager.resume()
  }

  init(data: OverworldInitData) {
    this.initData = data
  }

  create() {
    this.installSystems()
    this.cameras.main.setBackgroundColor('#08090f')
    audioManager.playMusic('town')
    this.walls.clear()
    this.saveNoticeShown = false
    this.busy = false
    this.toast = undefined
    this.touchMove = null
    this.touchButtons = []
    this.touchControls?.destroy()
    this.touchControls = undefined
    this.isMobileDevice = false
    this.touchBlockActive = false
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
    this.playerBlinkEvent = undefined
    this.dashUntil = 0
    this.nextDashAt = 0
    this.dashSlideMultiplier = 1
    this.dashWallSlideUsed = false
    this.nextPlayerAttackAt = 0
    this.attackState = 'idle'
    this.attackStartTime = 0
    this.attackHitResolved = false
    this.inputBuffer = null
    this.killCount = 0
    this.skillReadyAt = [0, 0, 0, 0]
    this.stoneGuardUntil = 0
    this.isBlocking = false
    this.blockStartTime = 0
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
    this.pauseOverlay = undefined
    this.miniMap = undefined
    this.helpOverlay = undefined
    this.shownHints = new Set()
    this.hintQueue = []
    this.hintContainer = undefined
    this.movementMs = 0
    this.learnedAttack = false
    this.learnedInteract = false
    this.firstDamageTaken = false
    this.fpsText = undefined
    this.tutorialState = 'none'
    this.tutorialOverlay?.destroy()
    this.tutorialOverlay = undefined
    this.tutorialTimer?.destroy()
    this.tutorialTimer = undefined
    this.tutorialStepStartedAt = 0
    this.currentAttackInput = 'space'
    this.damageNumberPool.forEach((text) => text.destroy())
    this.damageNumberPool = []

    const continuedSave = this.initData.continueGame ? SaveSystem.load(this.initData.saveSlot ?? SaveSystem.getAutoSaveSlot()) : null
    this.saveData = continuedSave ?? (this.initData.newGamePlus ? this.createNewGamePlusSaveData() : this.createDefaultSaveData())

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
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!pointer.event.defaultPrevented && !this.touchControls?.containsScreenPoint(pointer.x, pointer.y) && !this.menuOverlay) {
        this.performPlayerAttack(pointer.worldX, pointer.worldY, 'pointer')
      }
    })
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: Phaser.GameObjects.GameObject[], _deltaX: number, deltaY: number) => this.handleCameraZoom(deltaY))
    this.createHud()
    this.createMiniMap()
    this.createTouchControls()
    if (DEV_MODE) this.fpsText = this.add.text(8, this.scale.height - 20, '', { color: '#86efac', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setScrollFactor(0).setDepth(200)
    this.refreshHud()
    this.cameras.main.fadeIn(260, 5, 6, 18)
    this.showAreaBanner('Luma Quay', 'A harbor village holding its breath beneath emberlit glass.')
    this.queueHint('move', 'WASD to move', 5000)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => document.removeEventListener('visibilitychange', this.handleVisibilityChange))
    this.time.addEvent({ delay: 60000, loop: true, callback: () => { if (!this.busy) this.persist() } })
    if (!continuedSave && !this.initData.continueGame) {
      if (this.initData.newGamePlus) {
        this.time.delayedCall(850, () => this.showNewGamePlusBanner())
      } else if (!this.saveData.flags.tutorialCompleted) {
        this.time.delayedCall(650, () => this.startFirstCombatTutorial())
      } else {
        this.time.delayedCall(850, () => this.showFirstSessionGuide())
      }
    }
    this.notifyWorkshopBuff()
    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameraZoom = 1
    this.visualHp = this.saveData?.party?.[0]?.currentHp ?? 0
    this.visualHpTarget = this.visualHp
    this.cameras.main.setZoom(this.cameraZoom)
    this.cameras.main.startFollow(this.player!, true, 0.1, 0.1)
    this.cameras.main.setDeadzone(40, 28)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerShadow || !this.cursors || !this.keys) {
      return
    }

    if (this.menuOverlay) {
      this.touchControls?.update()
      if (Phaser.Input.Keyboard.JustDown(this.keys.escape) || Phaser.Input.Keyboard.JustDown(this.keys.m)) {
        this.closeMenu()
      }
      return
    }

    if (this.pauseOverlay) {
      this.touchControls?.update()
      return
    }

    if (this.busy) {
      this.touchControls?.update()
      return
    }

    const seconds = delta / 1000
    let velocityX = 0
    let velocityY = 0

    this.touchControls?.update()
    const touchX = this.touchMove?.x ?? 0
    const touchY = this.touchMove?.y ?? 0

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
    if (Math.abs(touchX) > 0.08 || Math.abs(touchY) > 0.08) {
      velocityX += PLAYER_SPEED * touchX
      velocityY += PLAYER_SPEED * touchY
      if (Math.abs(touchX) > Math.abs(touchY)) {
        this.facing = touchX < 0 ? 'left' : 'right'
      } else {
        this.facing = touchY < 0 ? 'up' : 'down'
      }
    }

    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= Math.SQRT1_2
      velocityY *= Math.SQRT1_2
    }

    const wasBlocking = this.isBlocking
    this.isBlocking = (this.keys.f.isDown || this.touchBlockActive) && (velocityX !== 0 || velocityY !== 0 || !this.menuOverlay)
    if (this.isBlocking && !wasBlocking) this.blockStartTime = this.time.now

    if (Phaser.Input.Keyboard.JustDown(this.keys.shift)) {
      if (!this.startDash()) this.bufferInput('dash')
    }
    const dashing = this.time.now < this.dashUntil
    const isMoving = velocityX !== 0 || velocityY !== 0
    if (isMoving) {
      this.movementMs += delta
      this.dismissHint('move')
      if (this.movementMs >= 10000) this.queueHint('dash', 'Shift to dash')
    }
    const speedMultiplier = (dashing ? this.DASH_MULTIPLIER * this.dashSlideMultiplier : 1) * (this.isBlocking ? 0.58 : 1)
    this.movePlayer(velocityX * seconds * speedMultiplier, velocityY * seconds * speedMultiplier)
    if (dashing && isMoving) this.updateDashTrail()
    this.updateAttackState()
    this.consumeInputBuffer()
    this.updateCameraFeel()
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
    this.updateOnboardingHints()
    this.updateLowHpHeartbeat()
    this.updateTutorialProgress()
    if (DEV_MODE && this.fpsText) this.fpsText.setText(`FPS: ${this.game.loop.actualFps.toFixed(0)}`)

    if (Phaser.Input.Keyboard.JustDown(this.keys.escape)) {
      if (this.pauseOverlay) {
        this.closePauseOverlay()
      } else {
        this.openPauseOverlay()
      }
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

    if (Phaser.Input.Keyboard.JustDown(this.keys.one)) { this.queueHint('skills', '1-4 for skills'); this.useRealtimeSkill(0) }
    if (Phaser.Input.Keyboard.JustDown(this.keys.two)) { this.queueHint('skills', '1-4 for skills'); this.useRealtimeSkill(1) }
    if (Phaser.Input.Keyboard.JustDown(this.keys.three)) { this.queueHint('skills', '1-4 for skills'); this.useRealtimeSkill(2) }
    if (Phaser.Input.Keyboard.JustDown(this.keys.four)) { this.queueHint('skills', '1-4 for skills'); this.useRealtimeSkill(3) }

    if (Phaser.Input.Keyboard.JustDown(this.keys.space) && !this.isBlocking) {
      if (!this.performPlayerAttack(undefined, undefined, 'space')) this.bufferInput('attack')
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.e)) {
      if (!this.interact()) this.bufferInput('interact')
    }
  }
































































































































































































































































}
