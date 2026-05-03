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

const COMPANIONMANAGER_METHODS = [
  "createPlayer",
  "createPetFollower",
  "updatePetFollower",
  "createMiraCompanion",
  "updateMiraCompanion",
  "createCompanion",
  "updateCompanions",
  "playCompanionAnimation",
  "directionFromVector",
  "getNearestEnemy",
  "getLowestHpPartyMember",
  "updateCompanionBars",
  "getFollowerOffset",
  "updateWalkDust",
  "updateMiraNpcFacing",
  "createGeneratedAnimations",
  "updatePlayerAnimation"
] as const

export class CompanionManager {
  private scene: SceneAccess

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
  }

  install(): void {
    for (const method of COMPANIONMANAGER_METHODS) {
      this.scene[method] = (this as unknown as Record<string, (...args: any[]) => any>)[method].bind(this)
    }
  }

  createPlayer(x: number, y: number): Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle {
    if (hasTexture(this.scene, GENERATED_ASSETS.heroes.nara)) {
      const player = this.scene.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setScale(ENTITY_SCALE.hero).setDepth(11)
      player.play('nara-idle-down')
      return player
    }
    return this.scene.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  createPetFollower(x: number, y: number) {
    if (!this.scene.saveData.pet.unlocked) {
      this.scene.petFollower = undefined
      return
    }
    const pip = this.scene.add.container(x, y).setDepth(10.5).setName('companion:pip')
    pip.add(this.scene.add.circle(0, 0, 12, 0xf2d16b, 0.2))
    pip.add(this.scene.add.circle(0, 0, 6, 0xf2d16b, 0.95).setStrokeStyle(2, 0xfff1a8, 0.72))
    pip.add(this.scene.add.circle(-2, -2, 2, 0xfff4df, 0.92))
    this.scene.petFollower = pip
    this.scene.pipBobTween = this.scene.tweens.add({ targets: pip, y: y - 7, yoyo: true, repeat: -1, duration: 600, ease: 'Sine.easeInOut' })
  }

  updatePetFollower(isMoving: boolean) {
    if (!this.scene.petFollower || !this.scene.player) {
      return
    }
    this.scene.pipIdleAngle += isMoving ? 0.025 : 0.055
    const orbitX = isMoving ? 0 : Math.cos(this.scene.pipIdleAngle) * 28
    const orbitY = isMoving ? 0 : Math.sin(this.scene.pipIdleAngle) * 12
    const side = this.scene.facing === 'left' ? 26 : this.scene.facing === 'right' ? -26 : -20
    this.scene.petFollower.x += (this.scene.player.x + side + orbitX - this.scene.petFollower.x) * 0.075
    this.scene.petFollower.y += (this.scene.player.y + 18 + orbitY - this.scene.petFollower.y) * 0.075
    if (this.scene.pipBobTween) {
      this.scene.pipBobTween.setTimeScale(isMoving ? 1.45 : 1)
    }
  }

  createMiraCompanion(x: number, y: number) {
    if (!this.scene.flag('mira_recruited') || this.scene.busy) {
      this.scene.miraCompanion = undefined
      return
    }
    const companion = this.scene.add.container(x, y).setDepth(10.45).setName('companion:mira')
    companion.add(this.scene.add.circle(0, 0, 11, 0x7fd8ff, 0.92).setStrokeStyle(2, 0xfff1a8, 0.7))
    companion.add(this.scene.add.text(0, -23, 'Mira', { color: '#d7f6ff', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 3, y: 1 } }).setOrigin(0.5))
    this.scene.miraCompanion = companion
  }

  updateMiraCompanion() {
    if (!this.scene.flag('mira_recruited') || !this.scene.player || this.scene.busy) {
      this.scene.miraCompanion?.setVisible(false)
      return
    }
    if (!this.scene.miraCompanion) {
      this.scene.createMiraCompanion(this.scene.player.x + 28, this.scene.player.y + 18)
    }
    this.scene.miraCompanion?.setVisible(true)
    const offset = this.scene.getFollowerOffset(false)
    this.scene.miraCompanion!.x += (this.scene.player.x + offset.x - this.scene.miraCompanion!.x) * 0.07
    this.scene.miraCompanion!.y += (this.scene.player.y + offset.y - this.scene.miraCompanion!.y) * 0.07
  }

  createCompanion(partyIndex: number): PartyCompanion | null {
    if (!this.scene.player) return null
    const member = this.scene.saveData.party[partyIndex]
    if (!member) return null
    const character = CHARACTERS[member.characterId]
    if (!character) return null

    const isKael = member.characterId === 'kael'
    const offsetX = isKael ? -40 : -60
    const offsetY = isKael ? -16 : -34
    const x = this.scene.player.x + offsetX
    const y = this.scene.player.y + offsetY
    const container = this.scene.add.container(x, y).setDepth(10.5).setName(`companion:${member.characterId}`)
    const companionVisualScale = ENTITY_SCALE.companion / 0.58
    const companionBodySize = 32 * companionVisualScale
    const body = this.scene.add.rectangle(0, 0, companionBodySize, companionBodySize, isKael ? 0x5c8a4d : 0x7fb3ff, 0.94)
      .setStrokeStyle(2, isKael ? 0xb8d8a8 : 0xe0f2fe, 0.78)
      .setVisible(false)
    const textureKey = member.characterId === 'kael' ? GENERATED_ASSETS.heroes.kael : member.characterId === 'io' ? GENERATED_ASSETS.heroes.io : null
    const aura = this.scene.add.circle(0, 14 * companionVisualScale, 20 * companionVisualScale, isKael ? 0x55d27a : 0x60a5fa, 0.16).setStrokeStyle(3, isKael ? 0x86efac : 0x93c5fd, 0.72)
    const sprite = textureKey && hasTexture(this.scene, textureKey) ? this.scene.add.sprite(0, 0, textureKey, 0).setScale(ENTITY_SCALE.companion).setDepth(10.51) : undefined
    const fallbackVisuals: Phaser.GameObjects.GameObject[] = sprite ? [] : [
      this.scene.add.rectangle(0, 0, companionBodySize, companionBodySize, isKael ? 0x5c8a4d : 0x7fb3ff, 0.96).setStrokeStyle(2, isKael ? 0xd9f7c8 : 0xe0f2fe, 0.8),
      this.scene.add.rectangle(0, -5 * companionVisualScale, 22 * companionVisualScale, 10 * companionVisualScale, isKael ? 0x79b35f : 0xbfe3ff, 0.62),
      this.scene.add.rectangle((isKael ? -8 : 8) * companionVisualScale, 7 * companionVisualScale, 6 * companionVisualScale, 12 * companionVisualScale, isKael ? 0x314d2b : 0x2563eb, 0.72),
      this.scene.add.circle((isKael ? 8 : -8) * companionVisualScale, -8 * companionVisualScale, 4 * companionVisualScale, 0xfff1a8, 0.84),
    ]
    const nameText = this.scene.add.text(0, -25, character.name, { color: isKael ? '#d9f7c8' : '#dbeafe', fontFamily: 'Arial, sans-serif', fontSize: '10px', backgroundColor: '#070914aa', padding: { x: 3, y: 1 } }).setOrigin(0.5)
    const hpBarBg = this.scene.add.graphics().setDepth(10.55)
    const hpBar = this.scene.add.graphics().setDepth(10.56)
    const mpBar = this.scene.add.graphics().setDepth(10.57)
    container.add(sprite ? [aura, body, sprite, nameText] : [aura, body, ...fallbackVisuals, nameText])
    this.scene.tweens.add({ targets: aura, scaleX: 1.12, scaleY: 1.08, alpha: 0.34, yoyo: true, repeat: -1, duration: isKael ? 900 : 1100, ease: 'Sine.easeInOut' })

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
    this.scene.updateCompanionBars(companion)
    return companion
  }

  updateCompanions() {
    if (!this.scene.player) return
    this.scene.companions.forEach((companion) => {
      const member = this.scene.saveData.party[companion.partyIndex]
      if (!member) return
      companion.state = member.currentHp <= 0 ? 'dead' : 'follow'
      if (companion.state === 'dead') {
        companion.container.setAlpha(0.3)
        this.scene.updateCompanionBars(companion)
        return
      }

      companion.container.setAlpha(1)
      const attackRange = companion.characterId === 'io' ? 200 : 55
      const nearestEnemy = this.scene.getNearestEnemy(companion.x, companion.y, companion.characterId === 'io' ? 200 : 180)

      if (companion.characterId === 'kael' && nearestEnemy) {
        const distance = Phaser.Math.Distance.Between(companion.x, companion.y, nearestEnemy.x, nearestEnemy.y)
        if (distance > attackRange) {
          const previousX = companion.x
          const previousY = companion.y
          const nextX = Phaser.Math.Linear(companion.x, nearestEnemy.x, 0.05)
          const nextY = Phaser.Math.Linear(companion.y, nearestEnemy.y, 0.05)
          if (!this.scene.isWallAtWorld(nextX, companion.y)) companion.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
          if (!this.scene.isWallAtWorld(companion.x, nextY)) companion.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
          if (companion.sprite) this.scene.playCompanionAnimation(companion, true, companion.x - previousX, companion.y - previousY)
          companion.container.setPosition(companion.x, companion.y)
          this.scene.updateCompanionBars(companion)
          return
        }
        if (this.scene.time.now - companion.lastAttackTime >= companion.attackCooldown) {
          const stats = this.scene.scaleCharacterStats(CHARACTERS.kael, member.level)
          const damage = CombatSystem.calculateRealtimePlayerDamage(stats.atk, nearestEnemy.stats.def)
          const angle = Phaser.Math.Angle.Between(companion.x, companion.y, nearestEnemy.x, nearestEnemy.y)
          const swing = this.scene.add.arc(nearestEnemy.x, nearestEnemy.y, 24, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0xff9f1c, 0.38).setDepth(25).setStrokeStyle(4, 0xffd166, 0.8)
          this.scene.tweens.add({ targets: swing, alpha: 0, duration: 180, onComplete: () => swing.destroy() })
          this.scene.spawnKaelSlash(companion, nearestEnemy)
          if (companion.sprite) companion.sprite.play(`${companion.characterId}-attack-${this.scene.directionFromVector(nearestEnemy.x - companion.x, nearestEnemy.y - companion.y)}`, true)
          this.scene.tweens.add({ targets: companion.body, scale: ENTITY_SCALE.hero * 1.6, yoyo: true, duration: 75 })
          nearestEnemy.currentHp = Math.max(0, nearestEnemy.currentHp - damage)
          nearestEnemy.hitFlashTimer = 120
          nearestEnemy.body.setFillStyle(0xffffff)
          this.scene.showDamageNumber(nearestEnemy.x, nearestEnemy.y - 22, damage, 'player')
          this.scene.updateEnemyBars(nearestEnemy)
          companion.lastAttackTime = this.scene.time.now
          if (nearestEnemy.currentHp <= 0) this.scene.killEnemy(nearestEnemy)
          this.scene.persist()
        }
        companion.container.setPosition(companion.x, companion.y)
        this.scene.updateCompanionBars(companion)
        return
      }

      if (companion.characterId === 'io') {
        const healTarget = this.scene.getLowestHpPartyMember()
        if (healTarget && healTarget.hpRatio < 0.5 && member.currentMp >= 6 && this.scene.time.now - companion.lastSkillTime > 2500) {
          const previousHp = healTarget.member.currentHp
          healTarget.member.currentHp = Math.min(healTarget.maxHp, healTarget.member.currentHp + 24)
          member.currentMp = Math.max(0, member.currentMp - 6)
          const targetCompanion = this.scene.companions.find((entry) => entry.partyIndex === healTarget.partyIndex)
          const healX = healTarget.partyIndex === 0 ? this.scene.player!.x : targetCompanion?.x ?? companion.x
          const healY = healTarget.partyIndex === 0 ? this.scene.player!.y : targetCompanion?.y ?? companion.y
          this.scene.showDamageNumber(healX, healY - 28, 24, 'heal')
          this.scene.spawnHealSparkles(healX, healY)
          this.scene.spawnHealPulse(healX, healY)
          companion.lastSkillTime = this.scene.time.now
          if (previousHp <= 0 && targetCompanion) {
            targetCompanion.state = 'follow'
            targetCompanion.container.setAlpha(1)
          }
          this.scene.refreshHud()
          this.scene.updatePlayerBars()
          this.scene.updateCompanionBars(companion)
          this.scene.persist()
          companion.container.setPosition(companion.x, companion.y)
          return
        }
        if (nearestEnemy && this.scene.time.now - companion.lastAttackTime >= companion.attackCooldown) {
          const stats = this.scene.scaleCharacterStats(CHARACTERS.io, member.level)
          const projectile = this.scene.add.circle(companion.x, companion.y, 5, 0x60a5fa, 0.9).setDepth(25).setStrokeStyle(2, 0xbfdbfe, 0.8)
          companion.lastAttackTime = this.scene.time.now
          let trailDrops = 0
          this.scene.tweens.add({
            targets: projectile,
            x: nearestEnemy.x,
            y: nearestEnemy.y,
            duration: 300,
            onUpdate: () => {
              if (trailDrops >= 3 || !projectile.active) return
              trailDrops += 1
              const trail = this.scene.add.circle(projectile.x, projectile.y, 4, 0x93c5fd, 0.42).setDepth(24)
              this.scene.tweens.add({ targets: trail, alpha: 0, scale: ENTITY_SCALE.enemy * 0.64, duration: 220, onComplete: () => trail.destroy() })
            },
            onComplete: () => {
              projectile.destroy()
              if (nearestEnemy.dead) return
              const damage = Math.max(1, Math.round(CombatSystem.calculateRealtimePlayerDamage(stats.mag, nearestEnemy.stats.def) * 0.7))
              nearestEnemy.currentHp = Math.max(0, nearestEnemy.currentHp - damage)
              nearestEnemy.hitFlashTimer = 120
              nearestEnemy.body.setFillStyle(0xffffff)
              this.scene.showDamageNumber(nearestEnemy.x, nearestEnemy.y - 22, damage, 'player')
              this.scene.updateEnemyBars(nearestEnemy)
              if (nearestEnemy.currentHp <= 0) this.scene.killEnemy(nearestEnemy)
              this.scene.persist()
            },
          })
          this.scene.persist()
          companion.container.setPosition(companion.x, companion.y)
          this.scene.updateCompanionBars(companion)
          return
        }
      }

      const targetX = this.scene.player!.x + companion.offsetX
      const targetY = this.scene.player!.y + companion.offsetY
      const previousX = companion.x
      const previousY = companion.y
      const nextX = Phaser.Math.Linear(companion.x, targetX, 0.12)
      const nextY = Phaser.Math.Linear(companion.y, targetY, 0.12)
      if (!this.scene.isWallAtWorld(nextX, companion.y)) companion.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
      if (!this.scene.isWallAtWorld(companion.x, nextY)) companion.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
      if (companion.sprite) {
        const moving = Phaser.Math.Distance.Between(previousX, companion.y, companion.x, companion.y) > 0.2 || Phaser.Math.Distance.Between(companion.x, companion.y, targetX, targetY) > 3
        companion.sprite.y = Math.sin(this.scene.time.now * 0.005 + companion.bobSeed) * 2
        this.scene.playCompanionAnimation(companion, moving, companion.x - previousX, companion.y - previousY)
      }
      companion.container.setPosition(companion.x, companion.y)
      this.scene.updateCompanionBars(companion)
    })
  }

  playCompanionAnimation(companion: PartyCompanion, moving: boolean, deltaX: number, deltaY: number) {
    if (!companion.sprite) return
    if (companion.sprite.anims.currentAnim?.key?.includes('-attack-') && companion.sprite.anims.isPlaying) return
    const direction = this.scene.directionFromVector(deltaX, deltaY)
    const animKey = `${companion.characterId}-${moving ? 'walk' : 'idle'}-${direction}`
    if (this.scene.anims.exists(animKey) && companion.sprite.anims.currentAnim?.key !== animKey) companion.sprite.play(animKey)
  }

  directionFromVector(deltaX: number, deltaY: number): Direction {
    if (Math.abs(deltaX) > Math.abs(deltaY)) return deltaX < 0 ? 'left' : 'right'
    if (Math.abs(deltaY) > 0.1) return deltaY < 0 ? 'up' : 'down'
    return 'down'
  }

  getNearestEnemy(x: number, y: number, maxDistance: number): MapEnemy | null {
    let nearest: MapEnemy | null = null
    let nearestDistance = maxDistance
    this.scene.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y)
      if (distance <= nearestDistance) {
        nearest = enemy
        nearestDistance = distance
      }
    })
    return nearest
  }

  getLowestHpPartyMember(): { member: SaveData['party'][number]; partyIndex: number; maxHp: number; hpRatio: number } | null {
    let lowest: { member: SaveData['party'][number]; partyIndex: number; maxHp: number; hpRatio: number } | null = null
    this.scene.saveData.party.slice(0, 3).forEach((member, partyIndex) => {
      const character = CHARACTERS[member.characterId]
      if (!character) return
      const stats = this.scene.scaleCharacterStats(character, member.level)
      const hpRatio = stats.hp > 0 ? member.currentHp / stats.hp : 1
      if (!lowest || hpRatio < lowest.hpRatio) lowest = { member, partyIndex, maxHp: stats.hp, hpRatio }
    })
    return lowest
  }

  updateCompanionBars(companion: PartyCompanion) {
    const member = this.scene.saveData.party[companion.partyIndex]
    const character = member ? CHARACTERS[member.characterId] : undefined
    if (!member || !character) return
    const stats = this.scene.scaleCharacterStats(character, member.level)
    const width = 32
    const x = companion.x - width / 2
    companion.hpBarBg.clear().fillStyle(0x050509, 0.75).fillRect(x, companion.y - 20, width, 3)
    companion.hpBar.clear().fillStyle(0x4ade80, 1).fillRect(x, companion.y - 20, width * Phaser.Math.Clamp(member.currentHp / stats.hp, 0, 1), 3)
    companion.mpBar.clear().fillStyle(0x60a5fa, 1).fillRect(x, companion.y - 16, width * Phaser.Math.Clamp(member.currentMp / stats.mp, 0, 1), 3)
  }

  getFollowerOffset(forPip: boolean) {
    const distance = TILE_SIZE * 0.78
    const offsets: Record<Direction, { x: number; y: number }> = {
      up: { x: forPip ? -24 : 24, y: distance },
      down: { x: forPip ? -24 : 24, y: -distance },
      left: { x: distance, y: forPip ? 18 : -18 },
      right: { x: -distance, y: forPip ? 18 : -18 },
    }
    return offsets[this.scene.facing]
  }

  updateWalkDust(delta: number, isMoving: boolean) {
    this.scene.dustCooldown -= delta
    if (!isMoving || !this.scene.player || this.scene.dustCooldown > 0) {
      return
    }
    this.scene.dustCooldown = 300
    const dust = this.scene.add.circle(this.scene.player.x + Phaser.Math.Between(-7, 7), this.scene.player.y + 22, 4, 0xd0c8b8, 0.3).setDepth(10.2).setName('ambient:walk-dust')
    this.scene.tweens.add({ targets: dust, scale: ENTITY_SCALE.object * 2.5, alpha: 0, duration: 300, ease: 'Sine.easeOut', onComplete: () => dust.destroy() })
  }

  updateMiraNpcFacing() {
    const mira = this.scene.npcActors.mira
    if (!mira || !this.scene.player) {
      return
    }
    const distance = Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, this.scene.tileCenter(ALLY_TILE.x), this.scene.tileCenter(ALLY_TILE.y))
    if (distance <= TILE_SIZE * 3 && 'scaleX' in mira) {
      const transform = mira as unknown as Phaser.GameObjects.Components.Transform
      transform.scaleX = this.scene.player.x < this.scene.tileCenter(ALLY_TILE.x) ? -Math.abs(transform.scaleX) : Math.abs(transform.scaleX)
    }
  }

  createGeneratedAnimations() {
    if (hasTexture(this.scene, GENERATED_ASSETS.heroes.nara)) {
      for (const direction of Object.keys(HERO_ANIM_ROWS) as Direction[]) {
        const row = HERO_ANIM_ROWS[direction]
        if (!this.scene.anims.exists(`nara-walk-${direction}`)) {
          this.scene.anims.create({ key: `nara-walk-${direction}`, frames: this.scene.anims.generateFrameNumbers(GENERATED_ASSETS.heroes.nara, { start: row * 4, end: row * 4 + 3 }), frameRate: 7, repeat: -1 })
        }
        if (!this.scene.anims.exists(`nara-idle-${direction}`)) {
          this.scene.anims.create({ key: `nara-idle-${direction}`, frames: [{ key: GENERATED_ASSETS.heroes.nara, frame: row * 4 }], frameRate: 1 })
        }
        if (!this.scene.anims.exists(`nara-attack-${direction}`)) {
          this.scene.anims.create({ key: `nara-attack-${direction}`, frames: this.scene.anims.generateFrameNumbers(GENERATED_ASSETS.heroes.nara, { start: row * 4 + 1, end: row * 4 + 3 }), frameRate: 14, repeat: 0 })
        }
      }
    }
    for (const [characterId, assetKey] of Object.entries({ kael: GENERATED_ASSETS.heroes.kael, io: GENERATED_ASSETS.heroes.io })) {
      if (!hasTexture(this.scene, assetKey)) continue
      for (const direction of Object.keys(HERO_ANIM_ROWS) as Direction[]) {
        const row = HERO_ANIM_ROWS[direction]
        if (!this.scene.anims.exists(`${characterId}-walk-${direction}`)) {
          this.scene.anims.create({ key: `${characterId}-walk-${direction}`, frames: this.scene.anims.generateFrameNumbers(assetKey, { start: row * 4, end: row * 4 + 3 }), frameRate: 7, repeat: -1 })
        }
        if (!this.scene.anims.exists(`${characterId}-idle-${direction}`)) {
          this.scene.anims.create({ key: `${characterId}-idle-${direction}`, frames: [{ key: assetKey, frame: row * 4 }], frameRate: 1 })
        }
        if (!this.scene.anims.exists(`${characterId}-attack-${direction}`)) {
          this.scene.anims.create({ key: `${characterId}-attack-${direction}`, frames: this.scene.anims.generateFrameNumbers(assetKey, { start: row * 4 + 1, end: row * 4 + 3 }), frameRate: 13, repeat: 0 })
        }
      }
    }
    for (const assetKey of [GENERATED_ASSETS.npcs.guideRin, GENERATED_ASSETS.npcs.elderMaelin, GENERATED_ASSETS.npcs.peddler, GENERATED_ASSETS.npc]) {
      if (hasTexture(this.scene, assetKey) && !this.scene.anims.exists(`idle-${assetKey}`)) {
        this.scene.anims.create({ key: `idle-${assetKey}`, frames: this.scene.anims.generateFrameNumbers(assetKey, { start: 0, end: 1 }), frameRate: 1.6, repeat: -1 })
      }
    }
  }

  updatePlayerAnimation(isMoving: boolean) {
    if (!(this.scene.player instanceof Phaser.GameObjects.Sprite)) {
      return
    }
    const key = `nara-${isMoving ? 'walk' : 'idle'}-${this.scene.facing}`
    if (this.scene.player.anims.currentAnim?.key?.startsWith('nara-attack') && this.scene.player.anims.isPlaying) {
      return
    }
    if (this.scene.player.anims.currentAnim?.key !== key) {
      this.scene.player.play(key)
    }
  }
}
