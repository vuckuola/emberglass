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

const NPCMANAGER_METHODS = [
  "createObjects",
  "drawChest",
  "drawTreasureChest",
  "drawNpc",
  "createProceduralNpc",
  "getNpcActorKey",
  "applyNpcIdleBehavior",
  "drawHomeUpgradeVisuals",
  "refreshHomeUpgradeVisuals",
  "drawMarker",
  "checkSavePoint",
  "checkHomeBenefits",
  "checkPetForage",
  "notifyWorkshopBuff",
  "interact",
  "openChest",
  "rollChestReward",
  "animateChestOpen",
  "talkGuide",
  "talkElder",
  "inspectMarker",
  "applyBattleResult",
  "getBattleResultTitle",
  "getBattleResultSubtitle",
  "ringTideBell",
  "inspectMural",
  "lightWatchLantern",
  "recruitMira",
  "rescuePet",
  "restoreHome",
  "enterArchive",
  "inspectShrineGate",
  "attuneShrineFont",
  "startShrineGuardianBattle",
  "startArchiveSkirmish",
  "startMidBossBattle",
  "startFinalBossBattle",
  "openShop",
  "createDefaultSaveData",
  "createNewGamePlusSaveData",
  "getNgPlusHpMultiplier",
  "getNgPlusDamageMultiplier",
  "getNgPlusGoldMultiplier",
  "shouldRunFirstCombatTutorial",
  "persist",
  "saveCurrentPosition",
  "setObjective",
  "setFlag",
  "flag",
  "addEvent",
  "hasInventoryItem",
  "autoEquipCharm",
  "addInventory",
  "restorePartyMissingPercent",
  "scaleCharacterStats",
  "rollGardenItem",
  "rollPetForageItem",
  "getItemName",
  "homeProgress",
  "getHomeName"
] as const

