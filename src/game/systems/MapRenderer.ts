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

const MAPRENDERER_METHODS = [
  "createMap",
  "checkGateOverrides",
  "renderTile",
  "drawGrassDetails",
  "drawPathDetails",
  "drawWaterDetails",
  "drawWallDetails",
  "drawFlowerDetails",
  "drawShrineDetails",
  "drawBridgeTile",
  "drawTileBorders",
  "drawBush",
  "drawRock",
  "createWaterShimmer",
  "drawAreaPolish",
  "drawZoneWash",
  "drawRouteRibbon",
  "drawRouteLandmark",
  "drawAreaLabel",
  "drawFenceLine",
  "drawHedgeLine",
  "drawGateBlocker",
  "clearRouteStateVisuals",
  "createBackdrop",
  "createAmbientParticles",
  "createFloatingEmber",
  "getInteractionTile",
  "matchesTile",
  "isWallAtWorld",
  "worldToTile",
  "tileCenter",
  "tileKey"
] as const

export class MapRenderer {
  private scene: SceneAccess

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
  }

  install(): void {
    for (const method of MAPRENDERER_METHODS) {
      this.scene[method] = (this as unknown as Record<string, (...args: any[]) => any>)[method].bind(this)
    }
  }

  render(scene: Phaser.Scene = this.scene): void {
    this.scene = scene as SceneAccess
    this.createMap()
  }

  createMap() {
    const useTileset = false
    void useTileset

    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const layoutTile = MAP_LAYOUT[tileY][tileX]
        const def = TILE_DEFS[layoutTile] ?? TILE_DEFS.G
        const blocksTravel = !this.scene.checkGateOverrides(tileX, tileY, def)
        this.scene.renderTile(layoutTile, def, tileX, tileY)
        if (blocksTravel) {
          this.scene.walls.add(this.scene.tileKey(tileX, tileY))
        }
      }
    }

    this.scene.createWaterShimmer()
    this.scene.drawAreaPolish()
  }

  checkGateOverrides(tileX: number, tileY: number, def: TileDef): boolean {
    if (tileX === SHRINE_GATE_TILE.x && tileY === SHRINE_GATE_TILE.y && !this.scene.flag('shrine_gate_seen')) return true
    return def.passable
  }

  renderTile(char: string, def: TileDef, tileX: number, tileY: number) {
    const x = tileX * TILE_SIZE
    const y = tileY * TILE_SIZE
    const areaTint = tileX <= 6 && tileY >= 9 ? 0x4f9342 : tileX >= 14 && tileY <= 8 ? 0x355c75 : tileX >= 12 ? 0x526b3c : tileY >= 10 ? 0x3f7c43 : 0x3d8b37
    if (def.visual === 'path' || def.visual === 'ruins') {
      this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, def.visual === 'ruins' ? 0x827769 : 0xc4a882).setOrigin(0).setDepth(def.depth)
      this.scene.drawPathDetails(x, y, tileX, tileY)
    } else if (def.visual === 'water') {
      this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x1e64a8).setOrigin(0).setDepth(def.depth)
      this.scene.add.ellipse(x + 24, y + 24, 38, 34, 0x154f8e, 0.28).setDepth(def.depth + 0.02)
      this.scene.drawWaterDetails(x, y, tileX, tileY)
    } else if (def.visual === 'wall') {
      this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x5a4a3a).setOrigin(0).setDepth(def.depth)
      this.scene.drawWallDetails(x, y, tileX, tileY)
    } else if (def.visual === 'shrine') {
      this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x8d8374).setOrigin(0).setDepth(def.depth)
      this.scene.drawShrineDetails(x, y, tileX, tileY)
    } else if (def.visual === 'bridge') {
      this.scene.drawBridgeTile(x, y, def.depth)
    } else {
      this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, areaTint).setOrigin(0).setDepth(def.depth)
      this.scene.drawGrassDetails(x, y, tileX, tileY, areaTint)
      if (char === 'F') this.scene.drawFlowerDetails(x, y, tileX, tileY)
    }
    this.scene.drawTileBorders(char, x, y, tileX, tileY, def.depth)
  }

  drawGrassDetails(x: number, y: number, tileX: number, tileY: number, areaTint: number) {
    const shade = [0x69a64f, 0x2f7133, 0x86bd5d][(tileX * 17 + tileY * 23) % 3]
    this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, shade, 0.08).setOrigin(0).setDepth(0.03)
    this.scene.add.rectangle(x, y + TILE_SIZE - 7, TILE_SIZE, 7, areaTint, 0.18).setOrigin(0).setDepth(0.04)
    for (let index = 0; index < 4; index += 1) {
      const bladeX = x + 7 + ((tileX * 13 + tileY * 7 + index * 12) % 34)
      const bladeY = y + 9 + ((tileX * 5 + tileY * 19 + index * 9) % 28)
      this.scene.add.triangle(bladeX, bladeY, 0, 7, 2, 0, 4, 7, shade, 0.34).setRotation(Phaser.Math.DegToRad(((tileX + tileY + index) % 3 - 1) * 14)).setDepth(0.12)
    }
    if ((tileX * 31 + tileY * 11) % 17 === 0) this.scene.drawBush(x + 24, y + 25, 0.16)
    if ((tileX * 7 + tileY * 29) % 10 < 3) this.scene.drawRock(x + 16 + ((tileX * 3) % 14), y + 28, 0.16)
  }

  drawPathDetails(x: number, y: number, tileX: number, tileY: number) {
    this.scene.add.rectangle(x, y, 4, TILE_SIZE, 0x5f8d4a, 0.16).setOrigin(0).setDepth(0.08)
    this.scene.add.rectangle(x + TILE_SIZE - 4, y, 4, TILE_SIZE, 0x5f8d4a, 0.16).setOrigin(0).setDepth(0.08)
    for (let index = 0; index < 5; index += 1) {
      const pebbleX = x + 8 + ((tileX * 9 + index * 13) % 31)
      const pebbleY = y + 10 + ((tileY * 15 + index * 11) % 27)
      this.scene.add.ellipse(pebbleX, pebbleY, 4 + (index % 3), 2 + (index % 2), index % 2 ? 0xe0c899 : 0x8d7657, 0.28).setDepth(0.14)
    }
    if ((tileX * 5 + tileY * 11) % 4 === 0) this.scene.add.ellipse(x + 18, y + 28, 8, 3, 0x6e563d, 0.18).setAngle(-12).setDepth(0.15)
  }

  drawWaterDetails(x: number, y: number, tileX: number, tileY: number) {
    this.scene.add.rectangle(x + 3, y + 3, TILE_SIZE - 6, 2, 0x80cfff, 0.16).setOrigin(0).setDepth(0.08)
    for (let index = 0; index < 2; index += 1) {
      const wave = this.scene.add.arc(x + 12 + index * 20, y + 17 + ((tileX + tileY + index) % 3) * 7, 8, 200, 340, false, 0x9bdcff, 0).setStrokeStyle(2, 0xc7f9ff, 0.22).setDepth(0.18)
      this.scene.tweens.add({ targets: wave, x: wave.x + 5, alpha: 0.06, yoyo: true, repeat: -1, duration: 1500 + index * 250, ease: 'Sine.easeInOut' })
    }
    if ((tileX * 19 + tileY * 7) % 5 === 0) {
      const sparkle = this.scene.add.circle(x + 12 + ((tileX * 11) % 24), y + 14 + ((tileY * 13) % 22), 1.4, 0xffffff, 0.36).setDepth(0.2)
      this.scene.tweens.add({ targets: sparkle, alpha: 0.04, scale: ENTITY_SCALE.object * 2.5, yoyo: true, repeat: -1, duration: 1200, ease: 'Sine.easeInOut' })
    }
  }

  drawWallDetails(x: number, y: number, tileX: number, tileY: number) {
    this.scene.add.rectangle(x, y + TILE_SIZE - 10, TILE_SIZE, 10, 0x241b16, 0.28).setOrigin(0).setDepth(1.22)
    this.scene.add.rectangle(x, y, TILE_SIZE, 3, 0x9b846c, 0.34).setOrigin(0).setDepth(1.24)
    this.scene.add.rectangle(x + 2, y + 7, TILE_SIZE - 4, 2, 0x8a745f, 0.28).setOrigin(0).setDepth(1.23)
    this.scene.add.rectangle(x + 2, y + 24, TILE_SIZE - 4, 2, 0x31271f, 0.22).setOrigin(0).setDepth(1.23)
    this.scene.add.rectangle(x + ((tileX + tileY) % 2 ? 15 : 30), y + 9, 2, 15, 0x34291f, 0.25).setDepth(1.24)
    this.scene.add.rectangle(x + ((tileX + tileY) % 2 ? 30 : 14), y + 26, 2, 13, 0x34291f, 0.22).setDepth(1.24)
    if ((tileX * 5 + tileY) % 5 === 0) this.scene.drawBush(x + 24, y + 40, 1.31)
  }

  drawFlowerDetails(x: number, y: number, tileX: number, tileY: number) {
    const flowerColors = [0xffd166, 0xff7aa2, 0xc7f9ff, 0xffffff, 0xf3a0ff]
    for (let index = 0; index < 5; index += 1) {
      const flowerX = x + 9 + ((tileX * 9 + tileY * 5 + index * 11) % 30)
      const flowerY = y + 10 + ((tileX * 4 + tileY * 8 + index * 7) % 26)
      this.scene.add.line(flowerX, flowerY + 4, 0, 0, 0, 5, 0x2d722d, 0.36).setDepth(0.18)
      this.scene.add.circle(flowerX, flowerY, 2, flowerColors[index], 0.9).setDepth(0.22)
    }
    if ((tileX * 13 + tileY * 17) % 20 < 3) {
      this.scene.add.ellipse(x + 30, y + 12, 5, 3, 0xffe47a, 0.72).setDepth(0.25)
      this.scene.add.circle(x + 27, y + 11, 2, 0xc7f9ff, 0.48).setDepth(0.26)
      this.scene.add.circle(x + 33, y + 11, 2, 0xc7f9ff, 0.48).setDepth(0.26)
    }
  }

  drawShrineDetails(x: number, y: number, tileX: number, tileY: number) {
    this.scene.add.circle(x + 24, y + 24, 14, 0x1a5f74, 0.24).setStrokeStyle(2, 0x9ff3ff, 0.62).setDepth(0.22)
    this.scene.add.arc(x + 24, y + 24, 8, 25, 320, false, 0x9ff3ff, 0).setStrokeStyle(2, 0xc7f9ff, 0.5).setDepth(0.24)
    for (let index = 0; index < 2; index += 1) {
      const mote = this.scene.add.circle(x + 16 + ((tileX * 7 + index * 13) % 18), y + 14 + ((tileY * 9 + index * 11) % 20), 1.5, 0x9ff3ff, 0.32).setDepth(0.28)
      this.scene.tweens.add({ targets: mote, y: mote.y - 8, alpha: 0.06, yoyo: true, repeat: -1, duration: 1600 + index * 300, ease: 'Sine.easeInOut' })
    }
  }

  drawBridgeTile(x: number, y: number, depth: number) {
    this.scene.add.rectangle(x, y + 38, TILE_SIZE, 8, 0x1b120d, 0.28).setOrigin(0).setDepth(depth)
    this.scene.add.rectangle(x, y, TILE_SIZE, TILE_SIZE, 0x8a5a32).setOrigin(0).setDepth(depth + 0.02)
    for (let index = 0; index < 5; index += 1) this.scene.add.rectangle(x + 2, y + index * 10, TILE_SIZE - 4, 7, index % 2 ? 0x9d6a3d : 0x704522, 0.95).setOrigin(0).setDepth(depth + 0.06)
    this.scene.add.rectangle(x + 4, y, 4, TILE_SIZE, 0x4b2f1d, 0.95).setOrigin(0).setDepth(depth + 0.12)
    this.scene.add.rectangle(x + TILE_SIZE - 8, y, 4, TILE_SIZE, 0x4b2f1d, 0.95).setOrigin(0).setDepth(depth + 0.12)
  }

  drawTileBorders(char: string, x: number, y: number, tileX: number, tileY: number, depth: number) {
    const neighbors = [
      { dx: 0, dy: -1, side: 'top' }, { dx: 1, dy: 0, side: 'right' }, { dx: 0, dy: 1, side: 'bottom' }, { dx: -1, dy: 0, side: 'left' },
    ] as const
    neighbors.forEach((neighbor) => {
      const other = MAP_LAYOUT[tileY + neighbor.dy]?.[tileX + neighbor.dx]
      if (!other || other === char) return
      const pair = `${char}${other}`
      const color = pair.includes('B') && pair.includes('W') ? 0x8b8d86 : pair.includes('B') ? 0xd6bd83 : pair.includes('W') ? 0x234421 : 0x9b7a4e
      const alpha = pair.includes('B') ? 0.48 : 0.28
      if (neighbor.side === 'top') this.scene.add.rectangle(x + 2, y, TILE_SIZE - 4, 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'bottom') this.scene.add.rectangle(x + 2, y + TILE_SIZE - 4, TILE_SIZE - 4, 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'left') this.scene.add.rectangle(x, y + 2, 4, TILE_SIZE - 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
      if (neighbor.side === 'right') this.scene.add.rectangle(x + TILE_SIZE - 4, y + 2, 4, TILE_SIZE - 4, color, alpha).setOrigin(0).setDepth(depth + 0.3)
    })
  }

  drawBush(x: number, y: number, depth: number) {
    this.scene.add.circle(x - 7, y + 2, 7, 0x2f7d3f, 0.92).setDepth(depth)
    this.scene.add.circle(x, y - 2, 9, 0x3fa456, 0.92).setDepth(depth)
    this.scene.add.circle(x + 8, y + 3, 7, 0x256d36, 0.92).setDepth(depth)
  }

  drawRock(x: number, y: number, depth: number) {
    this.scene.add.ellipse(x, y, 14, 9, 0x7c8076, 0.72).setDepth(depth).setStrokeStyle(1, 0xb8b49f, 0.28)
    this.scene.add.ellipse(x - 2, y - 2, 7, 3, 0xc0c6b5, 0.18).setDepth(depth + 0.01)
  }

  createWaterShimmer() {
    const visited = new Set<string>()
    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        if (MAP_LAYOUT[tileY][tileX] !== 'B' || visited.has(this.scene.tileKey(tileX, tileY))) {
          continue
        }
        let width = 1
        while (tileX + width < MAP_WIDTH && MAP_LAYOUT[tileY][tileX + width] === 'B') {
          width += 1
        }
        for (let index = 0; index < width; index += 1) {
          visited.add(this.scene.tileKey(tileX + index, tileY))
        }
        const shimmer = this.scene.add.rectangle(tileX * TILE_SIZE, tileY * TILE_SIZE + 14, width * TILE_SIZE, 16, 0x9bdcff, 0.04).setOrigin(0).setDepth(1.35).setName('ambient:water-shimmer')
        this.scene.waterShimmers.push(shimmer)
        this.scene.tweens.add({ targets: shimmer, alpha: 0.08, yoyo: true, repeat: -1, duration: 2000, ease: 'Sine.easeInOut' })
      }
    }
  }

  drawAreaPolish() {
    this.scene.drawZoneWash(4.3, 3.1, 310, 210, 0x2d7691, 'Luma Quay tideglass')
    this.scene.drawZoneWash(4.8, 11.2, 360, 210, 0x4f9b47, 'South Garden hearth')
    this.scene.drawZoneWash(15.8, 8.7, 260, 260, 0xd29b42, 'East Field wheatline')
    this.scene.drawZoneWash(17.2, 3.4, 190, 270, 0x315d9a, 'Moonwake blue lane')
    this.scene.drawZoneWash(10.7, 11.8, 210, 180, 0x256a3a, 'Verdant Archive canopy')
    this.scene.drawZoneWash(17.4, 12.0, 170, 150, 0x7567b7, 'Skywell violet climb')

    this.scene.drawRouteRibbon([{ x: 4, y: 1 }, { x: 4, y: 5 }, { x: 8, y: 5 }, { x: 11, y: 5 }, { x: 15, y: 8 }, { x: 17, y: 12 }], 0xd8ba83, 'main tan road')
    this.scene.drawRouteRibbon([{ x: 11, y: 5 }, { x: 14, y: 2 }, { x: 18, y: 6 }, { x: 18, y: 10 }], 0x72d7ff, 'blue shrine road')
    this.scene.drawRouteRibbon([{ x: 5, y: 12 }, { x: 8, y: 12 }, { x: 11, y: 12 }, { x: 15, y: 12 }], 0x6fe07e, 'green archive road')

    this.scene.drawAreaLabel(4.5, 1.35, 'Luma Quay')
    this.scene.drawAreaLabel(4.5, 10.55, 'South Garden / Home')
    this.scene.drawAreaLabel(15.6, 8.15, 'East Field')
    this.scene.drawAreaLabel(16.5, 2.05, 'Moonwake Shrine')
    this.scene.drawAreaLabel(10.8, 11.05, 'Verdant Archive')
    this.scene.drawAreaLabel(17.05, 12.65, 'Skywell Approach')

    this.scene.drawFenceLine([{ x: 4, y: 6 }, { x: 5, y: 6 }, { x: 6, y: 6 }, { x: 7, y: 6 }], 'Fallen bridge to Mira')
    this.scene.drawFenceLine([{ x: 14, y: 9 }, { x: 14, y: 10 }, { x: 15, y: 10 }], 'Field fence')
    this.scene.drawHedgeLine([{ x: 9, y: 3 }, { x: 11, y: 3 }, { x: 12, y: 3 }])
    this.scene.drawHedgeLine([{ x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }])
    this.scene.drawRouteLandmark({ x: 16, y: 12 }, 'FIELD GATE', 0xffcf76)
    this.scene.drawRouteLandmark({ x: 18, y: 5 }, 'SHRINE ARCH', 0x8bd6ff)
    this.scene.drawRouteLandmark({ x: 10, y: 12 }, 'ARCHIVE STEPS', 0x78d66b)
    this.scene.drawRouteLandmark({ x: 17, y: 11 }, 'SKYWELL STAIRS', 0xbda7ff)
    this.scene.drawGateBlocker(SHRINE_GATE_TILE, this.scene.flag('shrine_gate_seen'), 'Shrine Gate', 0x8bd6ff)
    this.scene.drawGateBlocker(ARCHIVE_TILE, this.scene.saveData.home.workshop > 0, 'Overgrowth', 0x78d66b)
    this.scene.drawGateBlocker(MID_BOSS_TILE, this.scene.flag('thornheart_won'), 'Root Wall', 0x5bc779)
    this.scene.drawGateBlocker(FINAL_BOSS_TILE, this.scene.flag('skywell_opened'), 'Skywell Barrier', 0xbda7ff)
  }

  drawZoneWash(tileX: number, tileY: number, width: number, height: number, color: number, label: string) {
    this.scene.add.ellipse(tileX * TILE_SIZE, tileY * TILE_SIZE, width, height, color, 0.16).setDepth(0.05).setName(`zone:${label}`)
  }

  drawRouteRibbon(points: Array<{ x: number; y: number }>, color: number, label: string) {
    const graphics = this.scene.add.graphics().setDepth(0.35).setName(`route:${label}`)
    graphics.lineStyle(28, 0x160f0b, 0.22)
    graphics.beginPath()
    points.forEach((point, index) => {
      const x = this.scene.tileCenter(point.x)
      const y = this.scene.tileCenter(point.y)
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
      const x = this.scene.tileCenter(point.x)
      const y = this.scene.tileCenter(point.y)
      if (index === 0) {
        graphics.moveTo(x, y)
      } else {
        graphics.lineTo(x, y)
      }
    })
    graphics.strokePath()
  }

  drawRouteLandmark(tile: { x: number; y: number }, label: string, color: number) {
    const x = this.scene.tileCenter(tile.x)
    const y = this.scene.tileCenter(tile.y)
    this.scene.add.rectangle(x, y + 12, 54, 8, 0x120d12, 0.45).setDepth(2.45).setName(`landmark:${label}:shadow`)
    this.scene.add.rectangle(x - 18, y - 1, 5, 32, color, 0.86).setDepth(2.5).setName(`landmark:${label}:post`)
    this.scene.add.rectangle(x + 18, y - 1, 5, 32, color, 0.86).setDepth(2.5)
    this.scene.add.rectangle(x, y - 16, 46, 6, color, 0.86).setDepth(2.55)
    this.scene.add.text(x, y + 24, label, { color: '#fff7d5', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#090b12bb', padding: { x: 3, y: 1 } }).setOrigin(0.5).setDepth(2.6).setName(`landmark:${label}`)
  }

  drawAreaLabel(tileX: number, tileY: number, label: string) {
    const x = tileX * TILE_SIZE
    const y = tileY * TILE_SIZE
    const panel = this.scene.add.rectangle(x, y, label.length * 7.6 + 22, 22, 0x061019, 0.58).setDepth(2.2)
    panel.setStrokeStyle(1, 0xf3e1b0, 0.24)
    this.scene.add.text(x, y, label, { color: '#f3e1b0', fontFamily: 'Georgia, serif', fontSize: '12px' }).setOrigin(0.5).setDepth(2.3)
  }

  drawFenceLine(tiles: Array<{ x: number; y: number }>, label: string) {
    tiles.forEach((tile) => {
      const x = this.scene.tileCenter(tile.x)
      const y = this.scene.tileCenter(tile.y)
      this.scene.add.rectangle(x, y + 3, 42, 8, 0x8b623c, 0.96).setDepth(2.4)
      this.scene.add.rectangle(x - 13, y, 5, 22, 0x5a3b24, 0.96).setDepth(2.5)
      this.scene.add.rectangle(x + 13, y, 5, 22, 0x5a3b24, 0.96).setDepth(2.5)
    })
    const first = tiles[0]
    this.scene.add.text(this.scene.tileCenter(first.x), this.scene.tileCenter(first.y) - 23, label, { color: '#ffdca8', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5).setDepth(2.6)
  }

  drawHedgeLine(tiles: Array<{ x: number; y: number }>) {
    tiles.forEach((tile) => {
      const x = this.scene.tileCenter(tile.x)
      const y = this.scene.tileCenter(tile.y)
      this.scene.add.ellipse(x, y + 4, 42, 30, 0x1f5b2f, 0.94).setDepth(2.2)
      this.scene.add.circle(x - 10, y - 4, 10, 0x2f7c3a, 0.9).setDepth(2.3)
      this.scene.add.circle(x + 8, y - 5, 11, 0x3b9146, 0.9).setDepth(2.3)
    })
  }

  drawGateBlocker(tile: { x: number; y: number }, isOpen: boolean, label: string, color: number) {
    this.scene.routeClarityStates[label] = isOpen ? 'open' : 'closed'
    this.scene.clearRouteStateVisuals(label)
    const x = this.scene.tileCenter(tile.x)
    const y = this.scene.tileCenter(tile.y)
    const statePrefix = `route-state:${label}`
    this.scene.add.rectangle(x, y + 23, isOpen ? 68 : 58, isOpen ? 8 : 6, isOpen ? 0x9ff3ff : color, isOpen ? 0.42 : 0.88).setDepth(2.7).setName(`${statePrefix}:${isOpen ? 'open' : 'closed'}:base`)
    if (!isOpen) {
      this.scene.add.rectangle(x, y + 4, 52, 44, 0x070914, 0.48).setStrokeStyle(4, color, 0.95).setDepth(2.8).setName(`${statePrefix}:closed:frame`)
      this.scene.add.rectangle(x, y + 4, 34, 56, color, 0.18).setDepth(2.82).setName(`${statePrefix}:closed:fill`)
      this.scene.add.line(x, y + 4, -22, -18, 22, 18, color, 0.95).setLineWidth(5).setDepth(2.86).setName(`${statePrefix}:closed:cross-a`)
      this.scene.add.line(x, y + 4, 22, -18, -22, 18, color, 0.95).setLineWidth(5).setDepth(2.86).setName(`${statePrefix}:closed:cross-b`)
      this.scene.add.text(x, y - 34, `${label} closed`, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914dd', padding: { x: 5, y: 2 } }).setOrigin(0.5).setDepth(2.9).setName(`${statePrefix}:closed:label`)
      return
    }
    this.scene.add.rectangle(x, y + 2, 64, 30, 0x9ff3ff, 0.08).setStrokeStyle(2, 0x9ff3ff, 0.42).setDepth(2.78).setName(`${statePrefix}:open:frame`)
    this.scene.add.text(x, y - 32, `${label} open`, { color: '#9ff3ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 4, y: 2 } }).setOrigin(0.5).setDepth(2.9).setName(`${statePrefix}:open:label`)
  }

  clearRouteStateVisuals(label: string) {
    const prefix = `route-state:${label}:`
    this.scene.children.list
      .filter((child) => typeof child.name === 'string' && child.name.startsWith(prefix))
      .forEach((child) => child.destroy())
  }

  createBackdrop() {
    const useBgImage = false
    if (useBgImage && hasTexture(this.scene, GENERATED_ASSETS.overworldBg)) {
      this.scene.add.image((MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2, GENERATED_ASSETS.overworldBg).setDisplaySize(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE).setDepth(-10)
    }
    this.scene.add.rectangle(0, 0, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 3, 0x142846).setOrigin(0).setDepth(-10)
    this.scene.add.rectangle(0, (MAP_HEIGHT * TILE_SIZE) / 3, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 3, 0x405884, 0.72).setOrigin(0).setDepth(-9.9)
    this.scene.add.rectangle(0, (MAP_HEIGHT * TILE_SIZE) / 2, MAP_WIDTH * TILE_SIZE, (MAP_HEIGHT * TILE_SIZE) / 2, 0x355d36, 0.34).setOrigin(0).setDepth(-9.8)
    for (let index = 0; index < 5; index += 1) {
      const cloudX = 170 + index * 360
      const cloudY = 70 + (index % 3) * 46
      this.scene.add.ellipse(cloudX, cloudY, 90, 26, 0xffffff, 0.13).setDepth(-8)
      this.scene.add.ellipse(cloudX - 34, cloudY + 5, 54, 20, 0xffffff, 0.10).setDepth(-8)
      this.scene.add.ellipse(cloudX + 38, cloudY + 4, 62, 22, 0xf4f1ff, 0.09).setDepth(-8)
    }
    for (let index = 0; index < 12; index += 1) {
      const mote = this.scene.add.circle(Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48), Phaser.Math.Between(64, MAP_HEIGHT * TILE_SIZE - 64), Phaser.Math.Between(1, 2), 0x9ff3ff, 0.06).setDepth(-2)
      this.scene.tweens.add({ targets: mote, x: mote.x + Phaser.Math.Between(-14, 14), y: mote.y - Phaser.Math.Between(8, 24), alpha: 0.02, yoyo: true, repeat: -1, duration: Phaser.Math.Between(3200, 5800), ease: 'Sine.easeInOut' })
    }
  }

  createAmbientParticles() {
    const saveCenterX = SAVE_TILE.x * TILE_SIZE + TILE_SIZE / 2
    const saveCenterY = SAVE_TILE.y * TILE_SIZE + TILE_SIZE / 2
    for (let i = 0; i < 6; i++) {
      const fx = Phaser.Math.Between(saveCenterX - 48, saveCenterX + 48)
      const fy = Phaser.Math.Between(saveCenterY - 48, saveCenterY + 48)
      const glow = this.scene.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 3), 0x9ff3ff, Phaser.Math.FloatBetween(0.15, 0.35)).setDepth(5)
      this.scene.tweens.add({
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
      const leaf = this.scene.add.circle(gx, gy, 1.5, 0x6abf5e, 0.12).setDepth(0.3)
      this.scene.tweens.add({
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
      const ember = this.scene.add.circle(Phaser.Math.Between(36, MAP_WIDTH * TILE_SIZE - 36), Phaser.Math.Between(48, MAP_HEIGHT * TILE_SIZE - 48), Phaser.Math.FloatBetween(1, 2.5), Phaser.Utils.Array.GetRandom([0xffd36e, 0x9ff3ff, 0x78d66b]), Phaser.Math.FloatBetween(0.05, 0.16)).setDepth(7)
      this.scene.tweens.add({
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
      this.scene.createFloatingEmber(Phaser.Math.Between(0, 2500))
    }
  }

  createFloatingEmber(delay = 0) {
    const ember = this.scene.add.circle(Phaser.Math.Between(24, MAP_WIDTH * TILE_SIZE - 24), MAP_HEIGHT * TILE_SIZE + Phaser.Math.Between(8, 120), Phaser.Math.FloatBetween(1.8, 3.5), Phaser.Utils.Array.GetRandom([0xffa43a, 0xffd36e, 0xfff1a8]), Phaser.Math.FloatBetween(0.2, 0.5)).setDepth(8).setName('ambient:floating-ember')
    this.scene.emberParticles.push(ember)
    this.scene.tweens.add({
      targets: ember,
      x: ember.x + Phaser.Math.Between(-24, 24),
      y: -24,
      alpha: 0.08,
      duration: Phaser.Math.Between(3000, 7000),
      delay,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.scene.emberParticles = this.scene.emberParticles.filter((particle) => particle !== ember)
        ember.destroy()
        if (this.scene.scene.isActive()) {
          this.scene.createFloatingEmber(Phaser.Math.Between(200, 1200))
        }
      },
    })
  }

  getInteractionTile() {
    if (!this.scene.player) {
      return null
    }
    const tile = this.scene.worldToTile(this.scene.player.x, this.scene.player.y)
    if (this.scene.facing === 'left') {
      tile.x -= 1
    } else if (this.scene.facing === 'right') {
      tile.x += 1
    } else if (this.scene.facing === 'up') {
      tile.y -= 1
    } else {
      tile.y += 1
    }
    return tile
  }

  matchesTile(tile: { x: number; y: number } | null, target: { x: number; y: number }): boolean {
    return tile?.x === target.x && tile.y === target.y
  }

  isWallAtWorld(x: number, y: number): boolean {
    const tile = this.scene.worldToTile(x, y)
    return this.scene.walls.has(this.scene.tileKey(tile.x, tile.y))
  }

  worldToTile(x: number, y: number) {
    return { x: Math.floor(x / TILE_SIZE), y: Math.floor(y / TILE_SIZE) }
  }

  tileCenter(tile: number): number {
    return tile * TILE_SIZE + TILE_SIZE / 2
  }

  tileKey(x: number, y: number): string {
    return `${x},${y}`
  }
}
