// @ts-nocheck
import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { CHARACTERS, type CharacterStats } from '../data/characters'
import { ENEMIES_BY_ID, type EnemySkill } from '../data/enemies'
import { ITEMS_BY_ID } from '../data/items'
import { CONTROLS, CONTROLS_DISPLAY, CONTROLS_SHORT } from '../controls'
import { SaveSystem, type SaveData } from './SaveSystem'
import { CombatSystem } from './CombatSystem'

type SceneAccess = Phaser.Scene & Record<string, any>

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
void [audioManager, GENERATED_ASSETS, hasTexture, CHARACTERS, ENEMIES_BY_ID, ITEMS_BY_ID, CONTROLS, CONTROLS_DISPLAY, CONTROLS_SHORT, SaveSystem, CombatSystem]

const UIMANAGER_METHODS = [
  "updateAreaPop",
  "getAreaNameForTile",
  "showAreaPop",
  "createHud",
  "createTouchControls",
  "touchFeedback",
  "touchTextFeedback",
  "movePlayer",
  "collidesAt",
  "queueHint",
  "showNextHint",
  "dismissHint",
  "updateOnboardingHints",
  "updateLowHpHeartbeat",
  "showLevelUpCeremony",
  "flashHudGold",
  "showToast",
  "showRewardToast",
  "showAreaBanner",
  "showEventBanner",
  "showFirstSessionGuide",
  "startFirstCombatTutorial",
  "isTutorialActive",
  "showTutorialOverlay",
  "updateTutorialProgress",
  "completeFirstCombatTutorial",
  "showNewGamePlusBanner",
  "showSignpostGuide",
  "showDemoCompletionCard",
  "showCreditsScroll",
  "formatPlayTime",
  "openMenu",
  "addSaveLoadMenu",
  "closeMenu",
  "openPauseOverlay",
  "closePauseOverlay",
  "addMenuPartyRow",
  "formatSlotSummary",
  "formatStageName",
  "confirmManualSave",
  "loadManualSlot",
  "openStatusScreen",
  "addStatusBar",
  "itemName",
  "handleCameraZoom",
  "createMiniMap",
  "toggleMiniMap",
  "updateMiniMap",
  "getRealtimeSkills",
  "createSkillBar",
  "updateSkillHud",
  "openHelpOverlay",
  "dismissBanners",
  "updateInteractionPrompt",
  "updateComboHud",
  "flashGoldCounter",
  "spawnPickupDing",
  "showLevelUpEffect",
  "spawnHealPulse",
  "createBossHud",
  "updateBossHud",
  "updateEnemyBars",
  "showBossVictoryScreen",
  "handlePlayerDefeat",
  "showFloatingText",
  "showDamageNumber",
  "acquireDamageNumber",
  "releaseDamageNumber",
  "spawnWhooshDust",
  "spawnHitParticles",
  "updatePlayerBars",
  "getInventoryCounts",
  "refreshHud",
  "updateXpBar",
  "updateTopLeftHud",
  "flashObjectiveBanner"
] as const