export class NPCManager {
  private scene: SceneAccess

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
  }

  install(): void {
    for (const method of NPCMANAGER_METHODS) {
      this.scene[method] = (this as unknown as Record<string, (...args: any[]) => any>)[method].bind(this)
    }
  }

  createObjects() {
    const saveX = this.scene.tileCenter(SAVE_TILE.x)
    const saveY = this.scene.tileCenter(SAVE_TILE.y)
    this.scene.add.ellipse(saveX, saveY + 13, 34, 12, 0x101014, 0.25).setDepth(2.8)
    const saveBase = this.scene.add.rectangle(saveX, saveY + 7, 24, 18, 0x5e7ea6, 0.95).setDepth(3)
    saveBase.setStrokeStyle(2, 0xd7f6ff, 0.55)
    const saveGlow = this.scene.add.polygon(saveX, saveY - 10, [0, -12, 10, 0, 0, 12, -10, 0], 0x75e7ff, 0.86).setDepth(4)
    this.scene.tweens.add({ targets: saveGlow, y: saveGlow.y - 2, alpha: 0.62, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })

    this.scene.drawChest()
    this.scene.drawNpc(GUIDE_TILE, GENERATED_ASSETS.npcs.guideRin, 'Guide Rin')
    this.scene.drawNpc(ELDER_TILE, GENERATED_ASSETS.npcs.elderMaelin, 'Elder')
    this.scene.drawNpc(MERCHANT_TILE, GENERATED_ASSETS.npcs.peddler, 'Peddler')
    this.scene.drawMarker(MARKER_TILE, GENERATED_ASSETS.objects.ruinMarker, 'Ruin Marker')
    this.scene.drawMarker(SIGNPOST_TILE, GENERATED_ASSETS.objects.signpost, 'Route Sign')
    this.scene.drawMarker(TIDE_BELL_TILE, GENERATED_ASSETS.objects.tideBell, 'Tide Bell')
    this.scene.drawMarker(MURAL_TILE, GENERATED_ASSETS.objects.mural, 'Glass Mural')
    this.scene.drawMarker(WATCH_LANTERN_TILE, GENERATED_ASSETS.objects.watchLantern, 'Watch Lantern')
    this.scene.drawMarker(HOME_TILE, GENERATED_ASSETS.objects.signpost, this.scene.getHomeName())
    this.scene.drawHomeUpgradeVisuals()
    this.scene.drawNpc(ALLY_TILE, GENERATED_ASSETS.npcs.guideRin, this.scene.flag('mira_recruited') ? 'Mira' : 'Bridge Scout')
    this.scene.drawMarker(PET_TILE, GENERATED_ASSETS.objects.tideBell, this.scene.saveData.pet.unlocked ? 'Pip' : 'Bell Thicket')
    this.scene.drawMarker(ARCHIVE_TILE, GENERATED_ASSETS.objects.ruinMarker, 'Verdant Archive')
    this.scene.drawMarker(MID_BOSS_TILE, GENERATED_ASSETS.objects.guardianField, this.scene.flag('thornheart_won') ? 'Root-Cleared Path' : 'Thornheart Roots')
    this.scene.drawMarker(FINAL_BOSS_TILE, GENERATED_ASSETS.objects.innerSeal, this.scene.flag('final_boss_won') ? 'Quiet Skywell' : 'Skywell Rift')
    this.scene.drawMarker(SHRINE_GATE_TILE, GENERATED_ASSETS.objects.shrineGate, 'Shrine Gate')
    if (this.scene.flag('shrine_gate_seen')) {
      this.scene.drawMarker(SHRINE_FONT_TILE, GENERATED_ASSETS.objects.pilgrimFont, 'Pilgrim Font')
      this.scene.drawMarker(SHRINE_SEAL_TILE, GENERATED_ASSETS.objects.innerSeal, this.scene.flag('shrine_guardian_won') ? 'Awakened Seal' : 'Inner Seal')
    }
  }

  drawChest() {
    TREASURE_CHESTS.forEach((chest) => this.scene.drawTreasureChest(chest.id, chest.x, chest.y))
  }

  drawTreasureChest(id: string, tileX: number, tileY: number) {
    const x = this.scene.tileCenter(tileX)
    const y = this.scene.tileCenter(tileY)
    const opened = this.scene.saveData.openedChests.includes(id) || this.scene.flag(`chest_${id}`)
    this.scene.add.ellipse(x, y + 14, 34, 12, 0x101014, 0.28).setDepth(3.5)
    const base = this.scene.add.rectangle(x, y + 5, 34, 18, opened ? 0x49351e : 0x8a5a21, opened ? 0.62 : 0.95).setStrokeStyle(2, 0xf0c040, 0.82).setDepth(4)
    const lid = this.scene.add.rectangle(x, y - 8, 34, 12, opened ? 0x3e2c19 : 0x7a451a, opened ? 0.5 : 0.95).setStrokeStyle(2, 0xffd166, 0.86).setDepth(4.1)
    const trim = this.scene.add.rectangle(x, y + 2, 5, 26, 0xf0c040, opened ? 0.45 : 0.9).setDepth(4.2)
    this.scene.add.rectangle(x - 11, y - 8, 5, 5, 0xffe08a, opened ? 0.35 : 0.76).setDepth(4.3)
    this.scene.add.rectangle(x + 11, y - 8, 5, 5, 0xffe08a, opened ? 0.35 : 0.76).setDepth(4.3)
    if (opened) lid.y -= 7
    this.scene.treasureChests.push({ id, tile: { x: tileX, y: tileY }, base, lid, trim, opened })
  }

  drawNpc(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.scene.tileCenter(tile.x)
    const y = this.scene.tileCenter(tile.y)
    this.scene.add.ellipse(x, y + 18, 34, 13, 0x101014, 0.32).setDepth(3.5)
    const npc = hasTexture(this.scene, assetKey)
      ? this.scene.add.sprite(x, y, assetKey, 0).setScale(ENTITY_SCALE.npc).setDepth(4)
      : this.scene.createProceduralNpc(x, y, label)
    if (npc instanceof Phaser.GameObjects.Sprite) npc.play(`idle-${assetKey}`)
    const actorKey = this.scene.getNpcActorKey(label)
    if (actorKey) {
      this.scene.npcActors[actorKey] = npc
    }
    this.scene.applyNpcIdleBehavior(npc, label, tile)
  }

  createProceduralNpc(x: number, y: number, label: string): Phaser.GameObjects.Container {
    const container = this.scene.add.container(x, y).setDepth(4)
    const isElder = label === 'Elder'
    const isPeddler = label === 'Peddler'
    const proceduralScale = ENTITY_SCALE.npc / 0.55
    const outfit = isElder ? 0xd8d5ca : isPeddler ? 0x6e4728 : 0x2e8f8a
    const trim = isElder ? 0xf5f1df : isPeddler ? 0x9c6b3d : 0x75d7c8
    const hair = isElder ? 0xd9d9d9 : isPeddler ? 0x3a2518 : 0x6b3b22
    container.add(this.scene.add.ellipse(0, -17, 15, 16, 0xd9a06f, 1).setStrokeStyle(1, 0x2a1a12, 0.35))
    container.add(this.scene.add.arc(0, -22, 8, 190, 350, false, hair, 1))
    container.add(this.scene.add.rectangle(0, 2, isElder ? 26 : 22, isElder ? 34 : 30, outfit, 0.98).setStrokeStyle(2, trim, 0.62))
    container.add(this.scene.add.rectangle(-7, 18, 5, 12, 0x2c221b, 0.9))
    container.add(this.scene.add.rectangle(7, 18, 5, 12, 0x2c221b, 0.9))
    if (isElder) {
      container.add(this.scene.add.rectangle(16, 1, 3, 42, 0x7b5634, 0.95))
      container.add(this.scene.add.circle(16, -22, 4, 0x9ff3ff, 0.75))
    } else if (isPeddler) {
      container.add(this.scene.add.rectangle(13, 1, 9, 22, 0x4a321d, 0.92).setStrokeStyle(1, 0xd2a05d, 0.5))
      container.add(this.scene.add.rectangle(-12, 0, 5, 18, 0x4a321d, 0.9))
    } else {
      container.add(this.scene.add.rectangle(-11, 1, 5, 20, 0x1d5f5e, 0.9))
      container.add(this.scene.add.rectangle(11, 1, 5, 20, 0x1d5f5e, 0.9))
    }
    return container.setScale(proceduralScale)
  }

  getNpcActorKey(label: string): 'guide' | 'elder' | 'peddler' | 'mira' | null {
    if (label === 'Guide Rin') return 'guide'
    if (label === 'Elder') return 'elder'
    if (label === 'Peddler') return 'peddler'
    if (label === 'Mira') return 'mira'
    return null
  }

  applyNpcIdleBehavior(npc: Phaser.GameObjects.GameObject, label: string, tile: { x: number; y: number }) {
    if (label === 'Guide Rin') {
      this.scene.tweens.add({ targets: npc, x: this.scene.tileCenter(tile.x + 2), yoyo: true, repeat: -1, duration: 2600, hold: 900, ease: 'Sine.easeInOut' })
    } else if (label === 'Peddler') {
      this.scene.tweens.add({ targets: npc, angle: 3, y: '-=2', yoyo: true, repeat: -1, duration: 880, ease: 'Sine.easeInOut' })
    } else if (label === 'Elder') {
      this.scene.tweens.add({ targets: npc, angle: -2, x: '-=3', yoyo: true, repeat: -1, duration: 1800, hold: 5200, repeatDelay: 4200, ease: 'Sine.easeInOut' })
    } else {
      this.scene.tweens.add({ targets: npc, y: '-=1.5', yoyo: true, repeat: -1, duration: 1600 + tile.x * 35, ease: 'Sine.easeInOut' })
    }
  }

  drawHomeUpgradeVisuals() {
    const x = this.scene.tileCenter(HOME_TILE.x)
    const y = this.scene.tileCenter(HOME_TILE.y)
    const home = this.scene.saveData.home
    const progress = this.scene.homeProgress()
    if (home.warmth > 0) {
      this.scene.homeVisuals.push(this.scene.add.ellipse(x, y + 18, 62, 28, 0xff8a32, 0.28).setDepth(2.75).setName('home:warmth-glow'))
      this.scene.homeVisuals.push(this.scene.add.rectangle(HOME_TILE.x * TILE_SIZE, HOME_TILE.y * TILE_SIZE, TILE_SIZE, TILE_SIZE, 0xffb347, 0.16).setOrigin(0).setDepth(0.42).setName('home:warmth-tint'))
    }
    if (home.garden > 0) {
      for (const offset of [{ x: -22, y: 10 }, { x: -14, y: 22 }, { x: 18, y: 18 }, { x: 26, y: 4 }, { x: 3, y: 26 }]) {
        this.scene.homeVisuals.push(this.scene.add.circle(x + offset.x, y + offset.y, 3, 0x72d66b, 0.92).setDepth(3.2).setName('home:garden-herb'))
      }
    }
    if (home.workshop > 0) {
      const lens = this.scene.add.polygon(x, y - 30, [0, -10, 11, 0, 0, 10, -11, 0], 0xffd36e, 0.92).setDepth(4.2).setName('home:workshop-lens')
      this.scene.homeVisuals.push(lens)
      this.scene.tweens.add({ targets: lens, angle: 10, alpha: 0.68, yoyo: true, repeat: -1, duration: 1250, ease: 'Sine.easeInOut' })
    }
    const label = this.scene.add.text(x, y - 47, `Home ${progress}/3`, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '11px', backgroundColor: '#070914bb', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(4.5).setName('home:progress-label')
    this.scene.homeVisuals.push(label)
  }

  refreshHomeUpgradeVisuals() {
    this.scene.homeVisuals.forEach((visual) => visual.destroy())
    this.scene.homeVisuals = []
    this.scene.drawHomeUpgradeVisuals()
  }

  drawMarker(tile: { x: number; y: number }, assetKey: string, label: string) {
    const x = this.scene.tileCenter(tile.x)
    const y = this.scene.tileCenter(tile.y)
    void label
    this.scene.add.ellipse(x, y + 16, 34, 12, 0x101014, 0.28).setDepth(2.5)
    const marker = hasTexture(this.scene, assetKey)
      ? this.scene.add.image(x, y, assetKey).setScale(ENTITY_SCALE.object).setDepth(3)
      : this.scene.add.rectangle(x, y, 34, 34, 0x888888, 0.86).setStrokeStyle(2, 0xffffff, 0.35).setDepth(3)
    this.scene.tweens.add({ targets: marker, scale: hasTexture(this.scene, assetKey) ? ENTITY_SCALE.object * 1.05 : ENTITY_SCALE.object * 1.73, yoyo: true, repeat: -1, duration: 1350, ease: 'Sine.easeInOut' })
  }

  checkSavePoint() {
    if (!this.scene.player) {
      return
    }
    const tile = this.scene.worldToTile(this.scene.player.x, this.scene.player.y)
    if (tile.x === SAVE_TILE.x && tile.y === SAVE_TILE.y && !this.scene.saveNoticeShown) {
      this.scene.saveNoticeShown = true
      this.scene.restorePartyMissingPercent(0.5, 0.3)
      this.scene.persist()
      audioManager.playSfx('save_point')
      this.scene.cameras.main.flash(180, 159, 243, 255, false)
      let revivedCompanions = 0
      this.scene.companions.forEach((companion) => {
        const member = this.scene.saveData.party[companion.partyIndex]
        const character = member ? CHARACTERS[member.characterId] : undefined
        if (!member || !character || companion.state !== 'dead') return
        const stats = this.scene.scaleCharacterStats(character, member.level)
        member.currentHp = Math.max(1, Math.floor(stats.hp * 0.5))
        companion.state = 'follow'
        companion.container.setAlpha(1)
        revivedCompanions += 1
      })
      if (revivedCompanions > 0) {
        this.scene.persist()
        this.scene.showToast('The save crystal revives fallen companions.')
      }
      this.scene.showToast('The save crystal hums. Strength returns.')
    }
  }

  checkHomeBenefits() {
    if (!this.scene.player) {
      return
    }

    const tile = this.scene.worldToTile(this.scene.player.x, this.scene.player.y)
    const distanceFromHome = Phaser.Math.Distance.Between(tile.x, tile.y, HOME_TILE.x, HOME_TILE.y)
    if (distanceFromHome > 3) {
      this.scene.homeWarmthUsedThisVisit = false
      this.scene.homeGardenUsedThisVisit = false
      return
    }

    if (tile.x !== HOME_TILE.x || tile.y !== HOME_TILE.y) {
      return
    }

    if (this.scene.saveData.home.warmth === 1 && !this.scene.homeWarmthUsedThisVisit) {
      this.scene.homeWarmthUsedThisVisit = true
      this.scene.restorePartyMissingPercent(0.3, 0.2)
      audioManager.playSfx('save_point')
      this.scene.showToast('The hearth embraces you. HP and MP partially restored.')
      this.scene.persist()
    }

    if (this.scene.saveData.home.garden === 1 && !this.scene.homeGardenUsedThisVisit) {
      this.scene.homeGardenUsedThisVisit = true
      const itemId = this.scene.rollGardenItem()
      if (itemId) {
        this.scene.addInventory(itemId, 1)
        audioManager.playSfx('reward_gain')
        this.scene.showToast(`The garden yields a ${this.scene.getItemName(itemId)}.`)
        this.scene.persist()
      }
    }
  }

  checkPetForage() {
    if (!this.scene.saveData.pet.unlocked || !this.scene.saveData.pet.forageReady || this.scene.time.now - this.scene.lastForageTime < 45000) {
      return
    }

    const itemId = this.scene.rollPetForageItem()
    this.scene.lastForageTime = this.scene.time.now
    this.scene.saveData.pet.forageReady = false
    this.scene.addInventory(itemId, 1)
    audioManager.playSfx('reward_gain')
    this.scene.showToast(`Pip returns with a ${this.scene.getItemName(itemId)}!`)
    this.scene.persist()
    this.scene.time.delayedCall(60000, () => {
      if (!this.scene.saveData?.pet.unlocked) {
        return
      }
      this.scene.saveData.pet.forageReady = true
      this.scene.persist()
    })
  }

  notifyWorkshopBuff() {
    if (this.scene.saveData.home.workshop !== 1 || this.scene.flag('workshopBuffNotified')) {
      return
    }

    this.scene.setFlag('workshopBuffNotified')
    this.scene.time.delayedCall(900, () => this.scene.showToast('The workshop hums with purpose. All allies gain ATK +2, DEF +1.'))
    this.scene.persist()
  }

  interact(): boolean {
    audioManager.playSfx('field_interact')
    this.scene.learnedInteract = true
    this.scene.updatePromptLearning()
    const tile = this.scene.getInteractionTile()
    const playerTile = this.scene.player ? this.scene.worldToTile(this.scene.player.x, this.scene.player.y) : null
    const isAt = (target: { x: number; y: number }) => this.scene.matchesTile(tile, target) || this.scene.matchesTile(playerTile, target)

    const chest = TREASURE_CHESTS.find((entry) => isAt(entry))
    if (chest) {
      this.scene.openChest(chest.id)
    } else if (isAt(GUIDE_TILE)) {
      this.scene.talkGuide()
    } else if (isAt(ELDER_TILE)) {
      this.scene.talkElder()
    } else if (isAt(MERCHANT_TILE)) {
      this.scene.openShop()
    } else if (isAt(MARKER_TILE)) {
      this.scene.inspectMarker()
    } else if (isAt(SIGNPOST_TILE)) {
      this.scene.showSignpostGuide()
      this.scene.addEvent('read_signpost')
    } else if (isAt(TIDE_BELL_TILE)) {
      this.scene.ringTideBell()
    } else if (isAt(MURAL_TILE)) {
      this.scene.inspectMural()
    } else if (isAt(WATCH_LANTERN_TILE)) {
      this.scene.lightWatchLantern()
    } else if (isAt(HOME_TILE)) {
      this.scene.restoreHome()
    } else if (isAt(ALLY_TILE)) {
      this.scene.recruitMira()
    } else if (isAt(PET_TILE)) {
      this.scene.rescuePet()
    } else if (isAt(ARCHIVE_TILE)) {
      this.scene.enterArchive()
    } else if (isAt(MID_BOSS_TILE)) {
      this.scene.startMidBossBattle()
    } else if (isAt(FINAL_BOSS_TILE)) {
      this.scene.startFinalBossBattle()
    } else if (isAt(SHRINE_GATE_TILE)) {
      this.scene.inspectShrineGate()
    } else if (isAt(SHRINE_FONT_TILE)) {
      this.scene.attuneShrineFont()
    } else if (isAt(SHRINE_SEAL_TILE)) {
      this.scene.startShrineGuardianBattle()
    } else {
      audioManager.playSfx('ui_cancel')
      this.scene.showToast('Nothing responds here. Check the objective or face an object and press E.')
      return false
    }
    return true
  }

  openChest(chestId = CHEST_ID) {
    if (this.scene.saveData.openedChests.includes(chestId) || this.scene.flag(`chest_${chestId}`)) {
      audioManager.playSfx('ui_cancel')
      this.scene.showToast('The treasure chest is empty.')
      return
    }
    const chest = this.scene.treasureChests.find((entry) => entry.id === chestId)
    if (chest) this.scene.tweens.add({ targets: [chest.base, chest.lid, chest.trim], x: '+=3', yoyo: true, repeat: 3, duration: 35 })
    this.scene.time.delayedCall(200, () => {
      this.scene.saveData.openedChests.push(chestId)
      this.scene.setFlag(`chest_${chestId}`)
      const reward = this.scene.rollChestReward(chestId)
      if (reward.gold > 0) this.scene.saveData.gold += reward.gold
      reward.items.forEach((item) => this.scene.addInventory(item.itemId, item.quantity))
      if (reward.equipCharm) this.scene.saveData.party[0].equipment.charm = reward.equipCharm
      audioManager.playSfx('chest_open')
      this.scene.animateChestOpen(chestId)
      this.scene.time.delayedCall(230, () => audioManager.playSfx('equipment_gain'))
      this.scene.showToast(`Treasure chest: ${reward.label}`)
      this.scene.persist()
      if (this.scene.objectiveText && this.scene.inventoryText) this.scene.refreshHud()
    })
  }

  rollChestReward(chestId: string): { gold: number; items: Array<{ itemId: string; quantity: number }>; equipCharm?: string; label: string } {
    if (chestId === CHEST_ID) return { gold: 0, items: [{ itemId: 'health_potion', quantity: 2 }, { itemId: 'mana_potion', quantity: 1 }, { itemId: 'wind_charm', quantity: 1 }], equipCharm: 'wind_charm', label: 'Potion x2, Ether x1, Wind Charm equipped' }
    const rolls = [
      { gold: 90, items: [] as Array<{ itemId: string; quantity: number }>, label: '90 gold' },
      { gold: 0, items: [{ itemId: 'health_potion', quantity: 2 }], label: 'Potion x2' },
      { gold: 0, items: [{ itemId: 'mana_potion', quantity: 1 }], label: 'Ether x1' },
      { gold: 30, items: [{ itemId: 'wind_charm', quantity: 1 }], equipCharm: 'wind_charm', label: '30 gold and Wind Charm' },
    ]
    return rolls[Phaser.Math.Between(0, rolls.length - 1)]
  }

  animateChestOpen(chestId: string) {
    const chest = this.scene.treasureChests.find((entry) => entry.id === chestId)
    if (!chest) return
    chest.opened = true
    chest.base.setFillStyle(0x49351e, 0.62)
    chest.trim.setAlpha(0.45)
    this.scene.tweens.add({ targets: chest.lid, y: chest.lid.y - 9, alpha: 0.55, duration: 180, ease: 'Back.easeOut' })
    const x = this.scene.tileCenter(chest.tile.x)
    const y = this.scene.tileCenter(chest.tile.y)
    for (let index = 0; index < 8; index += 1) {
      const sparkle = this.scene.add.circle(x, y - 10, 2, 0xfff1a8, 0.95).setDepth(24)
      this.scene.tweens.add({ targets: sparkle, x: x + Phaser.Math.Between(-24, 24), y: y - Phaser.Math.Between(18, 42), alpha: 0, duration: 560, onComplete: () => sparkle.destroy() })
    }
  }

  talkGuide() {
    if (!this.scene.flag('elder_intro')) {
      this.scene.showToast('Guide Rin: First stop is Elder Maelin north of here. I will keep pointing the safe route if you get turned around.')
      return
    }
    if (!this.scene.flag('field_marker_seen')) {
      this.scene.showToast('Guide Rin: Check the old marker east. I tied blue cord around the safe stones.')
      return
    }
    if (!this.scene.flag('field_battle_won')) {
      this.scene.showToast('Guide Rin: The guardian hates emberlight. Keep Io standing and do not hoard potions.')
      return
    }
    this.scene.showToast(this.scene.flag('shrine_gate_seen') ? 'Guide Rin: Moonwake Shrine was sealed when I was little. If it opened for you, go carefully.' : 'Guide Rin: You brought the quay back to a calm glow. Ask Maelin what the east gate means.')
  }

  talkElder() {
    if (!this.scene.flag('elder_intro')) {
      this.scene.setFlag('elder_intro')
      this.scene.setObjective(OBJECTIVES.inspectMarker)
      audioManager.playSfx('objective_update')
      this.scene.showToast('Elder Maelin: Inspect the eastern marker; the field will answer.')
    } else if (!this.scene.flag('field_marker_seen')) {
      this.scene.showToast('Elder Maelin: The marker holds the route. Return after reading it.')
    } else if (!this.scene.flag('field_battle_won')) {
      this.scene.setObjective(OBJECTIVES.winBattle)
      audioManager.playSfx('objective_update')
      this.scene.showToast('Elder Maelin: Face the guardian past the marker.')
    } else if (!this.scene.flag('slice_complete')) {
      this.scene.setFlag('elder_rewarded')
      this.scene.setFlag('slice_complete')
      this.scene.addInventory('ember_shard', 1)
      this.scene.addInventory('warding_ember', 1)
      this.scene.saveData.party[2].equipment.relic = 'warding_ember'
      this.scene.setObjective(OBJECTIVES.visitShrineGate)
      audioManager.playSfx('equipment_gain')
      this.scene.time.delayedCall(260, () => audioManager.playResonancePulse('event'))
      this.scene.showEventBanner('Moonwake Route Opened', 'A green seam of light unlocks the old shrine gate east of the field.')
      this.scene.showToast('Elder Maelin: Take the Warding Ember. The blue Moonwake lane east is open now.')
    } else {
      this.scene.showToast(this.scene.flag('shrine_gate_seen') ? 'Elder Maelin: Beyond Moonwake lies the first true answer. Tonight, Luma Quay will keep your names.' : 'Elder Maelin: The shrine gate is awake. Let it see the ember you carry.')
    }
    this.scene.persist()
    if (this.scene.objectiveText && this.scene.inventoryText) {
      this.scene.refreshHud()
    }
  }

  inspectMarker() {
    if (!this.scene.flag('elder_intro')) {
      this.scene.showToast('The marker hums, but you need the elder\'s guidance first.')
      return
    }
    if (!this.scene.flag('field_marker_seen')) {
      this.scene.setFlag('field_marker_seen')
      this.scene.setObjective(OBJECTIVES.winBattle)
      audioManager.playSfx('objective_update')
      this.scene.spawnStoryBoss('clay_sentinel', MARKER_TILE, FIELD_BATTLE_ID)
      this.scene.showToast('Marker: Guardian wake confirmed. Step southeast to challenge it.')
    } else if (!this.scene.flag('field_battle_won')) {
      this.scene.showToast('Marker: The guardian waits in the red-lit field southeast.')
    } else {
      this.scene.showToast(this.scene.flag('slice_complete') ? 'Marker: Guardian vow fulfilled. Moonwake Shrine accepts passage east.' : 'Marker: The path is calm. Report back to Elder Maelin.')
    }
    this.scene.persist()
    this.scene.refreshHud()
  }

  applyBattleResult() {
    const result = this.scene.initData.battleResult
    if (!result) {
      return
    }

    if (!result.victory) {
      this.scene.showToast('You regroup at Luma Quay. Check supplies, then try again when ready.')
      return
    }
    const rewards = result.rewards ?? { exp: 0, gold: 0, emberShards: 0, items: [] }
    const previousLevels = new Map(this.scene.saveData.party.map((member) => [member.characterId, member.level]))
    this.scene.saveData.gold += rewards.gold
    this.scene.saveData.battleRewards.exp += rewards.exp
    this.scene.saveData.battleRewards.gold += rewards.gold
    this.scene.saveData.battleRewards.emberShards += rewards.emberShards
    rewards.items.forEach((item) => this.scene.addInventory(item.itemId, item.quantity))
    if (rewards.emberShards > 0) {
      this.scene.addInventory('ember_shard', rewards.emberShards)
    }
    if (result.battleId === FIELD_BATTLE_ID) {
      this.scene.setFlag('field_battle_won')
      this.scene.setObjective(OBJECTIVES.returnToElder)
      audioManager.playResonancePulse('objective')
    }
    if (result.battleId === SHRINE_BOSS_BATTLE_ID) {
      this.scene.setFlag('shrine_guardian_won')
      this.scene.saveData.stage = 'shrine'
      this.scene.setObjective(OBJECTIVES.recruitMira)
      this.scene.addInventory('skywell_shard', 1)
      this.scene.saveData.party[0].equipment.relic = 'skywell_shard'
      this.scene.saveData.party.forEach((member) => {
        member.level = Math.max(member.level, 4)
      })
      audioManager.playResonancePulse('event')
    }
    if (result.battleId === ARCHIVE_SKIRMISH_ID) {
      this.scene.setFlag('archive_skirmish_won')
      this.scene.setObjective(OBJECTIVES.faceMidBoss)
    }
    if (result.battleId === MID_BOSS_BATTLE_ID) {
      this.scene.setFlag('thornheart_won')
      this.scene.saveData.stage = 'skywell'
      this.scene.setObjective(OBJECTIVES.openSkywell)
      this.scene.saveData.pet.forageReady = this.scene.saveData.pet.unlocked
      this.scene.saveData.party.forEach((member) => { member.level = Math.max(member.level, 5) })
    }
    if (result.battleId === FINAL_BOSS_BATTLE_ID) {
      this.scene.setFlag('final_boss_won')
      this.scene.setFlag('demo_complete')
      this.scene.saveData.gameCompleted = true
      this.scene.saveData.completionTimestamp = Date.now()
      this.scene.saveData.stage = 'homecoming'
      this.scene.setObjective(OBJECTIVES.complete)
      this.scene.saveData.pet.forageReady = this.scene.saveData.pet.unlocked
      this.scene.saveData.party.forEach((member) => { member.level = Math.max(member.level, 6) })
    }
    this.scene.persist()
    const levelUps = this.scene.saveData.party
      .filter((member) => member.level > (previousLevels.get(member.characterId) ?? member.level))
      .map((member) => ({ name: CHARACTERS[member.characterId]?.name ?? member.characterId, level: member.level }))
    this.scene.time.delayedCall(250, () => {
      this.scene.showEventBanner(
        this.scene.getBattleResultTitle(result.battleId),
        this.scene.getBattleResultSubtitle(result.battleId),
      )
      audioManager.playSfx(result.battleId === SHRINE_BOSS_BATTLE_ID ? 'equipment_gain' : 'reward_gain')
      this.scene.time.delayedCall(320, () => audioManager.playSfx('reward_gain'))
      this.scene.showRewardToast(`Rewards secured: ${rewards.gold}g, EXP ${rewards.exp}, new route objective updated.`)
      this.scene.showLevelUpCeremony(levelUps)
      this.scene.refreshHud()
      if (result.battleId === FINAL_BOSS_BATTLE_ID) {
        if (this.scene.saveData.ngPlusLevel > 0) this.scene.showToast('NG+ Complete!')
        this.scene.time.delayedCall(3050, () => this.scene.showDemoCompletionCard())
      }
    })
  }

  getBattleResultTitle(battleId?: string) {
    if (battleId === SHRINE_BOSS_BATTLE_ID) return 'Moonwake Guardian Defeated'
    if (battleId === ARCHIVE_SKIRMISH_ID) return 'Archive Path Cleared'
    if (battleId === MID_BOSS_BATTLE_ID) return 'Thornheart Felled'
    if (battleId === FINAL_BOSS_BATTLE_ID) return 'True Map Restored'
    return 'Guardian Felled'
  }

  getBattleResultSubtitle(battleId?: string) {
    if (battleId === SHRINE_BOSS_BATTLE_ID) return 'The shrine opens a human route: find Mira at the broken bridge.'
    if (battleId === ARCHIVE_SKIRMISH_ID) return 'The lesser roots retreat. Thornheart waits south with the stolen maps.'
    if (battleId === MID_BOSS_BATTLE_ID) return 'Pip can now forage. The Skywell Lens points to the final rift.'
    if (battleId === FINAL_BOSS_BATTLE_ID) return 'The false horizon collapses into a road back to the restored home.'
    return 'The field exhales. Far east, a shrine bell answers once.'
  }

  ringTideBell() {
    if (!this.scene.flag('tide_bell_rung')) {
      this.scene.setFlag('tide_bell_rung')
      audioManager.playTideBell(1)
      this.scene.showToast('The tide bell rings without echo. Fisher charms flicker awake along the quay.')
    } else {
      audioManager.playTideBell(this.scene.flag('field_battle_won') ? 3 : 2)
      this.scene.showToast(this.scene.flag('field_battle_won') ? 'The bell tone is clear now, no longer warped by the guardian field.' : 'The bell answers with a nervous blue shimmer.')
    }
    this.scene.persist()
  }

  inspectMural() {
    this.scene.addEvent('glass_mural_seen')
    const message = this.scene.flag('slice_complete')
      ? 'Mural: Three pilgrims carry emberglass toward a crescent gate—the last figure now glows like Nara.'
      : 'Mural: A cracked mosaic shows Luma Quay before the fall, every roof bright with bottled starlight.'
    this.scene.showToast(message)
    this.scene.persist()
  }

  lightWatchLantern() {
    if (!this.scene.flag('watch_lantern_lit')) {
      this.scene.setFlag('watch_lantern_lit')
      this.scene.addInventory('health_potion', 1)
      audioManager.playSfx('item_use')
      this.scene.showToast('Watch Lantern: You trim the wick. A hidden keeper cache yields Potion x1.')
      this.scene.refreshHud()
    } else {
      this.scene.showToast('The watch lantern burns steady, painting the grass in warm gold.')
    }
    this.scene.persist()
  }

  recruitMira() {
    if (!this.scene.flag('shrine_guardian_won')) {
      this.scene.showToast('A scout watches the bridge: "Beat the shrine test first. Then I will believe the road is real."')
      return
    }
    if (!this.scene.flag('mira_recruited')) {
      this.scene.setFlag('mira_recruited')
      this.scene.saveData.stage = 'archive'
      this.scene.addInventory('mira_bridge_key', 1)
      this.scene.addInventory('mana_potion', 1)
      this.scene.setObjective(OBJECTIVES.rescuePet)
      this.scene.saveData.party.forEach((member) => {
        member.currentHp += 12
        member.currentMp += 6
      })
      audioManager.playSfx('objective_update')
      this.scene.showEventBanner('Mira Joins the Route', 'Mira, the bridge scout who stayed behind to mark safe stones, now travels with the party and steadies every route ahead.')
      this.scene.createMiraCompanion((this.scene.player?.x ?? this.scene.tileCenter(ALLY_TILE.x)) + 28, (this.scene.player?.y ?? this.scene.tileCenter(ALLY_TILE.y)) + 18)
      this.scene.showToast('Mira: I know every broken plank east of here. Scout bonus unlocked: party restored a little HP/MP and archive routes will stay marked.')
    } else {
      this.scene.showToast('Mira: Bridge knots are set. Let us get the little bell-chime out of that thicket, then rebuild your house.')
    }
    this.scene.persist()
  }

  rescuePet() {
    if (!this.scene.flag('mira_recruited')) {
      this.scene.showToast('The thicket jingles fearfully. Someone nimble could help coax out whatever is hiding there.')
      return
    }
    if (!this.scene.saveData.pet.unlocked) {
      this.scene.saveData.pet = { unlocked: true, id: 'emberfox', name: 'Pip', forageReady: false, bonus: 'Finds one extra potion cache after major fights.' }
      this.scene.setFlag('pet_pip_rescued')
      this.scene.addInventory('health_potion', 1)
      this.scene.setObjective(OBJECTIVES.restoreHome)
      this.scene.createPetFollower((this.scene.player?.x ?? this.scene.tileCenter(PET_TILE.x)) - 28, (this.scene.player?.y ?? this.scene.tileCenter(PET_TILE.y)) + 18)
      audioManager.playSfx('reward_gain')
      this.scene.showEventBanner('Pip Rescued', 'The emberfox kit curls around Nara\'s boots, then proudly trots behind the party.')
      this.scene.showToast('Pip found a buried Potion x1. Pet benefit unlocked: extra cache after major victories.')
    } else if (this.scene.saveData.pet.forageReady) {
      this.scene.saveData.pet.forageReady = false
      this.scene.addInventory('health_potion', 1)
      this.scene.showToast('Pip digs up a hidden Potion x1 and looks impossibly pleased.')
    } else {
      this.scene.showToast('Pip circles you, ears bright. Benefit: after major fights, Pip can sniff out a bonus potion cache here.')
    }
    this.scene.persist()
  }

  restoreHome() {
    const home = this.scene.saveData.home
    if (!this.scene.saveData.pet.unlocked) {
      this.scene.showToast('Old Home: Cold rooms, cracked roof, empty bowls. Bring back warmth—and maybe someone small to fill them.')
      return
    }
    if (home.warmth === 0) {
      home.warmth = 1
      this.scene.addInventory('hearth_ember', 1)
      this.scene.setObjective(OBJECTIVES.restoreHome)
      audioManager.playSfx('save_point')
      this.scene.showEventBanner('Home Restored: Hearth', 'The old stove catches. For the first time, Luma Quay smells like supper instead of smoke.')
      this.scene.refreshHomeUpgradeVisuals()
      this.scene.showToast('Mira: Your mother kept spare maps under that tile. We are not letting this place go dark again.')
    } else if (home.garden === 0) {
      home.garden = 1
      this.scene.addInventory('health_elixir', 1)
      audioManager.playSfx('reward_gain')
      this.scene.showEventBanner('Home Restored: Moon-Garden', 'Pip stamps the soil flat. Medicinal glassmint begins to glow.')
      this.scene.refreshHomeUpgradeVisuals()
      this.scene.showToast('Garden upgrade: Health Elixir x1 harvested. Resting here now feels like coming back to people.')
    } else if (home.workshop === 0) {
      home.workshop = 1
      this.scene.addInventory('skywell_lens', 1)
      this.scene.setObjective(OBJECTIVES.enterArchive)
      audioManager.playSfx('equipment_gain')
      this.scene.showEventBanner('Home Restored: Map Workshop', 'The workbench lens focuses the route beyond the Verdant Archive.')
      this.scene.drawGateBlocker(ARCHIVE_TILE, true, 'Overgrowth', 0x78d66b)
      this.scene.refreshHomeUpgradeVisuals()
      this.scene.showToast('Workshop upgrade: Skywell Lens crafted. The Verdant Archive lane is now visibly open.')
    } else if (this.scene.flag('thornheart_won') && !this.scene.flag('skywell_opened')) {
      this.scene.setFlag('skywell_opened')
      this.scene.setObjective(OBJECTIVES.finalBoss)
      audioManager.playResonancePulse('objective')
      audioManager.playSfx('scene_whoosh')
      this.scene.showEventBanner('Skywell Lens Focused', 'Back at the workshop, Mira and Nara align the lens with Thornheart\'s crown and reveal the final climb.')
      this.scene.drawGateBlocker(FINAL_BOSS_TILE, true, 'Skywell Barrier', 0xbda7ff)
      this.scene.showToast('Skywell Barrier open: the home workshop locks a true route to the rift.')
    } else {
      this.scene.showToast(this.scene.flag('final_boss_won') ? 'Home: Warm hearth, living garden, open maps. Everyone has somewhere to return.' : 'Home: The hearth, garden, and map workshop are ready. Cross into the archive.')
    }
    this.scene.persist()
  }

  enterArchive() {
    if (this.scene.saveData.home.workshop === 0) {
      this.scene.showToast('Archive Overgrowth: vines cover this lane. Recruit Mira, rescue Pip, and restore the home workshop to mark a safe path.')
      return
    }
    if (!this.scene.flag('archive_entered')) {
      this.scene.setFlag('archive_entered')
      this.scene.saveData.stage = 'archive'
      this.scene.setObjective(OBJECTIVES.faceMidBoss)
      this.scene.showAreaBanner('Verdant Archive', 'A living library of roots, ruined maps, and roads that remember footsteps.')
      this.scene.showToast('Mira: Stay on my chalk marks. If a tree whispers your name, absolutely do not answer.')
      this.scene.spawnStoryBoss('storm_wisp', ARCHIVE_TILE, ARCHIVE_SKIRMISH_ID)
      this.scene.persist()
      return
    }
    if (!this.scene.flag('archive_skirmish_won')) {
      this.scene.startArchiveSkirmish()
      return
    }
    this.scene.showToast(this.scene.flag('thornheart_won') ? 'Verdant Archive: Thornheart is gone. The Skywell route shines overhead.' : 'Verdant Archive: Lesser roots are cleared. Thornheart blocks the south passage.')
  }

  inspectShrineGate() {
    if (!this.scene.flag('slice_complete')) {
      this.scene.showToast('Shrine Gate: moon-silver bars block this lane. Return after the field guardian and Elder Maelin open the vow.')
      return
    }
    if (!this.scene.flag('shrine_gate_seen')) {
      this.scene.setFlag('shrine_gate_seen')
      this.scene.setObjective(OBJECTIVES.attuneShrineFont)
      audioManager.playResonancePulse('event')
      audioManager.playSfx('scene_whoosh')
      this.scene.cameras.main.shake(220, 0.004)
      this.scene.showAreaBanner('Moonwake Shrine Approach', 'Beyond the gate, old glass ruins breathe with patient light.')
      this.scene.showEventBanner('Moonwake Shrine', 'A narrow pilgrim route opens. The inner seal waits beyond the font.')
      this.scene.drawGateBlocker(SHRINE_GATE_TILE, true, 'Shrine Gate', 0x8bd6ff)
    } else {
      this.scene.showToast(this.scene.flag('shrine_guardian_won') ? 'Moonwake Gate: The guardian vow is fulfilled. The shrine keeps a road of silver fire.' : 'Moonwake Gate: The approach descends to a font and an inner seal. Prepare before touching it.')
    }
    this.scene.persist()
    this.scene.refreshHud()
  }

  attuneShrineFont() {
    if (!this.scene.flag('shrine_gate_seen')) {
      this.scene.showToast('Shrine Lane: the visible gate is still closed. Inspect the Moonwake Gate at the top of the lane first.')
      return
    }
    if (!this.scene.flag('shrine_font_attuned')) {
      this.scene.setFlag('shrine_font_attuned')
      this.scene.setObjective(OBJECTIVES.faceShrineGuardian)
      this.scene.saveData.party.forEach((member) => {
        const character = CHARACTERS[member.characterId]
        member.currentHp = Math.max(member.currentHp, character?.baseStats.hp ?? member.currentHp)
        member.currentMp = Math.max(member.currentMp, character?.baseStats.mp ?? member.currentMp)
      })
      this.scene.addInventory('mana_potion', 1)
      audioManager.playSfx('save_point')
      this.scene.time.delayedCall(260, () => audioManager.playResonancePulse('objective'))
      this.scene.showEventBanner('Pilgrim Font Attuned', 'HP and MP restored. Ether x1 recovered from the moonlit basin.')
      this.scene.showToast('Io: The seal is not a lock. It is a witness. It wants us ready.')
    } else {
      this.scene.showToast(this.scene.flag('shrine_guardian_won') ? 'Pilgrim Font: The water reflects a road climbing into the Skywell.' : 'Pilgrim Font: Your reflection steadies. The inner seal awaits south.')
    }
    this.scene.persist()
    this.scene.refreshHud()
  }

  startShrineGuardianBattle() {
    if (!this.scene.flag('shrine_gate_seen')) { this.scene.showToast('Inner Seal: the shrine lane is blocked by the gate above. Open the Moonwake Gate first.'); return }
    if (!this.scene.flag('shrine_font_attuned')) { this.scene.showToast('Inner Seal: A cold pressure turns you back. Attune the pilgrim font first.'); return }
    if (this.scene.flag('shrine_guardian_won')) { this.scene.showToast('Inner Seal: Broken glass floats upward, forming a map toward the Skywell.'); return }
    this.scene.spawnStoryBoss('moonwake_guardian', SHRINE_SEAL_TILE, SHRINE_BOSS_BATTLE_ID)
  }

  startArchiveSkirmish() {
    this.scene.setFlag('archive_skirmish_won')
    this.scene.setObjective(OBJECTIVES.faceMidBoss)
    this.scene.showToast('Archive entrance cleared. Thornheart waits deeper in the roots.')
    this.scene.persist()
  }

  startMidBossBattle() {
    if (!this.scene.flag('archive_entered')) { this.scene.showToast('Root Wall: the Verdant Archive lane is still overgrown. Open the archive entrance first.'); return }
    if (this.scene.flag('thornheart_won')) { this.scene.showToast("Root Wall open: Thornheart's stump has become a stair of green glass pointing toward the Skywell."); return }
    this.scene.spawnStoryBoss('thornheart', MID_BOSS_TILE, MID_BOSS_BATTLE_ID)
  }

  startFinalBossBattle() {
    if (!this.scene.flag('thornheart_won')) { this.scene.showToast('Skywell Barrier: the upper approach is sealed by Thornheart roots. Clear the Verdant Archive first.'); return }
    if (!this.scene.flag('skywell_opened')) { this.scene.showToast('Skywell Barrier: the path glows but will not hold. Use the restored home workshop to focus the Skywell Lens.'); return }
    if (this.scene.flag('final_boss_won')) { this.scene.showToast('Skywell Rift: Quiet now. The false horizon has been folded into a true road home.'); return }
    this.scene.spawnStoryBoss('cartographers_lie', FINAL_BOSS_TILE, FINAL_BOSS_BATTLE_ID)
  }

  openShop() {
    if (this.scene.menuOverlay) {
      return
    }

    this.scene.busy = true
    audioManager.setPaused(true)
    audioManager.playSfx('ui_menu_open')
    const { width, height } = this.scene.scale
    const container = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(130)
    const shopItems = [
      { itemId: 'health_potion', price: 25 },
      { itemId: 'mana_potion', price: 35 },
      { itemId: 'antidote', price: 20 },
      { itemId: 'burn_salve', price: 20 },
      { itemId: 'wind_charm', price: 95 },
      { itemId: 'ember_charm', price: 95 },
      { itemId: 'arcane_charm', price: 95 },
    ].filter((entry) => ITEMS_BY_ID[entry.itemId]?.type !== 'charm' || !this.scene.hasInventoryItem(entry.itemId))

    container.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.6))
    const shopW = this.scene.uiWidth(0.52, 500)
    const shopH = this.scene.uiHeight(0.6, 380)
    container.add(this.scene.add.rectangle(width / 2, height / 2, shopW, shopH, 0x0b1028, 0.97).setStrokeStyle(2, 0xd4a84b, 0.75))
    container.add(this.scene.add.text(width / 2, height / 2 - 160, 'Quay Merchant', { color: '#f0c040', fontFamily: 'Georgia, serif', fontSize: '30px' }).setOrigin(0.5))
    const goldText = this.scene.add.text(width / 2 - 210, height / 2 - 122, `Your Gold: ${this.scene.saveData.gold}`, { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '18px' })
    container.add(goldText)

    shopItems.forEach((entry, index) => {
      const item = ITEMS_BY_ID[entry.itemId]
      const y = height / 2 - 82 + index * 34
      const row = this.scene.add.text(width / 2 - 210, y, `${item.name} — ${entry.price}g`, { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '17px' })
      container.add(row)
      const buy = this.scene.add.text(width / 2 + 150, y, 'Buy', { color: this.scene.saveData.gold >= entry.price ? '#8fffb0' : '#74788f', fontFamily: 'Arial, sans-serif', fontSize: '17px' })
        .setInteractive({ useHandCursor: true })
      buy.on('pointerdown', () => {
        if (ITEMS_BY_ID[entry.itemId]?.type === 'charm' && this.scene.hasInventoryItem(entry.itemId)) {
          audioManager.playSfx('ui_cancel')
          this.scene.showToast('Peddler: You already own that charm.')
          return
        }

        if (this.scene.saveData.gold < entry.price) {
          audioManager.playSfx('ui_cancel')
          this.scene.showToast('Peddler: Not enough gold for that.')
          return
        }

        this.scene.saveData.gold -= entry.price
        this.scene.addInventory(entry.itemId, 1)
        this.scene.autoEquipCharm(entry.itemId)
        this.scene.persist()
        goldText.setText(`Your Gold: ${this.scene.saveData.gold}`)
        audioManager.playSfx('merchant_trade')
        this.scene.showToast(`Purchased ${item.name} for ${entry.price}g.`)
        if (item.type === 'charm') {
          row.setColor('#74788f')
          buy.setText('Owned').setColor('#74788f').disableInteractive()
        }
      })
      container.add(buy)
    })

    const close = this.scene.add.text(width / 2, height / 2 + 152, 'Close', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '20px' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
    close.on('pointerdown', () => this.scene.closeMenu())
    container.add(close)
    this.scene.menuOverlay = { container }
  }

  createDefaultSaveData(): SaveData {
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
      ngPlusLevel: 0,
      gameCompleted: false,
      completionTimestamp: null,
    }
  }

  createNewGamePlusSaveData(): SaveData {
    const source = SaveSystem.load(this.scene.initData.sourceSaveSlot ?? SaveSystem.getAutoSaveSlot())
    const fresh = this.scene.createDefaultSaveData()
    if (!source?.gameCompleted) {
      return fresh
    }

    return {
      ...fresh,
      party: structuredClone(source.party),
      inventory: structuredClone(source.inventory),
      gold: source.gold,
      battleRewards: structuredClone(source.battleRewards),
      ngPlusLevel: source.ngPlusLevel + 1,
      flags: { tutorialCompleted: true, ngPlusStarted: true },
    }
  }

  getNgPlusHpMultiplier() {
    return 1 + this.scene.saveData.ngPlusLevel * 0.5
  }

  getNgPlusDamageMultiplier() {
    return 1 + this.scene.saveData.ngPlusLevel * 0.3
  }

  getNgPlusGoldMultiplier() {
    return 1 + this.scene.saveData.ngPlusLevel * 0.5
  }

  shouldRunFirstCombatTutorial() {
    return Boolean(this.scene.initData.newGame && !this.scene.initData.newGamePlus && !this.scene.saveData.flags.tutorialCompleted)
  }

  persist() {
    this.scene.saveCurrentPosition()
    if (!SaveSystem.autoSave(this.scene.saveData)) {
      audioManager.playSfx('ui_cancel')
      this.scene.showToast('Save failed. Progress remains playable, but browser storage may be full or blocked.')
      return
    }

    if (this.scene.objectiveText && this.scene.inventoryText) {
      this.scene.refreshHud()
    }
  }

  saveCurrentPosition() {
    if (this.scene.player) {
      this.scene.saveData.position = { mapId: 'Luma Quay', x: this.scene.player.x, y: this.scene.player.y }
    }
  }

  setObjective(objective: string) {
    const changed = this.scene.saveData.currentObjective !== objective
    this.scene.saveData.currentObjective = objective
    if (changed) this.scene.flashObjectiveBanner()
  }

  setFlag(flag: string) {
    this.scene.saveData.flags[flag] = true
    this.scene.addEvent(flag)
  }

  flag(flag: string): boolean {
    return Boolean(this.scene.saveData.flags[flag])
  }

  addEvent(eventId: string) {
    if (!this.scene.saveData.completedEvents.includes(eventId)) {
      this.scene.saveData.completedEvents.push(eventId)
    }
  }

  hasInventoryItem(itemId: string): boolean {
    return this.scene.saveData.inventory.some((entry) => entry.itemId === itemId && entry.quantity > 0) ||
      this.scene.saveData.party.some((member) => Object.values(member.equipment).includes(itemId))
  }

  autoEquipCharm(itemId: string) {
    if (ITEMS_BY_ID[itemId]?.type !== 'charm') {
      return
    }

    const member = this.scene.saveData.party.find((partyMember) => !partyMember.equipment.charm)
    if (member) {
      member.equipment.charm = itemId
    }
  }

  addInventory(itemId: string, quantity: number) {
    const item = this.scene.saveData.inventory.find((entry) => entry.itemId === itemId)
    if (item) {
      item.quantity = Math.max(0, item.quantity + quantity)
    } else {
      this.scene.saveData.inventory.push({ itemId, quantity: Math.max(0, quantity) })
    }
  }

  restorePartyMissingPercent(hpPercent: number, mpPercent: number) {
    this.scene.saveData.party.forEach((member) => {
      const character = CHARACTERS[member.characterId]
      if (!character) {
        return
      }
      const stats = this.scene.scaleCharacterStats(character, member.level)
      const missingHp = Math.max(0, stats.hp - member.currentHp)
      const missingMp = Math.max(0, stats.mp - member.currentMp)
      member.currentHp = Math.min(stats.hp, member.currentHp + Math.ceil(missingHp * hpPercent))
      member.currentMp = Math.min(stats.mp, member.currentMp + Math.ceil(missingMp * mpPercent))
    })
  }

  scaleCharacterStats(character: (typeof CHARACTERS)[string], level: number) {
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

  rollGardenItem(): string | null {
    if (Math.random() >= 0.4) {
      return null
    }
    const roll = Math.random()
    if (roll < 0.5) return 'health_potion'
    if (roll < 0.8) return 'mana_potion'
    return 'antidote'
  }

  rollPetForageItem(): string {
    const roll = Math.random()
    if (roll < 0.35) return 'health_potion'
    if (roll < 0.6) return 'mana_potion'
    if (roll < 0.75) return 'ember_shard'
    if (roll < 0.9) return 'antidote'
    return 'burn_salve'
  }

  getItemName(itemId: string) {
    return ITEMS_BY_ID[itemId]?.name ?? itemId.replace(/_/g, ' ')
  }

  homeProgress() {
    return this.scene.saveData.home.warmth + this.scene.saveData.home.garden + this.scene.saveData.home.workshop
  }

  getHomeName() {
    const progress = this.scene.homeProgress()
    return progress === 0 ? 'Old Home' : progress === 3 ? 'Restored Home' : `Home ${progress}/3`
  }
}