export class UIManager {
  private scene: SceneAccess

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
  }

  install(): void {
    for (const method of UIMANAGER_METHODS) {
      this.scene[method] = (this as unknown as Record<string, (...args: any[]) => any>)[method].bind(this)
    }
  }

  updateAreaPop() {
    if (!this.scene.player) {
      return
    }
    const tile = this.scene.worldToTile(this.scene.player.x, this.scene.player.y)
    const area = this.scene.getAreaNameForTile(tile.x, tile.y)
    if (area === this.scene.lastArea) {
      return
    }
    this.scene.lastArea = area
    if (!this.scene.discoveredAreas.has(area)) {
      this.scene.discoveredAreas.add(area)
      this.scene.showAreaPop(area)
    }
  }

  getAreaNameForTile(tileX: number, tileY: number) {
    if (tileX >= 16 && tileY >= 11) return 'SKYWELL APPROACH'
    if (tileX >= 14 && tileY <= 8) return 'MOONWAKE SHRINE'
    if (tileX >= 13 && tileY >= 8) return 'EAST FIELD'
    if (tileX >= 9 && tileY >= 10) return 'VERDANT ARCHIVE'
    if (tileY >= 9) return 'SOUTH GARDEN'
    return 'LUMA QUAY'
  }

  showAreaPop(area: string) {
    const text = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 110, area, { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '42px' }).setOrigin(0.5).setScrollFactor(0).setDepth(118).setAlpha(0.48).setName('area-pop')
    this.scene.tweens.add({ targets: text, y: text.y - 18, alpha: 0, delay: 1400, duration: 600, ease: 'Sine.easeInOut', onComplete: () => text.destroy() })
  }

  createHud() {
    const hudGraphics = this.scene.add.graphics().setScrollFactor(0).setDepth(90)
    const nameText = this.scene.add.text(54, 22, 'Nara Lv.3', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(92)
    const hpText = this.scene.add.text(180, 42, '', { color: '#f8fff9', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(92)
    const mpText = this.scene.add.text(180, 58, '', { color: '#eff6ff', fontFamily: 'Arial, sans-serif', fontSize: '11px' }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(92)
    const goldText = this.scene.add.text(198, 22, '', { color: '#ffd166', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(92)
    const companionTexts = [this.scene.add.text(50, 100, 'Kael', { color: '#d7fbe8', fontFamily: 'Arial, sans-serif', fontSize: '11px' }), this.scene.add.text(50, 128, 'Io', { color: '#dbeafe', fontFamily: 'Arial, sans-serif', fontSize: '11px' })]
    const swordTexts = [this.scene.add.text(28, 100, '⚔', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }), this.scene.add.text(28, 128, '⚔', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '10px' })]
    const portraits = [this.scene.add.circle(25, 105, 10, 0x55d27a, 0.94), this.scene.add.circle(25, 133, 10, 0x60a5fa, 0.94)]
    ;[...companionTexts, ...swordTexts, ...portraits].forEach((entry) => entry.setScrollFactor(0).setDepth(92))
    this.scene.hudPanel = { graphics: hudGraphics, nameText, hpText, mpText, goldText, companionTexts, swordTexts, portraits }
    this.scene.add.circle(30, 30, 15, 0xff8a3d, 0.95).setStrokeStyle(2, 0xfff1a8, 0.7).setScrollFactor(0).setDepth(92)
    this.scene.add.text(30, 30, 'N', { color: '#111827', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(93)
    this.scene.objectivePanel = this.scene.add.rectangle(this.scene.scale.width / 2, 18, this.scene.uiWidth(0.45, 430), 32, 0x050713, 0.72).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90).setStrokeStyle(1, 0x9ff3ff, 0.32)
    this.scene.objectiveText = this.scene.add.text(this.scene.scale.width / 2, 34, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '14px', wordWrap: { width: 400 } }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
    this.scene.inventoryText = this.scene.add.text(16, 156, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#05071388', padding: { x: 8, y: 4 } }).setScrollFactor(0).setDepth(91)
    this.scene.levelText = this.scene.add.text(0, 0, '', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '1px' }).setVisible(false)
    this.scene.killCounterText = this.scene.add.text(this.scene.scale.width - 24, 24, 'Kills: 0', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }).setOrigin(1, 0).setScrollFactor(0).setDepth(91)
    this.scene.comboText = this.scene.add.text(this.scene.scale.width - 24, 24, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px', fontStyle: 'bold', shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 3, fill: true } }).setOrigin(1, 0).setScrollFactor(0).setDepth(96)
    this.scene.dashReadyText = this.scene.add.text(this.scene.scale.width - 24, 54, 'DASH READY', { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold' }).setOrigin(1, 0).setScrollFactor(0).setDepth(96).setAlpha(0)
    const areaPanel = this.scene.add.rectangle(this.scene.scale.width / 2, 14, 190, 38, 0x0b0e1a, 0.9).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90)
    areaPanel.setStrokeStyle(1, 0x9ff3ff, 0.58)
    this.scene.areaText = this.scene.add.text(this.scene.scale.width / 2, 31, 'Luma Quay', { color: '#9ff3ff', fontFamily: 'Georgia, serif', fontSize: '16px' }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
    this.scene.promptText = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height - 24, 'WASD: Move | Space: Attack', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px', backgroundColor: '#08091acc', padding: { x: 12, y: 6 }, wordWrap: { width: this.scene.uiWidth(0.86, 760) } }).setOrigin(0.5).setScrollFactor(0).setDepth(95)
    this.scene.tweens.add({ targets: this.scene.promptText, alpha: 0, delay: 10000, duration: 900 })
    this.scene.createSkillBar()
    this.scene.playerHpBarBg = this.scene.add.graphics().setDepth(22)
    this.scene.playerHpBar = this.scene.add.graphics().setDepth(23)
    this.scene.playerMpBar = this.scene.add.graphics().setDepth(23)
    this.scene.playerHpText = this.scene.add.text(0, 0, '', { color: '#f8fff9', fontFamily: 'Arial, sans-serif', fontSize: '10px', shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 1, fill: true } }).setOrigin(0.5).setDepth(24)
    this.scene.playerMpText = this.scene.add.text(0, 0, '', { color: '#eff6ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 1, fill: true } }).setOrigin(0.5).setDepth(24)
    this.scene.playerXpBar = this.scene.add.graphics().setScrollFactor(0).setDepth(91)
  }

  createTouchControls() {
    const { width, height } = this.scene.scale
    const padX = 92
    const padY = height - 72
    const controls = [
      { label: '◀', x: padX - 40, y: padY, move: { x: -1, y: 0 } },
      { label: '▶', x: padX + 40, y: padY, move: { x: 1, y: 0 } },
      { label: '▲', x: padX, y: padY - 40, move: { x: 0, y: -1 } },
      { label: '▼', x: padX, y: padY + 40, move: { x: 0, y: 1 } },
    ]

    controls.forEach((control) => {
      const button = this.scene.add.circle(control.x, control.y, 28, 0x08091a, 0.46).setScrollFactor(0).setDepth(96).setStrokeStyle(2, 0xffffff, 0.34).setInteractive({ useHandCursor: true })
      const label = this.scene.add.text(control.x, control.y, control.label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setScrollFactor(0).setDepth(97)
      button.on('pointerdown', () => { this.scene.touchMove = control.move; this.scene.touchFeedback(button, 0x1b3762) })
      button.on('pointerup', () => { this.scene.touchMove = null; button.setFillStyle(0x08091a, 0.46).setScale(1) })
      button.on('pointerout', () => { if (this.scene.touchMove === control.move) { this.scene.touchMove = null }; button.setFillStyle(0x08091a, 0.46) })
      this.scene.touchButtons.push(button, label)
    })

    const attack = this.scene.add.text(width - 154, height - 94, 'ATK', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', backgroundColor: '#2e0a0a88', padding: { x: 17, y: 17 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
    const interact = this.scene.add.text(width - 92, height - 94, 'E', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', backgroundColor: '#0a0a2e88', padding: { x: 21, y: 16 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
    const menu = this.scene.add.text(width - 88, height - 36, 'MENU', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '13px', backgroundColor: '#08091a88', padding: { x: 18, y: 13 } }).setOrigin(0.5).setScrollFactor(0).setDepth(96).setInteractive({ useHandCursor: true })
    attack.on('pointerdown', () => { this.scene.touchTextFeedback(attack); this.scene.performPlayerAttack() })
    interact.on('pointerdown', () => { this.scene.touchTextFeedback(interact); this.scene.interact() })
    menu.on('pointerdown', () => { this.scene.touchTextFeedback(menu); this.scene.openMenu() })
    this.scene.touchButtons.push(attack, interact, menu)
  }

  touchFeedback(button: Phaser.GameObjects.Arc, color: number) {
    button.setScale(0.94).setFillStyle(color, 0.78)
    navigator.vibrate?.(12)
  }

  touchTextFeedback(button: Phaser.GameObjects.Text) {
    button.setScale(0.94).setColor('#ffd36e')
    this.scene.time.delayedCall(90, () => button.setScale(1).setColor('#ffffff'))
    navigator.vibrate?.(12)
  }

  movePlayer(deltaX: number, deltaY: number) {
    if (!this.scene.player) {
      return
    }
    if (deltaX !== 0) {
      const nextX = Phaser.Math.Clamp(this.scene.player.x + deltaX, this.scene.player.width / 2, MAP_WIDTH * TILE_SIZE - this.scene.player.width / 2)
      if (!this.scene.collidesAt(nextX, this.scene.player.y)) {
        this.scene.player.x = nextX
      } else if (this.scene.time.now < this.scene.dashUntil) {
        this.scene.handleDashWallSlide(deltaX < 0 ? 1 : -1, 0)
      }
    }
    if (deltaY !== 0) {
      const nextY = Phaser.Math.Clamp(this.scene.player.y + deltaY, this.scene.player.height / 2, MAP_HEIGHT * TILE_SIZE - this.scene.player.height / 2)
      if (!this.scene.collidesAt(this.scene.player.x, nextY)) {
        this.scene.player.y = nextY
      } else if (this.scene.time.now < this.scene.dashUntil) {
        this.scene.handleDashWallSlide(0, deltaY < 0 ? 1 : -1)
      }
    }
  }

  collidesAt(x: number, y: number): boolean {
    if (!this.scene.player) {
      return false
    }
    const halfWidth = this.scene.player.width / 2
    const halfHeight = this.scene.player.height / 2
    return [
      { x: x - halfWidth + 3, y: y - halfHeight + 3 },
      { x: x + halfWidth - 3, y: y - halfHeight + 3 },
      { x: x - halfWidth + 3, y: y + halfHeight - 3 },
      { x: x + halfWidth - 3, y: y + halfHeight - 3 },
    ].some((point) => this.scene.isWallAtWorld(point.x, point.y))
  }

  queueHint(id: string, text: string, duration = 4000) {
    if (this.scene.shownHints.has(id) || this.scene.hintQueue.some((hint) => hint.id === id)) return
    this.scene.shownHints.add(id)
    this.scene.hintQueue.push({ id, text, duration })
    if (!this.scene.hintContainer) this.scene.showNextHint()
  }

  showNextHint() {
    const hint = this.scene.hintQueue.shift()
    if (!hint) return
    const y = this.scene.scale.height - 62
    const width = Math.min(960, this.scene.scale.width - 48)
    const panel = this.scene.add.rectangle(0, 0, width, 30, 0x050713, 0.88).setStrokeStyle(1, 0xffd36e, 0.86)
    const accent = this.scene.add.rectangle(-width / 2 + 4, 0, 3, 22, 0xffd36e, 0.95)
    const label = this.scene.add.text(0, 0, hint.text, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px' }).setOrigin(0.5)
    const container = this.scene.add.container(this.scene.scale.width / 2, y, [panel, accent, label]).setScrollFactor(0).setDepth(140).setAlpha(0)
    container.setName(`hint:${hint.id}`)
    this.scene.hintContainer = container
    this.scene.tweens.add({ targets: container, alpha: 1, duration: 200, ease: 'Sine.easeOut' })
    this.scene.time.delayedCall(hint.duration ?? 4000, () => this.scene.dismissHint(hint.id))
  }

  dismissHint(id?: string) {
    if (!this.scene.hintContainer || (id && this.scene.hintContainer.name !== `hint:${id}`)) return
    const container = this.scene.hintContainer
    this.scene.hintContainer = undefined
    this.scene.tweens.add({ targets: container, alpha: 0, duration: 300, ease: 'Sine.easeIn', onComplete: () => { container.destroy(); this.scene.showNextHint() } })
  }

  updateOnboardingHints() {
    if (!this.scene.player) return
    if (this.scene.mapEnemies.some((enemy) => !enemy.dead && Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, enemy.x, enemy.y) <= 200)) this.scene.queueHint('attack', 'Space to attack')
    if (this.scene.saveData.party[0]?.level >= 2) this.scene.queueHint('skills', '1-4 for skills')
  }

  updateLowHpHeartbeat() {
    const hero = this.scene.saveData.party[0]
    const pct = hero.currentHp / this.scene.getPlayerCombatStats().hp
    if (pct < 0.3 && this.scene.time.now - this.scene.lastHeartbeatAt > 1500) {
      this.scene.lastHeartbeatAt = this.scene.time.now
      audioManager.setLowHpHeartbeat(pct)
    }
  }

  showLevelUpCeremony(levelUps: Array<{ name: string; level: number }>) {
    levelUps.forEach((levelUp, index) => {
      this.scene.time.delayedCall(800 * index, () => {
        audioManager.playSfx('level_up')
        this.scene.flashHudGold()
        this.scene.showToast(`${levelUp.name} ascends to Level ${levelUp.level}!`)
      })
    })
  }

  flashHudGold() {
    const flash = this.scene.add.rectangle(0, 0, this.scene.scale.width, 118, 0xffd36e, 0.28).setOrigin(0).setScrollFactor(0).setDepth(96)
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => flash.destroy() })
  }

  showToast(message: string) {
    const { width } = this.scene.scale
    this.scene.toast?.destroy()
    const lower = message.toLowerCase()
    const color = lower.includes('failed') || lower.includes("can't") || lower.includes('not enough') ? '#ff8a8a' : lower.includes('no health') || lower.includes('already') || lower.includes('low') ? '#ffb86b' : lower.includes('purchased') || lower.includes('yields') || lower.includes('restored') || lower.includes('complete') ? '#86efac' : '#ffffff'
    const panelW = Math.min(message.length * 9 + 48, this.scene.uiWidth(0.78, 740))
    const wrapWidth = Math.max(160, panelW - 32)
    const estimatedCharsPerLine = Math.max(22, Math.floor(wrapWidth / 8.2))
    const panelH = Math.max(Math.ceil(message.length / estimatedCharsPerLine) * 22 + 52, 52)
    const container = this.scene.add.container(width / 2, 82).setScrollFactor(0).setDepth(125).setAlpha(0)
    const glow = this.scene.add.rectangle(0, 0, panelW + 14, panelH + 12, 0xffd36e, 0.1)
    const panel = this.scene.add.rectangle(0, 0, panelW, panelH, 0x0a0e1e, 0.94).setStrokeStyle(1, 0xd4a84b, 0.72)
    const accent = this.scene.add.rectangle(-panelW / 2 + 3, 0, 3, panelH - 8, 0xd4a84b, 0.8)
    const text = this.scene.add.text(0, 0, message, { color, fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: wrapWidth } }).setOrigin(0.5)
    container.add([glow, panel, accent, text])
    this.scene.toast = container
    this.scene.tweens.add({ targets: container, y: 104, alpha: 1, duration: 180, ease: 'Sine.easeOut' })
    this.scene.tweens.add({ targets: container, y: 88, alpha: 0, delay: 3000, duration: 520, onComplete: () => { if (this.scene.toast === container) { this.scene.toast = undefined }; container.destroy() } })
  }

  showRewardToast(message: string) {
    const { width } = this.scene.scale
    this.scene.toast?.destroy()
    const container = this.scene.add.container(width / 2, 128).setScrollFactor(0).setDepth(125)
    const panelW = this.scene.uiWidth(0.79, 760)
    container.add(this.scene.add.rectangle(0, 0, panelW, 48, 0x231525, 0.94).setStrokeStyle(2, 0xffd36e, 0.72))
    container.add(this.scene.add.text(0, 0, message, { color: '#86efac', fontFamily: 'Arial, sans-serif', fontSize: '18px', wordWrap: { width: panelW - 60 } }).setOrigin(0.5))
    this.scene.toast = container
    this.scene.tweens.add({ targets: container, y: '-=10', alpha: 0, delay: 3000, duration: 520, onComplete: () => { if (this.scene.toast === container) { this.scene.toast = undefined }; container.destroy() } })
  }

  showAreaBanner(title: string, subtitle: string) {
    this.scene.dismissBanners()
    this.scene.areaText?.setText(title)
    const { width } = this.scene.scale
    const bannerW = this.scene.uiWidth(0.6, 580)
    const bannerH = this.scene.uiHeight(0.13, 84)
    const glow = this.scene.add.rectangle(width / 2, 84, bannerW + 24, bannerH + 20, 0x9ff3ff, 0.08).setScrollFactor(0).setDepth(119.8)
    const panel = this.scene.add.rectangle(width / 2, 84, bannerW, bannerH, 0x071023, 0.9).setScrollFactor(0).setDepth(120).setStrokeStyle(1, 0x9ff3ff, 0.62)
    const rule = this.scene.add.rectangle(width / 2, 110, Math.min(bannerW - 80, 430), 2, 0xffd36e, 0.62).setScrollFactor(0).setDepth(121)
    const heading = this.scene.add.text(width / 2, 62, title, { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: `${Math.min(26, Math.max(18, Math.floor(width / 37)))}px`, wordWrap: { width: bannerW - 32 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    const body = this.scene.add.text(width / 2, 92, subtitle, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: bannerW - 60 } }).setOrigin(0.5).setScrollFactor(0).setDepth(121)
    this.scene.activeBanners.push(glow, panel, rule, heading, body)
    this.scene.tweens.add({ targets: [glow, panel, rule, heading, body], alpha: 0, delay: 1500, duration: 260, onComplete: () => { glow.destroy(); panel.destroy(); rule.destroy(); heading.destroy(); body.destroy(); this.scene.activeBanners = this.scene.activeBanners.filter(b => b.scene && b.active) } })
  }

  showEventBanner(title: string, subtitle: string) {
    this.scene.dismissBanners()
    const { width, height } = this.scene.scale
    const eventW = this.scene.uiWidth(0.69, 660)
    const panel = this.scene.add.rectangle(width / 2, height / 2 - 140, eventW, this.scene.uiHeight(0.14, 92), 0x1b1020, 0.92).setScrollFactor(0).setDepth(130).setStrokeStyle(2, 0xffd36e, 0.72)
    const accent = this.scene.add.rectangle(width / 2, height / 2 - 186, 0, 2, 0xffd36e, 0.9).setScrollFactor(0).setDepth(131)
    const heading = this.scene.add.text(width / 2, height / 2 - 162, title, { color: '#ffd36e', fontFamily: 'Georgia, serif', fontSize: '24px' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const body = this.scene.add.text(width / 2, height / 2 - 130, subtitle, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', wordWrap: { width: eventW - 60 } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    this.scene.activeBanners.push(panel, accent, heading, body)
    this.scene.tweens.add({ targets: accent, width: 560, duration: 260, ease: 'Sine.easeOut' })
    this.scene.tweens.add({ targets: [panel, accent, heading, body], y: '-=10', alpha: 0, delay: 2600, duration: 520, onComplete: () => { panel.destroy(); accent.destroy(); heading.destroy(); body.destroy(); this.scene.activeBanners = this.scene.activeBanners.filter(b => b.scene && b.active) } })
    this.scene.cameras.main.flash(180, 255, 211, 110, false)
  }

  showFirstSessionGuide() {
    if (this.scene.flag('elder_intro')) {
      return
    }

    audioManager.playSfx('objective_update')
    this.scene.showEventBanner('Demo Start', 'A 15-minute vertical slice: meet Elder Maelin, follow the objective, and chase the Moonwake Shrine route.')
    this.scene.time.delayedCall(450, () => {
      this.scene.showToast('Start here: move north to Elder Maelin. Guide Rin, signposts, and the gold objective will keep you on the authored path.')
    })
  }

  startFirstCombatTutorial() {
    if (!this.scene.player || !this.scene.shouldRunFirstCombatTutorial()) return
    this.scene.tutorialState = 'step1-kill'
    this.scene.tutorialStepStartedAt = this.scene.time.now
    this.scene.showTutorialOverlay('Press SPACE to attack')
    this.scene.spawnTutorialEnemy('step1')
  }

  isTutorialActive() {
    return this.scene.tutorialState !== 'none' && this.scene.tutorialState !== 'complete'
  }

  showTutorialOverlay(message: string) {
    const { width, height } = this.scene.scale
    this.scene.tutorialOverlay?.destroy()
    const container = this.scene.add.container(width / 2, height - 112).setScrollFactor(0).setDepth(126)
    const text = this.scene.add.text(0, 0, message, {
      color: '#ffd166',
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      fontStyle: 'bold',
      shadow: { offsetX: 0, offsetY: 2, color: '#000000', blur: 8, fill: true },
      wordWrap: { width: this.scene.uiWidth(0.82, 760) },
    }).setOrigin(0.5)
    container.add(text)
    this.scene.tutorialOverlay = container
    this.scene.tweens.add({ targets: text, alpha: 0.28, scale: 0.94, yoyo: true, repeat: -1, duration: 1000, ease: 'Sine.easeInOut' })
    this.scene.tutorialTimer?.destroy()
    this.scene.tutorialTimer = this.scene.time.addEvent({ delay: 2000, loop: true, callback: () => {
      if (!this.scene.isTutorialActive()) return
      text.setText(message)
      text.setAlpha(1)
    } })
  }

  updateTutorialProgress() {
    if (!this.scene.player || !this.scene.isTutorialActive()) return
    if (this.scene.tutorialState === 'step2-dash' && this.scene.time.now < this.scene.dashUntil) {
      const target = this.scene.mapEnemies.find((enemy) => enemy.tutorialRole === 'step2' && !enemy.dead)
      if (target && Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, target.x, target.y) < 34) {
        this.scene.damageEnemy(target, 1.35)
      }
    }
    if (this.scene.tutorialState === 'step3-block' && this.scene.time.now - this.scene.tutorialStepStartedAt >= 10000) {
      this.scene.completeFirstCombatTutorial()
    }
  }

  completeFirstCombatTutorial() {
    if (this.scene.tutorialState === 'complete') return
    this.scene.tutorialState = 'complete'
    this.scene.tutorialOverlay?.destroy()
    this.scene.tutorialOverlay = undefined
    this.scene.tutorialTimer?.destroy()
    this.scene.tutorialTimer = undefined
    this.scene.saveData.flags.tutorialCompleted = true
    this.scene.mapEnemies
      .filter((enemy) => enemy.tutorialRole && !enemy.dead)
      .forEach((enemy) => {
        enemy.dead = true
        this.scene.tweens.add({ targets: [enemy.sprite, enemy.aura, enemy.nameText], alpha: 0, duration: 260, onComplete: () => this.scene.destroyEnemy(enemy) })
      })
    this.scene.showToast("You're ready. Explore freely!")
    this.scene.spawnRegularEnemiesForStage()
    this.scene.time.delayedCall(1200, () => this.scene.showFirstSessionGuide())
    this.scene.persist()
  }

  showNewGamePlusBanner() {
    const level = this.scene.saveData.ngPlusLevel
    this.scene.showEventBanner(`New Game+ ${level}`, `Enemies hit harder, endure longer, and the route has shifted.`)
    this.scene.time.delayedCall(500, () => this.scene.showToast(`New Game+ ${level} begins. Party levels, skills, and equipment carried forward.`))
  }

  showSignpostGuide() {
    const routes = ['◄ North: Elder Maelin\'s quarters']
    if (this.scene.flag('elder_intro') || this.scene.flag('marker_read') || this.scene.flag('field_battle_won')) {
      routes.push('► East: Guardian Field → Moonwake Shrine')
    }
    if (this.scene.flag('mira_recruited') || this.scene.saveData.pet.unlocked || this.scene.homeProgress() > 0) {
      routes.push('▼ South: Home, Bell Thicket, Verdant Archive')
    }
    if (this.scene.flag('thornheart_won') || this.scene.flag('skywell_opened')) {
      routes.push('▲ Beyond Archive: Skywell Approach')
    }
    routes.slice(0, 4).forEach((route, index) => {
      this.scene.time.delayedCall(index * 200, () => this.scene.showToast(route))
    })
  }

  showDemoCompletionCard() {
    this.scene.dismissBanners()
    const { width, height } = this.scene.scale
    const playTime = this.scene.formatPlayTime(this.scene.saveData.playTime)
    const partyLevels = this.scene.saveData.party.map((member) => `${CHARACTERS[member.characterId]?.name ?? member.characterId} Lv.${member.level}`).join('  •  ')
    const glow = this.scene.add.ellipse(width / 2, height / 2 + 20, 820, 270, 0xffa43a, 0.14).setScrollFactor(0).setDepth(179)
    const panel = this.scene.add.rectangle(width / 2, height / 2 + 20, this.scene.uiWidth(0.81, 780), this.scene.uiHeight(0.39, 250), 0x190d16, 0.96).setScrollFactor(0).setDepth(180).setStrokeStyle(2, 0xffd36e, 0.82)
    const heading = this.scene.add.text(width / 2, height / 2 - 82, 'Luma Quay Endures', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '30px' }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const body = this.scene.add.text(width / 2, height / 2 - 24, `Play time: ${playTime}\n✓ Shrine purified   ✓ Thornheart felled   ✓ Skywell restored\n${partyLevels}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', align: 'center', lineSpacing: 8, wordWrap: { width: 710 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    const footer = this.scene.add.text(width / 2, height / 2 + 83, 'Save at the Skywell to keep this clear file, or return to the title and press R to reset for another showcase run.', { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '15px', align: 'center', wordWrap: { width: 660 } }).setOrigin(0.5).setScrollFactor(0).setDepth(181)
    this.scene.tweens.add({ targets: glow, alpha: 0.25, scale: ENTITY_SCALE.object * 1.73, yoyo: true, repeat: -1, duration: 1150, ease: 'Sine.easeInOut' })
    this.scene.tweens.add({ targets: [glow, panel, heading, body, footer], alpha: 0, delay: 7600, duration: 900, onComplete: () => { glow.destroy(); panel.destroy(); heading.destroy(); body.destroy(); footer.destroy(); this.scene.showCreditsScroll() } })
  }

  showCreditsScroll() {
    const { width, height } = this.scene.scale
    const overlay = this.scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0).setScrollFactor(0).setDepth(240)
    const credits = this.scene.add.text(width / 2, height + 80, 'Emberglass: Covenant of the Skywell\nA handcrafted JRPG experience\n\nGame Design & Development\nZai & Hermes\n\nArt\nProgrammatic Pixel Art (Pillow)\n\nMusic & SFX\nWeb Audio API\n\nThank you for playing.', { align: 'center', color: '#ffffff', fontFamily: 'Georgia, serif', fontSize: `${Math.min(25, Math.max(18, Math.floor(width / 38)))}px`, lineSpacing: 14, wordWrap: { width: this.scene.uiWidth(0.84, 800) } }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(241)
    const skip = () => this.scene.scene.start('TitleScene')
    this.scene.input.keyboard?.once('keydown-ESC', skip)
    this.scene.input.keyboard?.once('keydown-ENTER', skip)
    this.scene.tweens.add({ targets: overlay, alpha: 0.86, duration: 260, ease: 'Sine.easeInOut' })
    this.scene.tweens.add({ targets: credits, y: -360, duration: 8000, ease: 'Linear', onComplete: () => {
      this.scene.tweens.add({ targets: [overlay, credits], alpha: 0, duration: 260, onComplete: () => this.scene.scene.start('TitleScene') })
    } })
  }

  formatPlayTime(playTime: number) {
    const totalSeconds = Math.max(0, Math.floor(playTime || this.scene.time.now / 1000))
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  }

  openMenu() {
    if (this.scene.menuOverlay) {
      return
    }

    this.scene.busy = true
    audioManager.playSfx('ui_menu_open')
    const { width, height } = this.scene.scale
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(200)
    const counts = this.scene.getInventoryCounts()
    const playTime = this.scene.formatPlayTime(this.scene.saveData.playTime)

    const inventoryLines = [
      `Potion x${counts.potion}`,
      `Ether x${counts.ether}`,
      `Ember Shard x${counts.emberShard}`,
      ...this.scene.saveData.inventory
        .filter((entry) => ['wind_charm', 'warding_ember', 'skywell_shard', 'glass_lens'].includes(entry.itemId))
        .map((entry) => `${ITEMS_BY_ID[entry.itemId]?.name ?? entry.itemId} x${entry.quantity}`),
    ]

    container.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.58))
    container.add(this.scene.add.rectangle(width / 2, 18, width, 36, 0x000000, 0.34))
    container.add(this.scene.add.rectangle(width / 2, height - 18, width, 36, 0x000000, 0.34))
    container.add(this.scene.add.rectangle(18, height / 2, 36, height, 0x000000, 0.34))
    container.add(this.scene.add.rectangle(width - 18, height / 2, 36, height, 0x000000, 0.34))
    const menuW = this.scene.uiWidth(0.73, 700)
    const menuH = this.scene.uiHeight(0.78, 500)
    const panel = this.scene.add.rectangle(width / 2, height / 2, menuW, menuH, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.6)
    container.add(panel)
    container.add(this.scene.add.rectangle(width / 2, height / 2 - 136, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.scene.add.rectangle(width / 2, height / 2 - 52, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.scene.add.rectangle(width / 2, height / 2 + 132, menuW - 60, 1, 0xd4a84b, 0.3))
    container.add(this.scene.add.text(width / 2 - 310, height / 2 - 220, '◈', { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '22px' }))
    container.add(this.scene.add.text(width / 2 - 290, height / 2 - 220, 'Emberglass Menu', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '28px' }))
    container.add(this.scene.add.text(width / 2 + 112, height / 2 - 216, `${this.scene.saveData.gold}g  •  ${playTime}`, { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '21px' }))
    container.add(this.scene.add.text(width / 2 - 310, height / 2 - 168, `Objective\n${this.scene.saveData.currentObjective}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: menuW - 90 } }))
    this.scene.saveData.party.forEach((member, index) => this.scene.addMenuPartyRow(container, width / 2 - 300 + index * 198, height / 2 - 74, member))
    container.add(this.scene.add.text(width / 2 + 64, height / 2 - 86, `Inventory\n${inventoryLines.join('\n')}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '16px', lineSpacing: 7 }))
    this.scene.addSaveLoadMenu(container, width / 2 - 310, height / 2 + 118)
    const status = this.scene.add.text(width / 2 + 232, height / 2 + 146, 'Status', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    status.on('pointerdown', () => this.scene.openStatusScreen())
    container.add(status)
    container.add(this.scene.add.text(width / 2 - 310, height / 2 + 184, CONTROLS_DISPLAY, { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '15px', wordWrap: { width: menuW - 80 } }))
    this.scene.menuOverlay = { container }
  }

  addSaveLoadMenu(container: Phaser.GameObjects.Container, x: number, y: number) {
    container.add(this.scene.add.text(x, y, 'Save', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '18px' }))
    container.add(this.scene.add.text(x, y + 26, `Auto-save: Slot ${SaveSystem.getAutoSaveSlot()} (always active)`, { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '13px' }))
    SaveSystem.getManualSlots().forEach((slot, index) => {
      const slotInfo = SaveSystem.getSlotInfo(slot)
      const summary = slotInfo?.exists ? this.scene.formatSlotSummary(slotInfo) : 'Empty'
      const rowY = y + 52 + index * 26
      const save = this.scene.add.text(x, rowY, `Manual Save → Slot ${slot}`, { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '13px' }).setInteractive({ useHandCursor: true })
      save.on('pointerover', () => { save.setColor('#fff1a8'); audioManager.playSfx('ui_blip') })
      save.on('pointerout', () => save.setColor('#f0c040'))
      save.on('pointerdown', () => this.scene.confirmManualSave(slot, Boolean(slotInfo?.exists)))
      container.add(save)

      const loadColor = slotInfo?.exists ? '#86efac' : '#5f6684'
      const load = this.scene.add.text(x + 160, rowY, `Load → Slot ${slot}`, { color: loadColor, fontFamily: 'Arial, sans-serif', fontSize: '13px' })
      if (slotInfo?.exists) {
        load.setInteractive({ useHandCursor: true })
        load.on('pointerover', () => { load.setColor('#fff1a8'); audioManager.playSfx('ui_blip') })
        load.on('pointerout', () => load.setColor(loadColor))
        load.on('pointerdown', () => this.scene.loadManualSlot(slot))
      }
      container.add(load)
      container.add(this.scene.add.text(x + 286, rowY, summary, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
    })
  }

  closeMenu() {
    this.scene.menuOverlay?.container.destroy()
    this.scene.menuOverlay = undefined
    this.scene.busy = false
    audioManager.setPaused(false)
    audioManager.playSfx('ui_cancel')
  }

  openPauseOverlay() {
    if (this.scene.pauseOverlay || this.scene.menuOverlay) return
    this.scene.pauseOverlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(260).setAlpha(0)
    const { width, height } = this.scene.scale
    this.scene.pauseOverlay.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.65))
    const panelW = this.scene.uiWidth(0.38, 280)
    const panelH = this.scene.uiHeight(0.42, 260)
    const panel = this.scene.add.rectangle(width / 2, height / 2, panelW, panelH, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.65)
    this.scene.pauseOverlay.add(panel)
    this.scene.pauseOverlay.add(this.scene.add.text(width / 2, height / 2 - panelH / 2 + 28, '◈ PAUSED', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '26px', fontStyle: 'bold' }).setOrigin(0.5))
    audioManager.setPaused(true)
    audioManager.playSfx('ui_menu_open')
    const buttons = [
      { label: 'Resume', action: () => this.scene.closePauseOverlay(), color: '#86efac' },
      { label: 'Save Game', action: () => { SaveSystem.autoSave(this.scene.saveData); this.scene.showToast('Game Saved'); audioManager.playSfx('save_point') }, color: '#f0c040' },
      { label: 'Open Menu', action: () => { this.scene.closePauseOverlay(); this.scene.openMenu() }, color: '#d7d9e8' },
      { label: 'Quit to Title', action: () => { this.scene.pauseOverlay = undefined; this.scene.scene.start('TitleScene') }, color: '#ff8a8a' },
    ]
    buttons.forEach((btn, index) => {
      const btnY = height / 2 - 30 + index * 42
      const text = this.scene.add.text(width / 2, btnY, btn.label, { color: btn.color, fontFamily: 'Arial, sans-serif', fontSize: '18px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      text.on('pointerover', () => { text.setColor('#fff1a8'); audioManager.playSfx('ui_blip') })
      text.on('pointerout', () => text.setColor(btn.color))
      text.on('pointerdown', () => btn.action())
      this.scene.pauseOverlay?.add(text)
    })
    this.scene.tweens.add({ targets: this.scene.pauseOverlay, alpha: 1, duration: 180, ease: 'Sine.easeOut' })
  }

  closePauseOverlay() {
    if (!this.scene.pauseOverlay) return
    audioManager.setPaused(false)
    audioManager.playSfx('ui_cancel')
    this.scene.tweens.add({ targets: this.scene.pauseOverlay, alpha: 0, duration: 120, onComplete: () => { this.scene.pauseOverlay?.destroy(); this.scene.pauseOverlay = undefined } })
  }

  addMenuPartyRow(container: Phaser.GameObjects.Container, x: number, y: number, member: SaveData['party'][number]) {
    const character = CHARACTERS[member.characterId]
    if (!character) return
    const stats = this.scene.scaleCharacterStats(character, member.level)
    const hpRatio = Phaser.Math.Clamp(member.currentHp / stats.hp, 0, 1)
    container.add(this.scene.add.text(x, y, `${character.name} Lv.${member.level}`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '15px' }))
    container.add(this.scene.add.rectangle(x + 56, y + 28, 116, 8, 0x281018, 0.95).setOrigin(0.5))
    container.add(this.scene.add.rectangle(x - 2, y + 28, 112 * hpRatio, 6, 0x45e67a, 0.95).setOrigin(0, 0.5))
    container.add(this.scene.add.text(x, y + 40, `HP ${member.currentHp}/${stats.hp}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
  }

  formatSlotSummary(slotInfo: NonNullable<ReturnType<typeof SaveSystem.getSlotInfo>>) {
    return `${this.scene.formatPlayTime(slotInfo.playTime ?? 0)} • Lv.${slotInfo.level ?? 1} • ${this.scene.formatStageName(slotInfo.stage)}`
  }

  formatStageName(stage?: SaveData['stage']) {
    const names: Record<SaveData['stage'], string> = {
      quay: 'Luma Quay',
      field: 'Eastern Field',
      shrine: 'Moonwake Shrine',
      archive: 'Verdant Archive',
      skywell: 'Skywell',
      homecoming: 'Homecoming',
    }
    return stage ? names[stage] : 'Luma Quay'
  }

  confirmManualSave(slot: number, overwrite: boolean) {
    if (overwrite && !window.confirm(`Overwrite manual save slot ${slot}?`)) {
      audioManager.playSfx('ui_cancel')
      return
    }

    this.scene.saveCurrentPosition()
    const saved = SaveSystem.save(slot, this.scene.saveData)
    audioManager.playSfx(saved ? 'save_point' : 'ui_cancel')
    this.scene.closeMenu()
    this.scene.showToast(saved ? `Saved to slot ${slot}.` : `Save slot ${slot} failed.`)
  }

  loadManualSlot(slot: number) {
    const data = SaveSystem.load(slot)
    if (!data) {
      audioManager.playSfx('ui_cancel')
      this.scene.showToast(`Slot ${slot} is empty.`)
      return
    }

    audioManager.playSfx('scene_whoosh')
    this.scene.scene.start('OverworldScene', { continueGame: true, saveSlot: slot })
  }

  openStatusScreen() {
    if (!this.scene.menuOverlay) return
    const { width, height } = this.scene.scale
    const overlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(215)
    this.scene.menuOverlay.container.add(overlay)
    overlay.add(this.scene.add.rectangle(width / 2, height / 2, this.scene.uiWidth(0.79, 760), this.scene.uiHeight(0.78, 500), 0x090d20, 0.94).setStrokeStyle(2, 0x8ab4f8, 0.72))
    overlay.add(this.scene.add.text(width / 2 - 340, height / 2 - 226, 'Party Status', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '27px' }))
    this.scene.saveData.party.forEach((member, index) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const stats = this.scene.scaleCharacterStats(character, member.level)
      const x = width / 2 - 320
      const y = height / 2 - 172 + index * 126
      overlay.add(this.scene.add.text(x, y, `${character.name} (Lv.${member.level})`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '19px' }))
      this.scene.addStatusBar(overlay, x, y + 36, 'HP', member.currentHp, stats.hp, 0x45e67a)
      this.scene.addStatusBar(overlay, x, y + 58, 'MP', member.currentMp, stats.mp, 0x6db7ff)
      overlay.add(this.scene.add.text(x + 220, y + 32, `ATK ${stats.atk}  DEF ${stats.def}  SPD ${stats.spd}  MAG ${stats.mag}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '15px' }))
      const equipment = `Weapon: ${this.scene.itemName(member.equipment.weapon)}   Charm: ${this.scene.itemName(member.equipment.charm)}   Relic: ${this.scene.itemName(member.equipment.relic)}`
      overlay.add(this.scene.add.text(x, y + 88, `${equipment}\nLevel progress: Showcase milestone ${member.level}/6`, { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '14px' }))
    })
    const close = this.scene.add.text(width / 2, height / 2 + 216, 'Close', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => overlay.destroy())
    overlay.add(close)
  }

  addStatusBar(container: Phaser.GameObjects.Container, x: number, y: number, label: string, current: number, max: number, color: number) {
    container.add(this.scene.add.text(x, y - 8, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
    container.add(this.scene.add.rectangle(x + 90, y, 134, 9, 0x12182d, 0.98).setOrigin(0.5))
    container.add(this.scene.add.rectangle(x + 23, y, 130 * Phaser.Math.Clamp(current / max, 0, 1), 7, color, 0.95).setOrigin(0, 0.5))
    container.add(this.scene.add.text(x + 164, y - 8, `${current}/${max}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }))
  }

  itemName(itemId: string | null) {
    return itemId ? ITEMS_BY_ID[itemId]?.name ?? itemId : 'None'
  }

  handleCameraZoom(deltaY: number) {
    if (!DEV_MODE || !this.scene.player) return
    const zoomStep = deltaY < 0 ? 0.15 : -0.15
    this.scene.cameraZoom = Phaser.Math.Clamp(this.scene.cameraZoom + zoomStep, 0.4, 2)
    this.scene.tweens.killTweensOf(this.scene.cameras.main)
    this.scene.cameras.main.startFollow(this.scene.player, true, 0.1, 0.1)
    this.scene.cameras.main.setDeadzone(40, 28)
    this.scene.cameras.main.zoomTo(this.scene.cameraZoom, 200, 'Sine.easeInOut', true)
  }

  createMiniMap() {
    const container = this.scene.add.container(this.scene.scale.width - 176, 18).setScrollFactor(0).setDepth(120).setVisible(true)
    const graphics = this.scene.add.graphics()
    container.add(graphics)
    this.scene.miniMap = { container, graphics, visible: true }
    this.scene.updateMiniMap()
  }

  toggleMiniMap() {
    if (!this.scene.miniMap) return
    this.scene.miniMap.visible = !this.scene.miniMap.visible
    this.scene.miniMap.container.setVisible(this.scene.miniMap.visible)
    audioManager.playSfx('ui_blip')
  }

  updateMiniMap() {
    if (!this.scene.miniMap || !this.scene.miniMap.visible || !this.scene.player) return
    const graphics = this.scene.miniMap.graphics
    const width = 160
    const height = 120
    const padding = 8
    const mapWidth = width - padding * 2
    const mapHeight = height - padding * 2
    const scaleX = mapWidth / MAP_WIDTH
    const scaleY = mapHeight / MAP_HEIGHT
    const playerTile = this.scene.worldToTile(this.scene.player.x, this.scene.player.y)
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
    this.scene.companions.filter((companion) => companion.state !== 'dead').forEach((companion, index) => dot(this.scene.worldToTile(companion.x, companion.y), index % 2 === 0 ? 0x22c55e : 0x60a5fa, 2.4))
    this.scene.treasureChests.filter((chest) => !chest.opened).forEach((chest) => dot(chest.tile, 0xffd166, 2.2))
    this.scene.groundLoot.forEach((loot) => dot(this.scene.worldToTile(loot.x, loot.y), 0xffd166, 1.8))
    this.scene.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => dot(this.scene.worldToTile(enemy.x, enemy.y), 0xef4444, enemy.isBoss ? 3.6 : 2.4))
    dot(playerTile, 0xf8fafc, 3.6)
    graphics.lineStyle(1, 0xd4a84b, 0.72).strokeRoundedRect(0.5, 0.5, width - 1, height - 1, 8)
  }

  getRealtimeSkills(): RealtimeSkill[] {
    return [
      { name: 'Ember Slash', mpCost: 8, cooldown: 3000, color: 0xff7a3d, effect: 'emberSlash' },
      { name: 'Tidal Heal', mpCost: 12, cooldown: 6000, color: 0x45e67a, effect: 'tidalHeal' },
      { name: 'Stone Guard', mpCost: 10, cooldown: 8000, color: 0x9ca3af, effect: 'stoneGuard' },
      { name: 'Wind Step', mpCost: 6, cooldown: 2000, color: 0x9ff3ff, effect: 'windStep' },
    ]
  }

  createSkillBar() {
    const skills = this.scene.getRealtimeSkills()
    const x = this.scene.scale.width / 2 - 114
    const y = this.scene.scale.height - 92
    this.scene.skillBar = this.scene.add.container(x, y).setScrollFactor(0).setDepth(96)
    this.scene.skillCooldownGraphics = []
    this.scene.skillTexts = []
    this.scene.skillSlotFrames = []
    skills.forEach((skill, index) => {
      const slotX = index * 76
      const frame = this.scene.add.rectangle(slotX, 0, 58, 58, 0x0b0e1a, 0.92).setStrokeStyle(2, index === 0 ? 0xfff1a8 : 0xf3e1b0, index === 0 ? 0.95 : 0.55)
      this.scene.skillSlotFrames.push(frame)
      this.scene.skillBar!.add(frame)
      this.scene.skillBar!.add(this.scene.add.circle(slotX, -4, 16, skill.color, 0.9))
      this.scene.skillBar!.add(this.scene.add.text(slotX, -12, `${index + 1}`, { color: '#111827', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold' }).setOrigin(0.5))
      this.scene.skillBar!.add(this.scene.add.text(slotX, 15, `${skill.mpCost} MP`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5))
      this.scene.skillBar!.add(this.scene.add.text(slotX, 38, `${index + 1}`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5))
      const cooldown = this.scene.add.graphics()
      const text = this.scene.add.text(slotX, -3, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold' }).setOrigin(0.5)
      this.scene.skillCooldownGraphics.push(cooldown)
      this.scene.skillTexts.push(text)
      this.scene.skillBar!.add(cooldown)
      this.scene.skillBar!.add(text)
    })
  }

  updateSkillHud() {
    if (!this.scene.skillBar) return
    const hero = this.scene.saveData.party[0]
    const skills = this.scene.getRealtimeSkills()
    this.scene.skillCooldownGraphics.forEach((graphics, index) => {
      const skill = skills[index]
      const remaining = Math.max(0, this.scene.skillReadyAt[index] - this.scene.time.now)
      const disabled = hero.currentMp < skill.mpCost || remaining > 0
      graphics.clear()
      if (disabled) graphics.fillStyle(0x02030a, 0.62).fillRect(index * 76 - 29, -29, 58, 58)
      if (remaining > 0) graphics.fillStyle(0x111827, 0.78).slice(index * 76, 0, 30, -90, -90 + 360 * (remaining / skill.cooldown), true).fillPath()
      this.scene.skillSlotFrames[index]?.setStrokeStyle(2, index === 0 ? 0xfff1a8 : 0xf3e1b0, index === 0 ? 0.95 : 0.55)
      this.scene.skillTexts[index]?.setText(remaining > 3000 ? `${Math.ceil(remaining / 1000)}` : hero.currentMp < skill.mpCost ? `${skill.mpCost} MP` : '')
    })
  }

  openHelpOverlay() {
    if (this.scene.helpOverlay) { this.scene.helpOverlay.destroy(); this.scene.helpOverlay = undefined; return }
    const { width, height } = this.scene.scale
    const overlay = this.scene.add.container(width / 2, height - 58).setScrollFactor(0).setDepth(230)
    overlay.add(this.scene.add.rectangle(0, 0, 640, 34, 0x050713, 0.9).setStrokeStyle(1, 0x8ab4f8, 0.35))
    overlay.add(this.scene.add.text(0, 0, CONTROLS_DISPLAY, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '12px' }).setOrigin(0.5))
    this.scene.helpOverlay = overlay
  }

  dismissBanners() {
    this.scene.activeBanners.forEach((b) => b.destroy())
    this.scene.activeBanners = []
  }

  updateInteractionPrompt() {
    const tile = this.scene.getInteractionTile()
    const playerTile = this.scene.player ? this.scene.worldToTile(this.scene.player.x, this.scene.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.scene.matchesTile(tile, target) || this.scene.matchesTile(playerTile, target)
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
                            ? (this.scene.saveData.pet.unlocked ? 'Check on Pip' : 'Rescue bell-chime')
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
                          : `${CONTROLS.move.keys}: ${CONTROLS.move.description} • ${CONTROLS.interact.key}: ${CONTROLS.interact.description} • ${CONTROLS.menu.key}: ${CONTROLS.menu.description}`
    this.scene.promptText?.setText(prompt.startsWith('Move') ? prompt : `${prompt}  [Enter]`)
  }

  updateComboHud() {
    if (!this.scene.comboText) return
    if (this.scene.comboCount > 0 && this.scene.time.now - this.scene.lastComboHitAt > 3000) this.scene.comboCount = 0
    if (this.scene.comboCount <= 1) {
      this.scene.comboText.setText('')
      return
    }
    this.scene.comboText.setText(`${this.scene.comboCount}x COMBO`).setColor(this.scene.getComboColor(this.scene.comboCount))
  }

  flashGoldCounter(amount: number) {
    if (!this.scene.inventoryText) return
    const flash = this.scene.add.text(this.scene.inventoryText.x + 42, this.scene.inventoryText.y - 18, `+${amount}`, { color: '#ffd166', fontFamily: 'Arial, sans-serif', fontSize: '14px', fontStyle: 'bold' }).setScrollFactor(0).setDepth(96)
    this.scene.tweens.add({ targets: [this.scene.inventoryText, flash], alpha: 0.45, yoyo: true, duration: 80, repeat: 1, onComplete: () => flash.destroy() })
  }

  spawnPickupDing(x: number, y: number) {
    const ring = this.scene.add.circle(x, y, 8, 0xffffff, 0).setDepth(28).setStrokeStyle(2, 0xfff1a8, 0.82)
    this.scene.tweens.add({ targets: ring, scale: ENTITY_SCALE.object * 4.67, alpha: 0, duration: 360, ease: 'Sine.easeOut', onComplete: () => ring.destroy() })
  }

  showLevelUpEffect() {
    if (!this.scene.player) return
    const flash = this.scene.add.rectangle(this.scene.scale.width / 2, this.scene.scale.height / 2, this.scene.scale.width, this.scene.scale.height, 0xffd166, 0.3).setScrollFactor(0).setDepth(130)
    const title = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 - 24, 'LEVEL UP!', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '42px', fontStyle: 'bold', shadow: { offsetX: 2, offsetY: 3, color: '#000000', blur: 4, fill: true } }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const stats = this.scene.add.text(this.scene.scale.width / 2, this.scene.scale.height / 2 + 24, 'ATK +2   DEF +1   HP +8', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(131)
    const glow = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 28, 0xffd166, 0.22).setDepth(24).setStrokeStyle(4, 0xfff1a8, 0.85)
    audioManager.playSfx('level_up')
    this.scene.triggerSlowMo(200, 0.25)
    this.scene.companions.forEach((companion) => {
      companion.body.setFillStyle(0xffd166, 0.96)
      this.scene.time.delayedCall(420, () => companion.body.setFillStyle(companion.characterId === 'kael' ? 0x5c8a4d : 0x7fb3ff, 0.94))
    })
    this.scene.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() })
    this.scene.tweens.add({ targets: [title, stats], y: '-=36', alpha: 0, duration: 900, ease: 'Sine.easeOut', onComplete: () => { title.destroy(); stats.destroy() } })
    this.scene.tweens.add({ targets: glow, scale: ENTITY_SCALE.object * 3.33, alpha: 0, duration: 850, onComplete: () => glow.destroy() })
  }

  spawnHealPulse(x: number, y: number) {
    const pulse = this.scene.add.circle(x, y, 20, 0x86efac, 0.18).setDepth(25).setStrokeStyle(3, 0xbbf7d0, 0.85)
    this.scene.tweens.add({ targets: pulse, scale: ENTITY_SCALE.object * 3, alpha: 0, duration: 520, ease: 'Sine.easeOut', onComplete: () => pulse.destroy() })
  }

  createBossHud(enemy: MapEnemy) {
    this.scene.bossHud?.container.destroy()
    const container = this.scene.add.container(this.scene.scale.width / 2, 116).setScrollFactor(0).setDepth(125)
    const nameText = this.scene.add.text(0, -20, enemy.nameText.text, { color: '#ffe4b5', fontFamily: 'Georgia, serif', fontSize: '20px', fontStyle: 'bold' }).setOrigin(0.5)
    const bar = this.scene.add.graphics()
    container.add([nameText, bar])
    this.scene.bossHud = { container, bar, nameText }
    this.scene.updateBossHud(enemy)
  }

  updateBossHud(enemy: MapEnemy) {
    if (!this.scene.bossHud || enemy.dead) return
    const width = 420
    const pct = Phaser.Math.Clamp(enemy.currentHp / enemy.maxHp, 0, 1)
    this.scene.bossHud.bar.clear()
    this.scene.bossHud.bar.fillStyle(0x050509, 0.88).fillRoundedRect(-width / 2, 0, width, 16, 6)
    this.scene.bossHud.bar.fillStyle(0x991b1b, 1).fillRoundedRect(-width / 2 + 2, 2, (width - 4) * pct, 12, 5)
    this.scene.bossHud.bar.lineStyle(2, 0xffd166, 0.72).strokeRoundedRect(-width / 2, 0, width, 16, 6)
    this.scene.bossHud.nameText.setText(enemy.nameText.text)
  }

  updateEnemyBars(enemy: MapEnemy) {
    const width = enemy.isBoss ? 34 : 20
    const pct = Phaser.Math.Clamp(enemy.currentHp / enemy.maxHp, 0, 1)
    if (enemy.visualHp > enemy.visualHpTarget) enemy.visualHp = Math.max(enemy.visualHpTarget, enemy.visualHp - (enemy.visualHp - enemy.visualHpTarget) * 0.03)
    else enemy.visualHp = enemy.visualHpTarget
    const trailPct = Phaser.Math.Clamp(enemy.visualHp / enemy.maxHp, 0, 1)
    const color = pct > 0.5 ? 0x4ade80 : pct > 0.25 ? 0xfacc15 : 0xef4444
    enemy.hpBarBg.clear().fillStyle(0x030407, 0.9).fillRoundedRect(enemy.x - width / 2 - 1, enemy.y - 29, width + 2, 5, 2)
    enemy.hpBarBg.fillStyle(0x991b1b, 0.78).fillRoundedRect(enemy.x - width / 2, enemy.y - 28, width * trailPct, 3, 1)
    enemy.hpBar.clear().fillStyle(color, 1).fillRoundedRect(enemy.x - width / 2, enemy.y - 28, width * pct, 3, 1)
    enemy.nameText.setPosition(enemy.x, enemy.y - 39)
    if (enemy.isBoss) this.scene.updateBossHud(enemy)
  }

  showBossVictoryScreen(enemy: MapEnemy) {
    this.scene.busy = true
    const { width, height } = this.scene.scale
    const overlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(250).setAlpha(0)
    overlay.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x1a1408, 0.68))
    overlay.add(this.scene.add.ellipse(width / 2, height / 2, width * 1.1, height * 0.8, 0x000000, 0.15).setStrokeStyle(48, 0xd4a84b, 0.42))
    overlay.add(this.scene.add.text(width / 2, height / 2 - 52, 'VICTORY', { color: '#ffd36e', fontFamily: 'Georgia, serif', fontSize: '48px', fontStyle: 'bold' }).setOrigin(0.5))
    const rewardLine = `+${enemy.goldReward}g  •  +${enemy.expReward} EXP`
    overlay.add(this.scene.add.text(width / 2, height / 2 + 8, rewardLine, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px' }).setOrigin(0.5))
    const playTimeStr = this.scene.formatPlayTime(this.scene.saveData.playTime)
    overlay.add(this.scene.add.text(width / 2, height / 2 + 38, `Play Time: ${playTimeStr}`, { color: '#8ab4f8', fontFamily: 'Arial, sans-serif', fontSize: '15px' }).setOrigin(0.5))
    const continueBtn = this.scene.add.text(width / 2, height / 2 + 86, 'Continue', { color: '#86efac', fontFamily: 'Arial, sans-serif', fontSize: '20px' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    continueBtn.on('pointerover', () => { continueBtn.setColor('#fff1a8'); audioManager.playSfx('ui_blip') })
    continueBtn.on('pointerout', () => continueBtn.setColor('#86efac'))
    continueBtn.on('pointerdown', () => {
      audioManager.playSfx('ui_confirm')
      this.scene.tweens.add({ targets: overlay, alpha: 0, duration: 320, onComplete: () => { overlay.destroy(); this.scene.busy = false; this.scene.cameras.main.zoomTo(1, 400, 'Sine.easeInOut', true) } })
    })
    overlay.add(continueBtn)
    this.scene.tweens.add({ targets: overlay, alpha: 1, duration: 420, ease: 'Sine.easeOut' })
  }

  handlePlayerDefeat() {
    this.scene.busy = true
    const hero = this.scene.saveData.party[0]
    const restoredHp = Math.max(1, Math.floor(this.scene.getPlayerCombatStats().hp * 0.5))
    hero.currentHp = restoredHp
    const { width, height } = this.scene.scale
    const overlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(240).setAlpha(0)
    overlay.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x2a0508, 0.62))
    overlay.add(this.scene.add.ellipse(width / 2, height / 2, width * 1.15, height * 0.82, 0x000000, 0.18).setStrokeStyle(56, 0x7f1d1d, 0.48))
    overlay.add(this.scene.add.text(width / 2, height / 2 - 22, 'DEFEATED', { color: '#ffb4b4', fontFamily: 'Georgia, serif', fontSize: '42px', fontStyle: 'bold' }).setOrigin(0.5))
    overlay.add(this.scene.add.text(width / 2, height / 2 + 28, 'Reviving at skywell...', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px' }).setOrigin(0.5))
    this.scene.tweens.add({ targets: overlay, alpha: 1, duration: 420, ease: 'Sine.easeOut' })
    this.scene.time.delayedCall(2000, () => {
      if (this.scene.player) {
        this.scene.player.setPosition(this.scene.tileCenter(SAVE_TILE.x), this.scene.tileCenter(SAVE_TILE.y))
        this.scene.companions.forEach((companion) => {
          companion.x = this.scene.player!.x + companion.offsetX
          companion.y = this.scene.player!.y + companion.offsetY
          companion.container.setPosition(companion.x, companion.y)
          this.scene.updateCompanionBars(companion)
        })
        this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 34, `HP restored to ${restoredHp}`, '#86efac')
        this.scene.tweens.add({ targets: this.scene.player, alpha: 0.25, yoyo: true, repeat: 5, duration: 120 })
      }
      this.scene.tweens.add({ targets: overlay, alpha: 0, duration: 520, onComplete: () => overlay.destroy() })
      this.scene.time.delayedCall(560, () => { this.scene.busy = false })
      this.scene.refreshHud(); this.scene.updatePlayerBars(); this.scene.persist()
    })
  }

  showFloatingText(x: number, y: number, text: string, color: string) {
    const label = this.scene.add.text(x, y, text, { color, fontFamily: 'Arial, sans-serif', fontSize: '15px', fontStyle: 'bold', stroke: '#050509', strokeThickness: 3, shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 2, fill: true } }).setOrigin(0.5).setDepth(80)
    this.scene.tweens.add({ targets: label, y: y - 34, alpha: 0, duration: 1000, onComplete: () => label.destroy() })
  }

  showDamageNumber(x: number, y: number, amount: number, kind: 'player' | 'enemy' | 'heal', critical = false, weak = false, resisted = false) {
    const offsetX = Phaser.Math.Between(-10, 10)
    const color = resisted ? '#74788f' : kind === 'heal' ? '#86efac' : kind === 'enemy' ? '#ff5f5f' : critical ? '#ffd36e' : '#ffffff'
    const text = kind === 'heal' ? `+${amount}` : `${amount}`
    const label = this.scene.acquireDamageNumber()
    label.setPosition(x + offsetX, y).setText(text).setColor(color).setFontSize(critical ? 20 : resisted ? 10 : 13).setStroke('#050509', critical ? 4 : 3).setAlpha(1).setScale(1).setVisible(true).setActive(true)
    if (critical) { this.scene.tweens.add({ targets: label, x: label.x + 2, yoyo: true, repeat: 3, duration: 28 }); this.scene.cameras.main.shake(60, 0.004) }
    if (weak) {
      const weakLabel = this.scene.add.text(label.x, y + 13, 'WEAK', { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '9px', fontStyle: 'bold', stroke: '#050509', strokeThickness: 2 }).setOrigin(0.5).setDepth(82)
      this.scene.tweens.add({ targets: weakLabel, y: y - 17, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => weakLabel.destroy() })
    }
    this.scene.tweens.add({ targets: label, y: y - 30, alpha: 0, duration: 800, ease: 'Quad.easeOut', onComplete: () => this.scene.releaseDamageNumber(label) })
  }

  acquireDamageNumber() {
    let label = this.scene.damageNumberPool.find((entry) => !entry.active)
    if (!label && this.scene.damageNumberPool.length < 20) {
      label = this.scene.add.text(0, 0, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold', stroke: '#050509', strokeThickness: 3, shadow: { offsetX: 1, offsetY: 2, color: '#000000', blur: 2, fill: true } }).setOrigin(0.5).setDepth(82).setActive(false).setVisible(false)
      this.scene.damageNumberPool.push(label)
    }
    return label ?? this.scene.damageNumberPool[0]
  }

  releaseDamageNumber(label: Phaser.GameObjects.Text) {
    label.setActive(false).setVisible(false).setAlpha(0)
  }

  spawnWhooshDust(x: number, y: number, angle: number) {
    audioManager.playSfx('scene_whoosh')
    for (let i = 0; i < 4; i += 1) {
      const dust = this.scene.add.circle(x + Phaser.Math.Between(-5, 5), y + Phaser.Math.Between(-5, 5), Phaser.Math.Between(2, 4), 0x9ca3af, 0.45).setDepth(23)
      this.scene.tweens.add({ targets: dust, x: dust.x + Math.cos(angle) * Phaser.Math.Between(10, 18), y: dust.y + Math.sin(angle) * Phaser.Math.Between(10, 18), alpha: 0, duration: 260, onComplete: () => dust.destroy() })
    }
  }

  spawnHitParticles(enemy: MapEnemy) {
    const color = enemy.element.includes('frost') || enemy.enemyId.includes('moon') ? 0x9ff3ff : enemy.element.includes('ember') || enemy.enemyId.includes('ember') ? 0xff7a3d : this.scene.getEnemyColor(enemy)
    for (let i = 0; i < 5; i += 1) {
      const particle = this.scene.add.circle(enemy.x + Phaser.Math.Between(-8, 8), enemy.y + Phaser.Math.Between(-10, 8), Phaser.Math.Between(2, 4), color, 0.78).setDepth(29)
      this.scene.tweens.add({ targets: particle, x: particle.x + Phaser.Math.Between(-18, 18), y: particle.y + Phaser.Math.Between(-18, 10), alpha: 0, duration: 320, onComplete: () => particle.destroy() })
    }
  }

  updatePlayerBars() {
    if (!this.scene.player || !this.scene.playerHpBarBg || !this.scene.playerHpBar || !this.scene.playerMpBar || !this.scene.playerHpText || !this.scene.playerMpText) return
    const stats = this.scene.getPlayerCombatStats()
    const hero = this.scene.saveData.party[0]
    const width = 48
    const hpPct = Phaser.Math.Clamp(hero.currentHp / stats.hp, 0, 1)
    this.scene.visualHpTarget = hero.currentHp
    if (this.scene.visualHp <= 0 || this.scene.visualHp > stats.hp) this.scene.visualHp = stats.hp
    if (this.scene.visualHp > this.scene.visualHpTarget) this.scene.visualHp = Math.max(this.scene.visualHpTarget, this.scene.visualHp - (this.scene.visualHp - this.scene.visualHpTarget) * 0.03)
    else this.scene.visualHp = this.scene.visualHpTarget
    const trailPct = Phaser.Math.Clamp(this.scene.visualHp / stats.hp, 0, 1)
    const mpPct = Phaser.Math.Clamp(hero.currentMp / stats.mp, 0, 1)
    const x = this.scene.player.x - width / 2
    const hpY = this.scene.player.y + 25
    const mpY = this.scene.player.y + 31
    this.scene.playerHpBarBg.clear().fillStyle(0x050509, 0.82).fillRoundedRect(x - 1, hpY - 1, width + 2, 6, 2)
    this.scene.playerHpBarBg.fillStyle(0x991b1b, 0.78).fillRoundedRect(x, hpY, width * trailPct, 4, 2)
    this.scene.playerHpBar.clear()
    const hpColor = hpPct < 0.3 ? 0xff3b3b : 0x5cff8a
    this.scene.playerHpBar.fillGradientStyle(hpColor, hpColor, hpPct < 0.3 ? 0x991b1b : 0x15803d, hpPct < 0.3 ? 0x991b1b : 0x15803d, 1).fillRoundedRect(x, hpY, width * hpPct, 4, 2)
    this.scene.playerHpBar.fillStyle(0xffffff, 0.55).fillRect(x + 1, hpY, Math.max(0, width * hpPct - 2), 1)
    this.scene.playerMpBar.clear().fillStyle(0x050509, 0.82).fillRoundedRect(x - 1, mpY - 1, width + 2, 5, 2)
    this.scene.playerMpBar.fillGradientStyle(0x7dd3fc, 0x7dd3fc, 0x2563eb, 0x2563eb, 1).fillRoundedRect(x, mpY, width * mpPct, 3, 1)
    this.scene.playerMpBar.fillStyle(0xffffff, 0.45).fillRect(x + 1, mpY, Math.max(0, width * mpPct - 2), 1)
    this.scene.playerHpText.setText(`${hero.currentHp}/${stats.hp}`).setPosition(this.scene.player.x, this.scene.player.y + 40)
    this.scene.playerMpText.setText(`${hero.currentMp}/${stats.mp}`).setPosition(this.scene.player.x, this.scene.player.y + 50)
    if (hpPct < 0.3 && !this.scene.tweens.isTweening(this.scene.playerHpText)) this.scene.tweens.add({ targets: [this.scene.playerHpBar, this.scene.playerHpText], alpha: 0.35, yoyo: true, duration: 120, repeat: 1 })
  }

  getInventoryCounts(): InventoryCounts {
    return {
      potion: this.scene.saveData.inventory.find((item) => item.itemId === 'health_potion')?.quantity ?? 0,
      ether: this.scene.saveData.inventory.find((item) => item.itemId === 'mana_potion')?.quantity ?? 0,
      emberShard: this.scene.saveData.inventory.find((item) => item.itemId === 'ember_shard')?.quantity ?? 0,
    }
  }

  refreshHud() {
    const counts = this.scene.getInventoryCounts()
    const hero = this.scene.saveData.party[0]
    this.scene.objectiveText?.setText(`▶ ${this.scene.saveData.currentObjective}`)
    this.scene.inventoryText?.setText(`Potion ${counts.potion}  Ether ${counts.ether}  Ember Shard ${counts.emberShard}  |  Home ${this.scene.homeProgress()}/3${this.scene.saveData.pet.unlocked ? '  Pip' : ''}`)
    this.scene.levelText?.setText(`Lv.${hero.level}`)
    this.scene.updateTopLeftHud()
    this.scene.updateXpBar()
    this.scene.killCounterText?.setText(`Kills: ${this.scene.killCount}`)
    this.scene.updateSkillHud()
  }

  updateXpBar() {
    if (!this.scene.playerXpBar) return
    const xpForLevel = 180
    const progress = (this.scene.saveData.battleRewards.exp % xpForLevel) / xpForLevel
    this.scene.playerXpBar.clear().fillStyle(0x111827, 0.9).fillRoundedRect(54, 73, 186, 5, 2).fillStyle(0xa855f7, 0.95).fillRoundedRect(54, 73, 186 * progress, 5, 2)
  }

  updateTopLeftHud() {
    if (!this.scene.hudPanel) return
    const hudPanel = this.scene.hudPanel
    const hero = this.scene.saveData.party[0]
    const stats = this.scene.getPlayerCombatStats()
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
    hudPanel.goldText.setText(`🪙 ${this.scene.saveData.gold}g`)
    this.scene.saveData.party.slice(1, 3).forEach((member, index) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const companionStats = this.scene.scaleCharacterStats(character, member.level)
      const pct = Phaser.Math.Clamp(member.currentHp / companionStats.hp, 0, 1)
      const y = index === 0 ? 111 : 139
      const inCombat = this.scene.mapEnemies.some((enemy) => !enemy.dead && this.scene.player && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y) < enemy.aggroRange)
      graphics.fillStyle(0x111827, 0.95).fillRoundedRect(50, y + 4, 92, 5, 2).fillStyle(0x22c55e, 0.96).fillRoundedRect(50, y + 4, 92 * pct, 5, 2)
      hudPanel.companionTexts[index]?.setText(character.name)
      hudPanel.swordTexts[index]?.setVisible(inCombat)
      const portrait = hudPanel.portraits[index]
      if (portrait && pct < 0.3 && !this.scene.tweens.isTweening(portrait)) this.scene.tweens.add({ targets: portrait, fillColor: 0xef4444, alpha: 0.45, yoyo: true, duration: 180, repeat: 1 })
    })
  }

  flashObjectiveBanner() {
    if (!this.scene.objectivePanel || !this.scene.objectiveText) return
    this.scene.objectivePanel.setAlpha(1).setScale(ENTITY_SCALE.object * 1.72)
    this.scene.objectiveText.setAlpha(1).setScale(ENTITY_SCALE.object * 1.72)
    this.scene.tweens.add({ targets: [this.scene.objectivePanel, this.scene.objectiveText], scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 220, ease: 'Back.easeOut' })
    this.scene.tweens.add({ targets: this.scene.objectivePanel, alpha: 0.72, delay: 260, duration: 360 })
  }
}
