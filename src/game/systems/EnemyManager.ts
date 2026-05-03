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

const ENEMYMANAGER_METHODS = [
  "spawnTutorialEnemy",
  "handleTutorialEnemyKilled",
  "spawnTrainingSparkle",
  "spawnEnemiesForStage",
  "spawnRegularEnemiesForStage",
  "getNgPlusStageSpawns",
  "spawnRandomRegularEnemyForStage",
  "spawnMinibossForStage",
  "spawnStoryBoss",
  "spawnMapEnemy",
  "createEnemyVisual",
  "updateMapEnemies",
  "getNearestCompanion",
  "updateEnemyWander",
  "moveEnemyToward",
  "performPlayerAttack",
  "autoAimNearestEnemy",
  "updatePromptLearning",
  "canStartPlayerAttack",
  "resolvePlayerAttackContact",
  "updateAttackState",
  "damageEnemy",
  "useRealtimeSkill",
  "flashUnavailableSkill",
  "performEmberSlash",
  "performTidalHeal",
  "performStoneGuard",
  "performWindStep",
  "tryEnemyAttack",
  "showEnemyTelegraph",
  "updateBossPhase",
  "tryEnemyAttackCompanion",
  "killEnemy",
  "completeOverworldBattle",
  "destroyEnemy",
  "spawnGroundLoot",
  "updateGroundLoot",
  "pickupGroundLoot",
  "destroyGroundLoot",
  "gainRealtimeExp",
  "checkRespawnTimer",
  "registerComboKill",
  "getComboColor",
  "getComboDamageMultiplier",
  "spawnDeathExplosion",
  "spawnBossExplosion",
  "spawnKaelSlash",
  "spawnHealSparkles",
  "getEnemyColor",
  "startDash",
  "updateDashTrail",
  "spawnDashDust",
  "handleDashWallSlide",
  "cancelDashRecoveryAfterHit",
  "bufferInput",
  "consumeInputBuffer",
  "updateCameraFeel",
  "showDashReady",
  "triggerHitstop",
  "startPlayerBlink",
  "triggerSlowMo",
  "useHealthPotion",
  "performPerfectBlock",
  "getPlayerCombatStats",
  "updateShieldVisual",
  "showBlockFlash",
  "showDamageDirection",
  "updateFacingFromVector",
  "facingToAngle",
  "showBossIntro"
] as const

export class EnemyManager {
  private scene: SceneAccess

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
  }

  install(): void {
    for (const method of ENEMYMANAGER_METHODS) {
      this.scene[method] = (this as unknown as Record<string, (...args: any[]) => any>)[method].bind(this)
    }
  }

  spawnTutorialEnemy(role: MapEnemy['tutorialRole']) {
    if (!this.scene.player || !role) return
    const angle = this.scene.facingToAngle()
    const tile = this.scene.worldToTile(
      this.scene.player.x + Math.cos(angle) * (role === 'step1' ? 120 : 150),
      this.scene.player.y + Math.sin(angle) * (role === 'step1' ? 120 : 150),
    )
    const fallback = this.scene.worldToTile(this.scene.player.x + 120, this.scene.player.y)
    const spawnTile = this.scene.isWallAtWorld(this.scene.tileCenter(tile.x), this.scene.tileCenter(tile.y)) ? fallback : tile
    const enemyId = role === 'step3' ? 'ash_slime' : 'ash_slime'
    this.scene.spawnMapEnemy(enemyId, spawnTile.x, spawnTile.y, false, `tutorial-${role}-${this.scene.time.now}`, undefined, {
      tutorialRole: role,
      hpMultiplier: role === 'step1' ? 0.5 : 1,
      noRewards: true,
    })
  }

  handleTutorialEnemyKilled(enemy: MapEnemy) {
    if (!enemy.tutorialRole) return
    if (enemy.tutorialRole === 'step1' && this.scene.tutorialState === 'step1-kill') {
      this.scene.showToast('Well done! Hold SHIFT to dash.')
      this.scene.time.delayedCall(650, () => {
        this.scene.tutorialState = 'step2-dash'
        this.scene.tutorialStepStartedAt = this.scene.time.now
        this.scene.showTutorialOverlay('Hold SHIFT + move to dash')
        this.scene.spawnTutorialEnemy('step2')
      })
      return
    }
    if (enemy.tutorialRole === 'step2' && this.scene.tutorialState === 'step2-dash') {
      this.scene.showToast('Hold F to block attacks.')
      this.scene.time.delayedCall(650, () => {
        this.scene.tutorialState = 'step3-block'
        this.scene.tutorialStepStartedAt = this.scene.time.now
        this.scene.showTutorialOverlay('Hold F to block - time it right for a parry!')
        this.scene.spawnTutorialEnemy('step3')
      })
      return
    }
    if (enemy.tutorialRole === 'step3' && this.scene.tutorialState === 'step3-block') {
      this.scene.completeFirstCombatTutorial()
    }
  }

  spawnTrainingSparkle(x: number, y: number) {
    for (let index = 0; index < 8; index += 1) {
      const sparkle = this.scene.add.circle(x + Phaser.Math.Between(-10, 10), y + Phaser.Math.Between(-10, 10), 3, 0x60a5fa, 0.9).setDepth(30)
      this.scene.tweens.add({ targets: sparkle, y: sparkle.y - Phaser.Math.Between(18, 38), alpha: 0, scale: ENTITY_SCALE.object * 0.4, duration: 520, ease: 'Sine.easeOut', onComplete: () => sparkle.destroy() })
    }
  }

  spawnEnemiesForStage() {
    this.scene.mapEnemies.forEach((enemy) => this.scene.destroyEnemy(enemy))
    this.scene.mapEnemies = []
    if (this.scene.saveData.stage === 'homecoming') return
    if (this.scene.shouldRunFirstCombatTutorial()) return
    this.scene.spawnRegularEnemiesForStage()
    if (!this.scene.flag('field_battle_won') && (this.scene.saveData.currentObjective === OBJECTIVES.winBattle || this.scene.flag('field_marker_seen'))) {
      this.scene.spawnStoryBoss('clay_sentinel', MARKER_TILE, FIELD_BATTLE_ID)
    }
    if (this.scene.flag('archive_entered') && !this.scene.flag('archive_skirmish_won')) {
      this.scene.spawnStoryBoss('storm_wisp', ARCHIVE_TILE, ARCHIVE_SKIRMISH_ID)
    }
  }

  spawnRegularEnemiesForStage() {
    const regularByStage: Record<SaveData['stage'], Array<{ ids: string[]; x: number; y: number }>> = {
      quay: [
        { ids: ['ash_slime'], x: 5, y: 6 }, { ids: ['ash_slime', 'frost_shard', 'vinecrawler'], x: 8, y: 10 }, { ids: ['ash_slime', 'frost_shard'], x: 12, y: 13 }, { ids: ['vinecrawler', 'ash_slime'], x: 18, y: 10 }, { ids: ['storm_wisp', 'hollow_wisp', 'clay_sentinel'], x: 31, y: 7 },
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
    const stageSpawns = this.scene.saveData.ngPlusLevel > 0 ? this.scene.getNgPlusStageSpawns(regularByStage[this.scene.saveData.stage]) : regularByStage[this.scene.saveData.stage]
    stageSpawns.forEach((spawn, index) => this.scene.spawnMapEnemy(spawn.ids[Phaser.Math.Between(0, spawn.ids.length - 1)], spawn.x, spawn.y, false, `${this.scene.saveData.stage}-${index}`))
    for (let attempt = 0; attempt < REGULAR_ENEMY_TARGET_COUNT && this.scene.mapEnemies.filter((enemy) => !enemy.isBoss && !enemy.dead).length < REGULAR_ENEMY_TARGET_COUNT; attempt += 1) {
      this.scene.spawnRandomRegularEnemyForStage()
    }
    this.scene.spawnMinibossForStage()
  }

  getNgPlusStageSpawns(spawns: Array<{ ids: string[]; x: number; y: number }>) {
    const seed = this.scene.saveData.ngPlusLevel * 97 + this.scene.saveData.stage.length * 31
    return spawns.map((spawn, index) => {
      const target = spawns[(index + seed) % spawns.length] ?? spawn
      const offsetX = ((seed + index * 5) % 5) - 2
      const offsetY = ((seed + index * 7) % 5) - 2
      return {
        ...spawn,
        x: Phaser.Math.Clamp(target.x + offsetX, 2, MAP_WIDTH - 3),
        y: Phaser.Math.Clamp(target.y + offsetY, 2, MAP_HEIGHT - 3),
      }
    })
  }

  spawnRandomRegularEnemyForStage() {
    const spawnPool: Record<SaveData['stage'], string[]> = {
      quay: ['ash_slime', 'frost_shard', 'vinecrawler', 'storm_wisp'],
      field: ['ash_slime', 'frost_shard', 'vinecrawler', 'moss_knight', 'sporefiend', 'glass_scorpion'],
      shrine: ['frost_shard', 'storm_wisp', 'hollow_wisp', 'clay_sentinel'],
      archive: ['vinecrawler', 'sporefiend', 'hollow_wisp', 'storm_wisp', 'archive_guardian'],
      skywell: ['hollow_wisp', 'storm_wisp', 'clay_sentinel', 'emberglass_wisp', 'memory_phantom', 'void_walker'],
      homecoming: [],
    }
    const ids = spawnPool[this.scene.saveData.stage]
    if (!ids.length) return
    for (let attempt = 0; attempt < 30; attempt += 1) {
      const tileX = Phaser.Math.Between(3, MAP_WIDTH - 4)
      const tileY = Phaser.Math.Between(3, MAP_HEIGHT - 4)
      const x = this.scene.tileCenter(tileX)
      const y = this.scene.tileCenter(tileY)
      if (this.scene.isWallAtWorld(x, y)) continue
      if (this.scene.player && Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, x, y) < 220) continue
      if (this.scene.mapEnemies.some((enemy) => !enemy.dead && Phaser.Math.Distance.Between(enemy.x, enemy.y, x, y) < 180)) continue
      this.scene.spawnMapEnemy(ids[Phaser.Math.Between(0, ids.length - 1)], tileX, tileY, false, `${this.scene.saveData.stage}-respawn-${this.scene.time.now}-${attempt}`)
      return
    }
  }

  spawnMinibossForStage() {
    const minibossByStage: Record<SaveData['stage'], { id: string; x: number; y: number } | null> = {
      quay: { id: 'clay_sentinel', x: 34, y: 10 },
      field: { id: 'moss_knight', x: 30, y: 12 },
      shrine: { id: 'hollow_wisp', x: 34, y: 8 },
      archive: { id: 'archive_guardian', x: 22, y: 23 },
      skywell: { id: 'skywell_guardian', x: 35, y: 25 },
      homecoming: null,
    }
    const miniboss = minibossByStage[this.scene.saveData.stage]
    if (!miniboss || this.scene.mapEnemies.some((enemy) => enemy.id === `${this.scene.saveData.stage}-miniboss` && !enemy.dead)) return
    this.scene.spawnMapEnemy(miniboss.id, miniboss.x, miniboss.y, true, `${this.scene.saveData.stage}-miniboss`)
  }

  spawnStoryBoss(enemyId: string, tile: { x: number; y: number }, battleId: string) {
    if (this.scene.mapEnemies.some((enemy) => enemy.battleId === battleId && !enemy.dead)) return
    this.scene.showBossIntro(enemyId)
    this.scene.spawnMapEnemy(enemyId, tile.x, tile.y, true, battleId, battleId)
  }

  spawnMapEnemy(enemyId: string, tileX: number, tileY: number, isBoss: boolean, uniqueId: string, battleId?: string, options: { tutorialRole?: MapEnemy['tutorialRole']; hpMultiplier?: number; noRewards?: boolean } = {}) {
    const data = ENEMIES_BY_ID[enemyId]
    if (!data) return
    const x = this.scene.tileCenter(tileX)
    const y = this.scene.tileCenter(tileY)
    const color = isBoss ? 0xb91c1c : enemyId === 'moonwake_guardian' ? 0x4da6ff : enemyId === 'thornheart' ? 0x3aa657 : enemyId === 'cartographers_lie' ? 0x8f63ff : data.region === 'moonwake' ? 0x8bd6ff : data.region === 'skywell' ? 0xbda7ff : 0x75c46b
    const size = isBoss ? 92 : 44
    const aura = isBoss || options.tutorialRole ? this.scene.add.circle(x, y, size * 0.72, options.tutorialRole ? 0x60a5fa : color, options.tutorialRole ? 0.22 : 0.18).setDepth(17).setStrokeStyle(4, options.tutorialRole ? 0x9ff3ff : 0xfff1a8, options.tutorialRole ? 0.62 : 0.26) : undefined
    const { container: sprite, body } = this.scene.createEnemyVisual(enemyId, x, y, color, isBoss)
    const targetScale = isBoss ? ENTITY_SCALE.bossEnemy : ENTITY_SCALE.enemy
    sprite.setAlpha(0).setScale(targetScale * 0.9)
    const hpBarBg = this.scene.add.graphics().setDepth(19)
    const hpBar = this.scene.add.graphics().setDepth(20)
    const nameText = this.scene.add.text(x, y - size, data.name, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '10px' }).setOrigin(0.5).setDepth(21)
    nameText.setAlpha(0)
    const isFirstEnemy = uniqueId === 'quay-0'
    const baseHp = isBoss ? data.stats.hp * 5 : isFirstEnemy ? Math.max(1, Math.floor(data.stats.hp * 0.5)) : data.stats.hp
    const bossAttackSpeedMultiplier = isBoss && this.scene.saveData.ngPlusLevel > 0 ? 0.8 : 1
    const hpMultiplier = (options.hpMultiplier ?? 1) * (options.tutorialRole ? 1 : this.scene.getNgPlusHpMultiplier())
    const stats = { ...data.stats, hp: Math.max(1, Math.round(baseHp * hpMultiplier)), atk: Math.max(1, Math.round((isBoss ? data.stats.atk * 2 : data.stats.atk) * 0.92 * (options.tutorialRole ? 1 : this.scene.getNgPlusDamageMultiplier()))) }
    const enemy: MapEnemy = { id: uniqueId, enemyId, sprite, body, aura, hpBar, hpBarBg, nameText, currentHp: stats.hp, maxHp: stats.hp, visualHp: stats.hp, visualHpTarget: stats.hp, currentMp: data.stats.mp, maxMp: data.stats.mp, stats, x, y, speed: isBoss ? 42 : isFirstEnemy || options.tutorialRole === 'step1' ? 36 : 55 + data.stats.spd, element: data.skills[0]?.element ?? 'neutral', weaknesses: data.weaknesses, resists: data.resists, skills: data.skills, state: 'idle', aggroRange: options.tutorialRole === 'step1' ? 90 : isBoss ? 340 : 240, attackRange: isBoss ? 78 : 50, attackCooldown: Math.round((isBoss ? 1450 : 1600) * bossAttackSpeedMultiplier), lastAttackTime: 0, wanderTimer: 0, wanderTarget: null, hitFlashTimer: 0, isBoss, dead: false, expReward: options.noRewards ? 0 : isBoss ? data.expReward * 5 : Math.ceil(data.expReward * 1.25), goldReward: options.noRewards ? 0 : Math.ceil((isBoss ? data.goldReward * 3 : data.goldReward) * this.scene.getNgPlusGoldMultiplier()), battleId, bossPhase: isBoss ? 1 : undefined, tutorialRole: options.tutorialRole, noRewards: options.noRewards }
    this.scene.mapEnemies.push(enemy)
    this.scene.updateEnemyBars(enemy)
    this.scene.tweens.add({ targets: sprite, alpha: 0.95, scale: targetScale, duration: 400, ease: 'Back.easeOut' })
    this.scene.tweens.add({ targets: sprite, scale: targetScale * 1.02, yoyo: true, repeat: -1, duration: 750, ease: 'Sine.easeInOut' })
    if (aura) this.scene.tweens.add({ targets: aura, scale: ENTITY_SCALE.object * 1.87, alpha: 0.08, yoyo: true, repeat: -1, duration: 900, ease: 'Sine.easeInOut' })
    this.scene.tweens.add({ targets: nameText, alpha: 1, duration: 320 })
    if (isBoss) this.scene.createBossHud(enemy)
  }

  createEnemyVisual(enemyId: string, x: number, y: number, color: number, isBoss: boolean) {
    const container = this.scene.add.container(x, y).setDepth(18).setName(`enemy:${enemyId}`)
    const scale = isBoss ? 1.55 : 1
    const shadow = this.scene.add.ellipse(0, 20 * scale, 42 * scale, 14 * scale, 0x050713, 0.34)
    const body = this.scene.add.ellipse(0, 0, 34 * scale, 40 * scale, color, 0.96).setStrokeStyle(isBoss ? 4 : 2, isBoss ? 0xfff1a8 : 0xffffff, isBoss ? 0.72 : 0.38)
    const eyeColor = enemyId.includes('moon') ? 0xc7f9ff : enemyId.includes('thorn') ? 0xfff1a8 : enemyId.includes('cartographer') ? 0xf0abfc : 0xffef9f
    const details: Phaser.GameObjects.GameObject[] = [shadow]

    if (enemyId.includes('thorn') || enemyId.includes('sprig') || enemyId.includes('root')) {
      details.push(this.scene.add.triangle(-12 * scale, -19 * scale, 0, 16, 8, -12, 16, 16, 0x173b20, 0.9))
      details.push(this.scene.add.triangle(12 * scale, -19 * scale, 0, 16, 8, -12, 16, 16, 0x173b20, 0.9))
      details.push(this.scene.add.rectangle(-19 * scale, 5 * scale, 14 * scale, 5 * scale, 0x2f7d3f, 0.85).setRotation(-0.55))
      details.push(this.scene.add.rectangle(19 * scale, 5 * scale, 14 * scale, 5 * scale, 0x2f7d3f, 0.85).setRotation(0.55))
    } else if (enemyId.includes('moon') || enemyId.includes('tide')) {
      details.push(this.scene.add.arc(-20 * scale, 1 * scale, 18 * scale, 292, 68, false, 0x9bdcff, 0.2).setStrokeStyle(5 * scale, 0xc7f9ff, 0.72))
      details.push(this.scene.add.arc(20 * scale, 1 * scale, 18 * scale, 112, 248, false, 0x9bdcff, 0.2).setStrokeStyle(5 * scale, 0xc7f9ff, 0.72))
      details.push(this.scene.add.ellipse(0, 12 * scale, 22 * scale, 6 * scale, 0xe0f2fe, 0.28))
    } else if (enemyId.includes('cartographer') || enemyId.includes('sky')) {
      details.push(this.scene.add.triangle(0, -27 * scale, 0, -16, 10, 8, -10, 8, 0x2e1065, 0.95))
      details.push(this.scene.add.circle(-18 * scale, -6 * scale, 6 * scale, 0xbda7ff, 0.42))
      details.push(this.scene.add.circle(18 * scale, -6 * scale, 6 * scale, 0xbda7ff, 0.42))
      details.push(this.scene.add.rectangle(0, 16 * scale, 26 * scale, 4 * scale, 0xf0abfc, 0.45).setRotation(0.28))
    } else {
      details.push(this.scene.add.triangle(-12 * scale, -22 * scale, 0, 16, 8, -10, 16, 16, 0x3b2417, 0.92))
      details.push(this.scene.add.triangle(12 * scale, -22 * scale, 0, 16, 8, -10, 16, 16, 0x3b2417, 0.92))
      details.push(this.scene.add.arc(0, 9 * scale, 16 * scale, 20, 160, false, 0xffd166, 0).setStrokeStyle(3 * scale, 0xffd166, 0.55))
    }

    details.push(body)
    details.push(this.scene.add.circle(-7 * scale, -5 * scale, 3.5 * scale, eyeColor, 0.98))
    details.push(this.scene.add.circle(7 * scale, -5 * scale, 3.5 * scale, eyeColor, 0.98))
    details.push(this.scene.add.circle(-6 * scale, -6 * scale, 1.2 * scale, 0x111827, 0.95))
    details.push(this.scene.add.circle(8 * scale, -6 * scale, 1.2 * scale, 0x111827, 0.95))
    container.add(details)
    return { container, body }
  }

  updateMapEnemies(delta: number) {
    if (!this.scene.player) return
    const seconds = delta / 1000
    this.scene.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      if ((enemy.staggeredUntil ?? 0) > this.scene.time.now) {
        enemy.state = 'hurt'
        enemy.sprite.setPosition(enemy.x, enemy.y)
        enemy.aura?.setPosition(enemy.x, enemy.y)
        this.scene.updateEnemyBars(enemy)
        return
      }
      if ((enemy.recoveringUntil ?? 0) > this.scene.time.now) {
        enemy.sprite.setAlpha(0.78)
        enemy.sprite.setScale((enemy.isBoss ? ENTITY_SCALE.bossEnemy : ENTITY_SCALE.enemy) * 0.96, (enemy.isBoss ? ENTITY_SCALE.bossEnemy : ENTITY_SCALE.enemy) * 0.9)
        enemy.sprite.setPosition(enemy.x, enemy.y + 3)
        enemy.aura?.setPosition(enemy.x, enemy.y)
        this.scene.updateEnemyBars(enemy)
        return
      } else if (enemy.recoveringUntil) {
        enemy.recoveringUntil = undefined
        enemy.sprite.setAlpha(0.95)
        enemy.sprite.setScale(enemy.isBoss ? ENTITY_SCALE.bossEnemy : ENTITY_SCALE.enemy)
      }
      const companionTarget = Math.random() < 0.3 ? this.scene.getNearestCompanion(enemy) : null
      const targetX = companionTarget?.x ?? this.scene.player!.x
      const targetY = companionTarget?.y ?? this.scene.player!.y
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, targetX, targetY)
      enemy.state = distance <= enemy.attackRange ? 'attack' : distance <= enemy.aggroRange ? 'chase' : 'idle'
      if (enemy.state === 'chase') this.scene.moveEnemyToward(enemy, targetX, targetY, enemy.speed * seconds)
      if (enemy.state === 'idle') this.scene.updateEnemyWander(enemy, delta, seconds)
      if (enemy.state === 'attack') {
        if (companionTarget) this.scene.tryEnemyAttackCompanion(enemy, companionTarget)
        else this.scene.tryEnemyAttack(enemy)
      }
      if (enemy.hitFlashTimer > 0) { enemy.hitFlashTimer -= delta; if (enemy.hitFlashTimer <= 0) enemy.body.setFillStyle(this.scene.getEnemyColor(enemy)) }
      enemy.sprite.setPosition(enemy.x, enemy.y)
      enemy.aura?.setPosition(enemy.x, enemy.y)
      this.scene.updateEnemyBars(enemy)
    })
  }

  getNearestCompanion(enemy: MapEnemy): PartyCompanion | null {
    let nearest: PartyCompanion | null = null
    let nearestDistance = Number.POSITIVE_INFINITY
    this.scene.companions.filter((companion) => companion.state !== 'dead').forEach((companion) => {
      const member = this.scene.saveData.party[companion.partyIndex]
      if (!member || member.currentHp <= 0) return
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, companion.x, companion.y)
      if (distance < nearestDistance) {
        nearest = companion
        nearestDistance = distance
      }
    })
    return nearest
  }

  updateEnemyWander(enemy: MapEnemy, delta: number, seconds: number) {
    enemy.wanderTimer -= delta
    if (!enemy.wanderTarget || enemy.wanderTimer <= 0) {
      const tile = this.scene.worldToTile(enemy.x, enemy.y)
      enemy.wanderTarget = { x: this.scene.tileCenter(Phaser.Math.Clamp(tile.x + Phaser.Math.Between(-3, 3), 1, MAP_WIDTH - 2)), y: this.scene.tileCenter(Phaser.Math.Clamp(tile.y + Phaser.Math.Between(-3, 3), 1, MAP_HEIGHT - 2)) }
      enemy.wanderTimer = Phaser.Math.Between(900, 2200)
    }
    this.scene.moveEnemyToward(enemy, enemy.wanderTarget.x, enemy.wanderTarget.y, enemy.speed * 0.45 * seconds)
  }

  moveEnemyToward(enemy: MapEnemy, targetX: number, targetY: number, distance: number) {
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, targetX, targetY)
    const nextX = enemy.x + Math.cos(angle) * distance
    const nextY = enemy.y + Math.sin(angle) * distance
    if (!this.scene.isWallAtWorld(nextX, enemy.y)) enemy.x = Phaser.Math.Clamp(nextX, 8, MAP_WIDTH * TILE_SIZE - 8)
    if (!this.scene.isWallAtWorld(enemy.x, nextY)) enemy.y = Phaser.Math.Clamp(nextY, 8, MAP_HEIGHT * TILE_SIZE - 8)
  }

  performPlayerAttack(pointerX?: number, pointerY?: number, input: 'space' | 'pointer' | 'buffer' = 'space'): boolean {
    if (!this.scene.player || this.scene.isBlocking || !this.scene.canStartPlayerAttack()) return false
    this.scene.currentAttackInput = input
    this.scene.nextPlayerAttackAt = this.scene.time.now + this.scene.ATTACK_TOTAL_MS
    this.scene.attackState = 'anticipation'
    this.scene.attackStartTime = this.scene.time.now
    this.scene.attackHitResolved = false
    this.scene.cancelDashRecoveryAfterHit()
    if (pointerX !== undefined && pointerY !== undefined) this.scene.updateFacingFromVector(pointerX - this.scene.player.x, pointerY - this.scene.player.y)
    else this.scene.autoAimNearestEnemy()
    if (this.scene.player instanceof Phaser.GameObjects.Sprite) this.scene.player.play(`nara-attack-${this.scene.facing}`, true)
    this.scene.time.delayedCall(this.scene.ATTACK_HITBOX_DELAY_MS, () => this.scene.resolvePlayerAttackContact())
    audioManager.playSfx('attack_swing')
    this.scene.learnedAttack = true
    this.scene.dismissHint('attack')
    this.scene.updatePromptLearning()
    return true
  }

  autoAimNearestEnemy() {
    if (!this.scene.player || !this.scene.sys.game.device.input.touch) return
    const nearest = this.scene.mapEnemies.filter((enemy) => !enemy.dead).sort((a, b) => Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, a.x, a.y) - Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, b.x, b.y))[0]
    if (nearest && Phaser.Math.Distance.Between(this.scene.player.x, this.scene.player.y, nearest.x, nearest.y) <= 86) this.scene.updateFacingFromVector(nearest.x - this.scene.player.x, nearest.y - this.scene.player.y)
  }

  updatePromptLearning() {
    if (!this.scene.promptText) return
    this.scene.promptText.setAlpha(1)
    this.scene.promptText.setText(this.scene.learnedInteract ? CONTROLS_SHORT : this.scene.learnedAttack ? 'WASD: Move | Space: Attack | Shift: Dash | F: Block' : 'WASD: Move | Space: Attack')
  }

  canStartPlayerAttack(): boolean {
    if (this.scene.attackState === 'idle') return this.scene.time.now >= this.scene.nextPlayerAttackAt
    const elapsed = this.scene.time.now - this.scene.attackStartTime
    return this.scene.attackState === 'recovery' && elapsed >= this.scene.ATTACK_TOTAL_MS - this.scene.COMBO_WINDOW_MS
  }

  resolvePlayerAttackContact() {
    if (!this.scene.player || this.scene.attackState === 'idle' || this.scene.attackHitResolved) return
    this.scene.attackHitResolved = true
    const attackInput = this.scene.currentAttackInput
    const angle = this.scene.facingToAngle()
    const swingX = this.scene.player.x + Math.cos(angle) * 34
    const swingY = this.scene.player.y + Math.sin(angle) * 34
    const edge = this.scene.add.arc(swingX, swingY, 42, Phaser.Math.RadToDeg(angle - Math.PI / 2.7), Phaser.Math.RadToDeg(angle + Math.PI / 2.7), false, 0x9ff3ff, 0.42).setDepth(25).setStrokeStyle(12, 0x9ff3ff, 0.72)
    const swing = this.scene.add.arc(swingX, swingY, 38, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0xf8fdff, 0.34).setDepth(26).setStrokeStyle(8, 0xf8fdff, 0.95)
    const trail = this.scene.add.arc(swingX - Math.cos(angle) * 8, swingY - Math.sin(angle) * 8, 30, Phaser.Math.RadToDeg(angle - Math.PI / 4), Phaser.Math.RadToDeg(angle + Math.PI / 4), false, 0x9ff3ff, 0.2).setDepth(24).setStrokeStyle(5, 0x9ff3ff, 0.5)
    this.scene.tweens.add({ targets: [edge, swing, trail], alpha: 0, scale: ENTITY_SCALE.object * 2.1, duration: 160, ease: 'Sine.easeOut', onComplete: () => { edge.destroy(); swing.destroy(); trail.destroy() } })
    let hit = false
    this.scene.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, enemy.x, enemy.y)
      const enemyAngle = Phaser.Math.Angle.Between(this.scene.player!.x, this.scene.player!.y, enemy.x, enemy.y)
      const halfAngle = this.scene.isMobileDevice ? Math.PI / 3 : Math.PI / 4
      if (distance <= 60 && Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) <= halfAngle) { hit = true; this.scene.damageEnemy(enemy, 1, attackInput) }
    })
    if (hit) this.scene.cameras.main.shake(80, 0.008)
    else this.scene.spawnWhooshDust(swingX, swingY, angle)
  }

  updateAttackState() {
    if (this.scene.attackState === 'idle') return
    const elapsed = this.scene.time.now - this.scene.attackStartTime
    if (elapsed >= this.scene.ATTACK_TOTAL_MS) this.scene.attackState = 'idle'
    else if (elapsed >= this.scene.ATTACK_TOTAL_MS - this.scene.ATTACK_RECOVERY_MS) this.scene.attackState = 'recovery'
    else if (elapsed >= this.scene.ATTACK_HITBOX_DELAY_MS) this.scene.attackState = 'contact'
  }

  damageEnemy(enemy: MapEnemy, multiplier = 1, input: 'space' | 'pointer' | 'buffer' | 'skill' = 'space') {
    if ((enemy.staggeredUntil ?? 0) > this.scene.time.now) return
    if (enemy.tutorialRole === 'step1' && input !== 'space') {
      this.scene.showFloatingText(enemy.x, enemy.y - 28, 'SPACE', '#93c5fd')
      return
    }
    const heroStats = this.scene.getPlayerCombatStats()
    const damage = Math.max(1, Math.round(CombatSystem.calculateRealtimePlayerDamage(heroStats.atk, enemy.stats.def) * multiplier * this.scene.getComboDamageMultiplier()))
    const critical = damage > heroStats.atk * 1.5
    enemy.currentHp = Math.max(0, enemy.currentHp - damage)
    enemy.visualHpTarget = enemy.currentHp
    enemy.hitFlashTimer = 50
    enemy.staggeredUntil = this.scene.time.now + 400
    enemy.body.setFillStyle(0xffffff)
    this.scene.tweens.add({ targets: enemy.sprite, scaleX: critical ? 1.25 : 1.15, scaleY: critical ? 0.75 : 0.85, yoyo: true, duration: 50, ease: 'Sine.easeOut' })
    this.scene.showDamageNumber(enemy.x, enemy.y - 22, damage, 'player', critical, enemy.weaknesses.includes('neutral'), enemy.resists.includes('neutral'))
    audioManager.playHitSfx(critical ? 'critical' : enemy.weaknesses.includes('neutral') ? 'weakness' : 'normal')
    audioManager.duckMusic()
    this.scene.spawnHitParticles(enemy)
    this.scene.triggerHitstop(enemy.isBoss || multiplier > 1 ? this.scene.HITSTOP_HEAVY_MS : this.scene.HITSTOP_LIGHT_MS)
    this.scene.cameras.main.shake(enemy.isBoss ? 160 : multiplier > 1 ? 140 : 80, enemy.isBoss ? 0.022 : multiplier > 1 ? 0.018 : 0.008)
    this.scene.updateEnemyBars(enemy)
    if (enemy.isBoss) this.scene.updateBossPhase(enemy)
    if (enemy.currentHp <= 0) this.scene.killEnemy(enemy)
  }

  useRealtimeSkill(index: number) {
    if (!this.scene.player) return
    const skill = this.scene.getRealtimeSkills()[index]
    const hero = this.scene.saveData.party[0]
    if (!skill || !CombatSystem.canUseRealtimeSkill(hero.currentMp, skill.mpCost, this.scene.time.now, this.scene.skillReadyAt[index])) {
      this.scene.flashUnavailableSkill(index)
      return
    }
    hero.currentMp = Math.max(0, hero.currentMp - skill.mpCost)
    this.scene.skillReadyAt[index] = this.scene.time.now + skill.cooldown
    if (skill.effect === 'emberSlash') this.scene.performEmberSlash()
    if (skill.effect === 'tidalHeal') this.scene.performTidalHeal()
    if (skill.effect === 'stoneGuard') this.scene.performStoneGuard()
    if (skill.effect === 'windStep') this.scene.performWindStep()
    this.scene.refreshHud(); this.scene.updatePlayerBars(); this.scene.persist()
  }

  flashUnavailableSkill(index: number) {
    const frame = this.scene.skillSlotFrames[index]
    if (!frame) return
    this.scene.tweens.add({ targets: frame, x: frame.x + 3, yoyo: true, repeat: 3, duration: 35 })
    this.scene.skillCooldownGraphics[index]?.clear().fillStyle(0x6b7280, 0.55).fillRect(index * 76 - 29, -29, 58, 58)
    audioManager.playSfx('ui_cancel')
  }

  performEmberSlash() {
    if (!this.scene.player) return
    const angle = this.scene.facingToAngle()
    const arc = this.scene.add.arc(this.scene.player.x + Math.cos(angle) * 42, this.scene.player.y + Math.sin(angle) * 42, 52, Phaser.Math.RadToDeg(angle - Math.PI / 3), Phaser.Math.RadToDeg(angle + Math.PI / 3), false, 0xff7a3d, 0.5).setDepth(26).setStrokeStyle(8, 0xfff1a8, 0.85)
    this.scene.tweens.add({ targets: arc, alpha: 0, scale: ENTITY_SCALE.object * 2.08, duration: 240, onComplete: () => arc.destroy() })
    this.scene.mapEnemies.filter((enemy) => !enemy.dead).forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, enemy.x, enemy.y)
      const enemyAngle = Phaser.Math.Angle.Between(this.scene.player!.x, this.scene.player!.y, enemy.x, enemy.y)
      if (distance <= 82 && Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) <= Math.PI / 3) this.scene.damageEnemy(enemy, 2, 'skill')
    })
  }

  performTidalHeal() {
    if (!this.scene.player) return
    const hero = this.scene.saveData.party[0]
    const maxHp = this.scene.getPlayerCombatStats().hp
    const heal = Math.ceil(maxHp * 0.3)
    hero.currentHp = Math.min(maxHp, hero.currentHp + heal)
    this.scene.showDamageNumber(this.scene.player.x, this.scene.player.y - 34, heal, 'heal')
    this.scene.cameras.main.flash(140, 60, 220, 120, false)
  }

  performStoneGuard() {
    if (!this.scene.player) return
    this.scene.stoneGuardUntil = this.scene.time.now + 4000
    const ring = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 30, 0x9ca3af, 0.2).setDepth(24).setStrokeStyle(3, 0xe5e7eb, 0.9)
    this.scene.tweens.add({ targets: ring, scale: ENTITY_SCALE.object * 2.83, alpha: 0, duration: 520, onComplete: () => ring.destroy() })
  }

  performWindStep() {
    if (!this.scene.player) return
    const angle = this.scene.facingToAngle()
    const targetX = Phaser.Math.Clamp(this.scene.player.x + Math.cos(angle) * 120, this.scene.player.width / 2, MAP_WIDTH * TILE_SIZE - this.scene.player.width / 2)
    const targetY = Phaser.Math.Clamp(this.scene.player.y + Math.sin(angle) * 120, this.scene.player.height / 2, MAP_HEIGHT * TILE_SIZE - this.scene.player.height / 2)
    if (!this.scene.collidesAt(targetX, targetY)) this.scene.player.setPosition(targetX, targetY)
    this.scene.cameras.main.flash(80, 159, 243, 255, false)
  }

  tryEnemyAttack(enemy: MapEnemy) {
    if (!this.scene.player || this.scene.time.now - enemy.lastAttackTime < enemy.attackCooldown) return
    enemy.lastAttackTime = this.scene.time.now
    const attackKind = enemy.isBoss ? Phaser.Math.Between(0, this.scene.saveData.ngPlusLevel > 0 ? 3 : 2) : 0
    const tell = enemy.isBoss ? attackKind === 3 ? 520 : attackKind === 2 ? 1000 : attackKind === 1 ? 700 : 360 : 300
    this.scene.showEnemyTelegraph(enemy, attackKind, tell)
    this.scene.time.delayedCall(tell + (enemy.isBoss ? 80 : 0), () => {
      if (enemy.dead || !this.scene.player || this.scene.time.now < this.scene.playerInvulnerableUntil || Phaser.Math.Distance.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y) > enemy.attackRange + 12) return
      const blocking = this.scene.isBlocking
      if (blocking && this.scene.time.now - this.scene.blockStartTime <= this.scene.PARRY_WINDOW_MS) {
        this.scene.performPerfectBlock(enemy)
        return
      }
      const guarded = this.scene.time.now < this.scene.stoneGuardUntil
      const multiplier = (blocking ? 0.4 : 1) * (guarded ? 0.5 : 1)
      const rageMultiplier = enemy.isBoss && this.scene.saveData.ngPlusLevel >= 3 && enemy.currentHp / enemy.maxHp <= 0.5 ? 1.2 : 1
      const damage = CombatSystem.calculateRealtimeEnemyDamage(enemy.stats.atk, this.scene.getPlayerCombatStats().def, multiplier * rageMultiplier)
      const hero = this.scene.saveData.party[0]
      hero.currentHp = Math.max(0, hero.currentHp - damage)
      this.scene.playerInvulnerableUntil = this.scene.time.now + 800
      this.scene.cameras.main.flash(100, 180, 20, 20, false)
      this.scene.cameras.main.shake(150, 0.003)
      if (blocking) this.scene.showBlockFlash()
      this.scene.showDamageDirection(enemy.x, enemy.y)
      this.scene.showDamageNumber(this.scene.player.x, this.scene.player.y - 26, damage, 'enemy')
      this.scene.startPlayerBlink()
      this.scene.refreshHud()
      this.scene.updatePlayerBars()
      if (!this.scene.firstDamageTaken) { this.scene.firstDamageTaken = true; this.scene.queueHint('block', 'F to block') }
      if (blocking) this.scene.dismissHint('block')
      if (hero.currentHp <= 0) this.scene.handlePlayerDefeat()
    })
    if (enemy.isBoss && attackKind > 0) enemy.recoveringUntil = this.scene.time.now + tell + 80 + Phaser.Math.Between(attackKind === 3 ? 360 : 800, attackKind === 3 ? 760 : 1400)
  }

  showEnemyTelegraph(enemy: MapEnemy, kind: number, duration: number) {
    enemy.body.setFillStyle(0xff4d4d)
    if (!enemy.isBoss) return
    const angle = this.scene.player ? Phaser.Math.Angle.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y) : 0
    if (kind === 0) {
      this.scene.tweens.add({ targets: enemy.sprite, alpha: 0.45, yoyo: true, repeat: 2, duration: duration / 5 })
    } else if (kind === 1) {
      audioManager.playSfx('impact_heavy')
      this.scene.tweens.add({ targets: enemy.sprite, scale: ENTITY_SCALE.bossEnemy * 1.1, y: enemy.sprite.y - 8, yoyo: true, duration: duration * 0.5 })
      const crack = this.scene.add.rectangle(enemy.x + Math.cos(angle) * 42, enemy.y + Math.sin(angle) * 42, 92, 5, 0xff8a3d, 0.72).setRotation(angle).setDepth(16)
      this.scene.tweens.add({ targets: crack, alpha: 0, duration, onComplete: () => crack.destroy() })
    } else if (kind === 2) {
      const ring = this.scene.add.circle(enemy.x, enemy.y, 18, 0xff4d1f, 0.12).setStrokeStyle(4, 0xff8a3d, 0.82).setDepth(16)
      this.scene.tweens.add({ targets: ring, scale: 4.8, alpha: 0.4, duration, ease: 'Sine.easeInOut', onComplete: () => ring.destroy() })
      this.scene.tweens.add({ targets: ring, lineWidth: 8, yoyo: true, repeat: 1, duration: duration / 4 })
    } else {
      const fan = this.scene.add.arc(enemy.x, enemy.y, 70, Phaser.Math.RadToDeg(angle - Math.PI / 5), Phaser.Math.RadToDeg(angle + Math.PI / 5), false, 0xffd166, 0.18).setStrokeStyle(8, 0xff8a3d, 0.78).setDepth(16)
      this.scene.tweens.add({ targets: fan, scale: ENTITY_SCALE.object * 1.7, alpha: 0, duration, ease: 'Sine.easeOut', onComplete: () => fan.destroy() })
    }
  }

  updateBossPhase(enemy: MapEnemy) {
    const pct = enemy.currentHp / enemy.maxHp
    const thresholds = this.scene.saveData.ngPlusLevel >= 3 ? BOSS_PHASE_THRESHOLDS.map((phase) => phase.phase === 4 ? { ...phase, hpPercent: 0.5, label: 'Rage mode' } : phase) : BOSS_PHASE_THRESHOLDS
    const next = [...thresholds].reverse().find((phase) => pct <= phase.hpPercent)
    if (!next || next.phase <= (enemy.bossPhase ?? 1)) return
    enemy.bossPhase = next.phase
    enemy.recoveringUntil = this.scene.time.now + 1300
    enemy.sprite.setAlpha(0.55)
    this.scene.cameras.main.zoomTo(0.92, 300, 'Sine.easeOut', true)
    this.scene.time.delayedCall(1100, () => this.scene.cameras.main.zoomTo(1, 260, 'Sine.easeInOut', true))
    this.scene.showEventBanner(`Phase ${next.phase}`, next.label)
    audioManager.playSfx('boss_sting')
  }

  tryEnemyAttackCompanion(enemy: MapEnemy, companion: PartyCompanion) {
    if (this.scene.time.now - enemy.lastAttackTime < enemy.attackCooldown) return
    enemy.lastAttackTime = this.scene.time.now
    enemy.body.setFillStyle(0xff4d4d)
    this.scene.time.delayedCall(300, () => {
      if (enemy.dead || companion.state === 'dead' || Phaser.Math.Distance.Between(enemy.x, enemy.y, companion.x, companion.y) > enemy.attackRange + 12) return
      const member = this.scene.saveData.party[companion.partyIndex]
      const character = member ? CHARACTERS[member.characterId] : undefined
      if (!member || !character) return
      const stats = this.scene.scaleCharacterStats(character, member.level)
      const damage = CombatSystem.calculateRealtimeEnemyDamage(enemy.stats.atk, stats.def)
      member.currentHp = Math.max(0, member.currentHp - damage)
      this.scene.showDamageNumber(companion.x, companion.y - 26, damage, 'enemy')
      companion.body.setFillStyle(0xff4d4d)
      this.scene.time.delayedCall(120, () => companion.body.setFillStyle(companion.characterId === 'kael' ? 0x5c8a4d : 0x7fb3ff, 0.94))
      if (member.currentHp <= 0) {
        companion.state = 'dead'
        companion.container.setAlpha(0.3)
        companion.body.setScale(1, 0.7)
        companion.body.setFillStyle(0x6b7280, 0.6)
        this.scene.showToast(`${companion.name} falls!`)
        this.scene.time.delayedCall(8000, () => {
          if (!this.scene.saveData?.party[companion.partyIndex]) return
          const reviveTarget = this.scene.saveData.party[companion.partyIndex]
          const maxHp = this.scene.scaleCharacterStats(CHARACTERS[companion.characterId as keyof typeof CHARACTERS], reviveTarget.level).hp
          reviveTarget.currentHp = Math.max(1, Math.floor(maxHp * 0.5))
          companion.state = 'follow'
          companion.container.setAlpha(1)
          companion.body.setScale(1, 1)
          companion.body.setFillStyle(companion.characterId === 'kael' ? 0x5c8a4d : 0x7fb3ff, 0.94)
          this.scene.showFloatingText(companion.x, companion.y - 30, 'Revived!', '#86efac')
          this.scene.tweens.add({ targets: companion.container, alpha: 0.3, yoyo: true, repeat: 3, duration: 100 })
          this.scene.updateCompanionBars(companion)
          this.scene.refreshHud()
          this.scene.persist()
        })
      }
      this.scene.updateCompanionBars(companion)
      this.scene.refreshHud()
      this.scene.persist()
    })
  }

  killEnemy(enemy: MapEnemy) {
    enemy.dead = true
    enemy.state = 'dead'
    this.scene.killCount += 1
    enemy.body.setFillStyle(0xffffff)
    this.scene.cameras.main.shake(enemy.isBoss ? 400 : 200, enemy.isBoss ? 0.008 : 0.004)
    if (enemy.isBoss) this.scene.triggerSlowMo(1000, 0.3)
    this.scene.spawnDeathExplosion(enemy.x, enemy.y, this.scene.getEnemyColor(enemy))
    if (enemy.isBoss) {
      this.scene.spawnBossExplosion(enemy.x, enemy.y)
      this.scene.bossHud?.container.destroy()
      this.scene.bossHud = undefined
      audioManager.playSfx('victory_fanfare')
      this.scene.cameras.main.zoomTo(0.82, 2400, 'Sine.easeInOut', true)
    }
    this.scene.registerComboKill(enemy.x, enemy.y)
    if (enemy.noRewards) {
      this.scene.spawnTrainingSparkle(enemy.x, enemy.y)
    } else {
      this.scene.showFloatingText(enemy.x, enemy.y - 34, `+${enemy.goldReward}g`, '#ffd166')
      this.scene.spawnGroundLoot(enemy.x, enemy.y, 'gold', 'gold', enemy.goldReward)
      this.scene.spawnGroundLoot(enemy.x + 12, enemy.y, 'exp', 'exp', enemy.expReward)
      if (Math.random() < 0.35) this.scene.spawnGroundLoot(enemy.x - 12, enemy.y, 'item', 'health_potion', 1)
    }
    this.scene.tweens.add({ targets: [enemy.sprite, enemy.aura, enemy.nameText], alpha: 0, scale: 1.3, delay: 100, duration: enemy.isBoss ? 600 : 460, onComplete: () => this.scene.destroyEnemy(enemy) })
    if (enemy.battleId) this.scene.time.delayedCall(enemy.isBoss ? 2300 : 0, () => this.scene.completeOverworldBattle(enemy.battleId!))
    this.scene.handleTutorialEnemyKilled(enemy)
    if (!enemy.isBoss && !this.scene.isTutorialActive()) this.scene.queueHint('potion_interact', 'Q for potion / E to interact', 8000)
    if (enemy.isBoss) {
      this.scene.time.delayedCall(1600, () => this.scene.showBossVictoryScreen(enemy))
    }
    this.scene.checkRespawnTimer()
    this.scene.refreshHud()
    this.scene.persist()
  }

  completeOverworldBattle(battleId: string) {
    const result = { battleId, victory: true, rewards: { exp: 0, gold: 0, emberShards: 0, items: [] } }
    this.scene.initData.battleResult = result
    this.scene.applyBattleResult()
    this.scene.initData.battleResult = undefined
  }

  destroyEnemy(enemy: MapEnemy) {
    enemy.sprite.destroy(); enemy.aura?.destroy(); enemy.hpBar.destroy(); enemy.hpBarBg.destroy(); enemy.nameText.destroy()
  }

  spawnGroundLoot(x: number, y: number, kind: GroundLoot['kind'], itemId: string, quantity: number) {
    const color = kind === 'exp' ? 0x60a5fa : kind === 'gold' ? 0xffd166 : 0xffb84d
    const radius = kind === 'gold' ? 6 : 8
    const sprite = this.scene.add.circle(x, y, radius, color, 0.95).setDepth(17).setStrokeStyle(2, 0xffffff, 0.6)
    const labelText = kind === 'gold' ? `+${quantity}g` : kind === 'exp' ? `+${quantity} EXP` : this.scene.getItemName(itemId)
    const label = this.scene.add.text(x, y - 20, labelText, { color: kind === 'exp' ? '#bfdbfe' : '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '11px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(18)
    const bobTween = this.scene.tweens.add({ targets: [sprite, label], y: '+=3', yoyo: true, repeat: -1, duration: 760, ease: 'Sine.easeInOut' })
    if (kind === 'gold') this.scene.tweens.add({ targets: sprite, scaleX: 1.18, scaleY: 0.82, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' })
    if (kind === 'gold') this.scene.tweens.add({ targets: sprite, y: sprite.y - 20, duration: 300, ease: 'Sine.easeOut', yoyo: true })
    const loot: GroundLoot = { x, y, itemId, quantity, sprite, label, bobTween, kind }
    loot.expireTween = this.scene.tweens.add({ targets: [sprite, label], alpha: 0, delay: 14500, duration: 500, onComplete: () => this.scene.destroyGroundLoot(loot) })
    this.scene.groundLoot.push(loot)
  }

  updateGroundLoot() {
    if (!this.scene.player) return
    this.scene.groundLoot.slice().forEach((loot) => {
      const distance = Phaser.Math.Distance.Between(this.scene.player!.x, this.scene.player!.y, loot.sprite.x, loot.sprite.y)
      if (distance < 48) {
        loot.bobTween.pause()
        const angle = Phaser.Math.Angle.Between(loot.sprite.x, loot.sprite.y, this.scene.player!.x, this.scene.player!.y)
        loot.sprite.x += Math.cos(angle) * 3
        loot.sprite.y += Math.sin(angle) * 3
        loot.label.setPosition(loot.sprite.x, loot.sprite.y - 20)
      }
      if (distance < 16) this.scene.pickupGroundLoot(loot)
    })
  }

  pickupGroundLoot(loot: GroundLoot) {
    if (!this.scene.player) return
    if (loot.kind === 'gold') {
      this.scene.saveData.gold += loot.quantity
      this.scene.saveData.battleRewards.gold += loot.quantity
      this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 32, `+${loot.quantity}g`, '#ffd166')
      this.scene.flashGoldCounter(loot.quantity)
    } else if (loot.kind === 'exp') {
      this.scene.gainRealtimeExp(loot.quantity)
      this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 32, `+${loot.quantity} EXP`, '#93c5fd')
    } else {
      this.scene.addInventory(loot.itemId, loot.quantity)
      this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 32, `+${loot.quantity} ${this.scene.getItemName(loot.itemId)}`, '#fff1a8')
    }
    audioManager.playSfx('reward_gain')
    this.scene.spawnPickupDing(loot.sprite.x, loot.sprite.y)
    this.scene.destroyGroundLoot(loot)
    this.scene.refreshHud(); this.scene.persist()
  }

  destroyGroundLoot(loot: GroundLoot) {
    this.scene.groundLoot = this.scene.groundLoot.filter((entry) => entry !== loot)
    loot.bobTween.stop(); loot.expireTween?.stop(); loot.sprite.destroy(); loot.label.destroy()
  }

  gainRealtimeExp(amount: number) {
    const previousLevels = new Map(this.scene.saveData.party.map((member) => [member.characterId, member.level]))
    this.scene.saveData.battleRewards.exp += amount
    const nextLevel = Math.min(6, 1 + Math.floor(this.scene.saveData.battleRewards.exp / 180))
    const leveledUp = this.scene.saveData.party.some((member) => nextLevel > (previousLevels.get(member.characterId) ?? member.level))
    if (leveledUp) {
      this.scene.saveData.party.forEach((member) => { member.level = Math.max(member.level, nextLevel) })
      this.scene.showLevelUpEffect()
    }
  }

  checkRespawnTimer() {
    if (this.scene.respawnTimer || this.scene.saveData.stage === 'homecoming') return
    this.scene.respawnTimer = this.scene.time.delayedCall(ENEMY_RESPAWN_DELAY, () => {
      this.scene.respawnTimer = undefined
      this.scene.mapEnemies = this.scene.mapEnemies.filter((enemy) => enemy.isBoss || !enemy.dead)
      this.scene.spawnRandomRegularEnemyForStage()
      this.scene.showToast('New threats emerge...')
    })
  }

  registerComboKill(x: number, y: number) {
    this.scene.comboCount = this.scene.time.now - this.scene.lastComboHitAt <= 3000 ? this.scene.comboCount + 1 : 1
    this.scene.lastComboHitAt = this.scene.time.now
    const color = this.scene.getComboColor(this.scene.comboCount)
    if (this.scene.comboCount > 1) {
      const label = this.scene.add.text(x, y - 48, `${this.scene.comboCount}x COMBO`, { color, fontFamily: 'Arial, sans-serif', fontSize: this.scene.comboCount >= 3 ? '18px' : '14px', fontStyle: 'bold' }).setOrigin(0.5).setDepth(82)
      label.setScale(this.scene.comboCount >= 3 ? ENTITY_SCALE.hero * 1.88 : ENTITY_SCALE.object / ENTITY_SCALE.object)
      this.scene.tweens.add({ targets: label, y: y - 82, alpha: 0, scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 780, ease: 'Sine.easeOut', onComplete: () => label.destroy() })
    }
    if (this.scene.comboCount === 5 || this.scene.comboCount === 10 || this.scene.comboCount === 15) {
      const milestone = this.scene.comboCount === 5 ? 'UNSTOPPABLE!' : this.scene.comboCount === 10 ? 'LEGENDARY!' : 'MYTHIC!'
      this.scene.cameras.main.shake(180, 0.005)
      this.scene.triggerSlowMo(220, 0.55)
      this.scene.showFloatingText(this.scene.player?.x ?? x, (this.scene.player?.y ?? y) - 58, milestone, color)
    }
  }

  getComboColor(combo: number) {
    if (combo >= 8) return '#ef4444'
    if (combo >= 5) return '#fb923c'
    if (combo >= 3) return '#fef08a'
    return '#ffffff'
  }

  getComboDamageMultiplier() {
    if (this.scene.time.now - this.scene.lastComboHitAt > 3000) return 1
    const tier = this.scene.comboCount >= 8 ? 4 : this.scene.comboCount >= 5 ? 3 : this.scene.comboCount >= 3 ? 2 : this.scene.comboCount >= 1 ? 1 : 0
    return 1 + tier * 0.05
  }

  spawnDeathExplosion(x: number, y: number, color = 0xffd166) {
    const count = Phaser.Math.Between(8, 12)
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Phaser.Math.FloatBetween(-0.22, 0.22)
      const distance = Phaser.Math.Between(22, 52)
      const particle = this.scene.add.circle(x, y, Phaser.Math.Between(2, 5), color, 0.9).setDepth(30)
      this.scene.tweens.add({ targets: particle, x: x + Math.cos(angle) * distance, y: y + Math.sin(angle) * distance, alpha: 0, scale: ENTITY_SCALE.object * 0.25, duration: Phaser.Math.Between(380, 680), ease: 'Sine.easeOut', onComplete: () => particle.destroy() })
    }
  }

  spawnBossExplosion(x: number, y: number) {
    this.scene.cameras.main.flash(240, 255, 96, 96, false)
    for (let index = 0; index < 18; index += 1) {
      const angle = (Math.PI * 2 * index) / 18
      const particle = this.scene.add.circle(x, y, 5, index % 2 === 0 ? 0xff6b6b : 0xffd166, 0.95).setDepth(25)
      this.scene.tweens.add({ targets: particle, x: x + Math.cos(angle) * Phaser.Math.Between(42, 92), y: y + Math.sin(angle) * Phaser.Math.Between(42, 92), scale: ENTITY_SCALE.object * 0.33, alpha: 0, duration: 720, onComplete: () => particle.destroy() })
    }
  }

  spawnKaelSlash(companion: PartyCompanion, enemy: MapEnemy) {
    const angle = Phaser.Math.Angle.Between(companion.x, companion.y, enemy.x, enemy.y)
    const slash = this.scene.add.arc(companion.x + Math.cos(angle) * 24, companion.y + Math.sin(angle) * 24, 34, Phaser.Math.RadToDeg(angle - Math.PI / 2.8), Phaser.Math.RadToDeg(angle + Math.PI / 2.8), false, 0xff4d2e, 0.34).setDepth(26).setStrokeStyle(6, 0xffb347, 0.86)
    this.scene.tweens.add({ targets: slash, scale: ENTITY_SCALE.object * 2.03, alpha: 0, duration: 180, ease: 'Sine.easeOut', onComplete: () => slash.destroy() })
  }

  spawnHealSparkles(x: number, y: number) {
    for (let index = 0; index < 4; index += 1) {
      const angle = (Math.PI * 2 * index) / 4
      const sparkle = this.scene.add.circle(x + Phaser.Math.Between(-8, 8), y + Phaser.Math.Between(-8, 8), 3, 0x86efac, 0.85).setDepth(26)
      this.scene.tweens.add({ targets: sparkle, x: x + Math.cos(angle) * Phaser.Math.Between(14, 28), y: y + Math.sin(angle) * Phaser.Math.Between(14, 28), alpha: 0, scale: ENTITY_SCALE.object * 0.335, duration: 420, onComplete: () => sparkle.destroy() })
    }
  }

  getEnemyColor(enemy: MapEnemy) {
    if (enemy.enemyId === 'moonwake_guardian') return 0x4da6ff
    if (enemy.enemyId === 'thornheart') return 0x3aa657
    if (enemy.enemyId === 'cartographers_lie') return 0x8f63ff
    return enemy.isBoss ? 0xb91c1c : 0x75c46b
  }

  startDash(): boolean {
    if (!this.scene.player || this.scene.time.now < this.scene.nextDashAt) return false
    this.scene.dashUntil = this.scene.time.now + this.scene.DASH_ACTIVE_MS
    this.scene.playerInvulnerableUntil = this.scene.time.now + this.scene.DASH_INVULN_MS
    this.scene.nextDashAt = this.scene.time.now + this.scene.DASH_COOLDOWN_MS
    this.scene.dashSlideMultiplier = 1
    this.scene.dashWallSlideUsed = false
    this.scene.lastDashAfterimageAt = 0
    audioManager.playSfx('scene_whoosh')
    this.scene.dismissHint('dash')
    this.scene.spawnDashDust()
    this.scene.cameras.main.zoomTo(1.03, 80, 'Sine.easeOut', true)
    this.scene.time.delayedCall(120, () => this.scene.cameras.main.zoomTo(1, 120, 'Sine.easeInOut', true))
    this.scene.tweens.add({ targets: this.scene.player, alpha: 0.45, yoyo: true, repeat: 3, duration: 45 })
    this.scene.time.delayedCall(this.scene.DASH_COOLDOWN_MS, () => this.scene.showDashReady())
    return true
  }

  updateDashTrail() {
    if (!this.scene.player || this.scene.time.now - this.scene.lastDashAfterimageAt < 40) return
    this.scene.lastDashAfterimageAt = this.scene.time.now
    if (this.scene.player instanceof Phaser.GameObjects.Sprite) {
      const ghost = this.scene.add.image(this.scene.player.x, this.scene.player.y, this.scene.player.texture?.key || '', this.scene.player.frame?.name || 0).setAlpha(0.2).setTint(0x9ff3ff).setDepth(10)
      this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() })
    } else {
      const ghost = this.scene.add.rectangle(this.scene.player.x, this.scene.player.y, this.scene.player.width, this.scene.player.height, 0x9ff3ff, 0.2).setDepth(10)
      this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 200, onComplete: () => ghost.destroy() })
    }
  }

  spawnDashDust() {
    if (!this.scene.player) return
    for (let i = 0; i < 3; i += 1) {
      const dust = this.scene.add.circle(this.scene.player.x + Phaser.Math.Between(-8, 8), this.scene.player.y + 16 + Phaser.Math.Between(-4, 4), Phaser.Math.Between(3, 6), 0x8b7355, 0.6).setDepth(9)
      this.scene.tweens.add({ targets: dust, alpha: 0, scaleX: 1.5, scaleY: 0.5, duration: 200 + i * 40, onComplete: () => dust.destroy() })
    }
  }

  handleDashWallSlide(nudgeX: number, nudgeY: number) {
    if (!this.scene.player || this.scene.dashWallSlideUsed) return
    this.scene.dashWallSlideUsed = true
    this.scene.dashSlideMultiplier = 0.5
    for (let i = 0; i < 3; i += 1) {
      const spark = this.scene.add.circle(this.scene.player.x - nudgeX * 14 + Phaser.Math.Between(-4, 4), this.scene.player.y - nudgeY * 14 + Phaser.Math.Between(-4, 4), Phaser.Math.Between(2, 4), 0xff9f1c, 0.85).setDepth(28)
      this.scene.tweens.add({ targets: spark, x: spark.x + nudgeX * Phaser.Math.Between(8, 16), y: spark.y + nudgeY * Phaser.Math.Between(8, 16), alpha: 0, duration: 180, onComplete: () => spark.destroy() })
    }
    this.scene.cameras.main.shake(60, 0.004)
  }

  cancelDashRecoveryAfterHit() {
    const recoveryStart = this.scene.dashUntil
    const recoveryEnd = this.scene.nextDashAt
    if (this.scene.time.now <= recoveryStart || this.scene.time.now >= recoveryEnd) return
    if ((this.scene.time.now - recoveryStart) / Math.max(1, recoveryEnd - recoveryStart) >= 0.6) this.scene.nextDashAt = this.scene.time.now
  }

  bufferInput(action: string) {
    this.scene.inputBuffer = { action, time: this.scene.time.now }
  }

  consumeInputBuffer() {
    if (!this.scene.inputBuffer) return
    const maxAge = this.scene.inputBuffer.action === 'interact' ? this.scene.INTERACT_BUFFER_MS : this.scene.INPUT_BUFFER_MS
    if (this.scene.time.now - this.scene.inputBuffer.time > maxAge) { this.scene.inputBuffer = null; return }
    if (this.scene.inputBuffer.action === 'attack' && this.scene.performPlayerAttack()) this.scene.inputBuffer = null
    else if (this.scene.inputBuffer.action === 'dash' && this.scene.startDash()) this.scene.inputBuffer = null
    else if (this.scene.inputBuffer.action === 'interact' && this.scene.interact()) this.scene.inputBuffer = null
  }

  updateCameraFeel() {
    if (!this.scene.player) return
    const lookAheadX = this.scene.facing === 'right' ? 22 : this.scene.facing === 'left' ? -22 : 0
    const lookAheadY = this.scene.facing === 'down' ? 14 : this.scene.facing === 'up' ? -14 : 0
    this.scene.cameras.main.setFollowOffset(Phaser.Math.Linear(this.scene.cameras.main.followOffset.x, lookAheadX, 0.08), Phaser.Math.Linear(this.scene.cameras.main.followOffset.y, lookAheadY, 0.08))
    const stats = this.scene.getPlayerCombatStats()
    const hero = this.scene.saveData.party[0]
    if (hero.currentHp / stats.hp < 0.3) this.scene.cameras.main.setZoom(1 + Math.sin(this.scene.time.now * 0.002) * 0.015)
    else if (Math.abs(this.scene.cameras.main.zoom - this.scene.cameraZoom) > 0.001) this.scene.cameras.main.setZoom(Phaser.Math.Linear(this.scene.cameras.main.zoom, this.scene.cameraZoom, 0.08))
  }

  showDashReady() {
    if (!this.scene.dashReadyText || this.scene.time.now < this.scene.nextDashAt) return
    this.scene.dashReadyText.setAlpha(0.9).setScale(ENTITY_SCALE.hero * 1.6)
    this.scene.tweens.add({ targets: this.scene.dashReadyText, alpha: 0, scale: ENTITY_SCALE.object / ENTITY_SCALE.object, duration: 620, ease: 'Sine.easeOut' })
  }

  triggerHitstop(duration: number) {
    this.scene.tweens.pauseAll()
    this.scene.time.timeScale = 0.01
    this.scene.time.delayedCall(duration, () => { this.scene.time.timeScale = 1; this.scene.tweens.resumeAll() })
  }

  startPlayerBlink() {
    if (this.scene.playerBlinkEvent) this.scene.playerBlinkEvent.destroy()
    if (!this.scene.player) return
    this.scene.playerBlinkEvent = this.scene.time.addEvent({
      delay: 80,
      repeat: 9,
      callback: () => {
        if (!this.scene.player) return
        this.scene.player.setAlpha(this.scene.player.alpha > 0.5 ? 0.25 : 0.9)
        if (this.scene.time.now >= this.scene.playerInvulnerableUntil) {
          this.scene.player.setAlpha(1)
          this.scene.playerBlinkEvent?.destroy()
          this.scene.playerBlinkEvent = undefined
        }
      },
    })
  }

  triggerSlowMo(duration: number, scale: number) {
    this.scene.time.timeScale = scale
    this.scene.time.delayedCall(duration, () => { this.scene.time.timeScale = 1 })
  }

  useHealthPotion() {
    const item = this.scene.saveData.inventory.find((entry) => entry.itemId === 'health_potion' && entry.quantity > 0)
    if (!item || !this.scene.player) { this.scene.showToast('No Health Potions available.'); return }
    const hero = this.scene.saveData.party[0]
    const maxHp = this.scene.getPlayerCombatStats().hp
    if (hero.currentHp >= maxHp) { this.scene.showToast('Nara is already at full HP.'); return }
    item.quantity -= 1
    hero.currentHp = Math.min(maxHp, hero.currentHp + 50)
    this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 30, '+50 HP', '#86efac')
    this.scene.tweens.add({ targets: this.scene.player, alpha: 0.55, yoyo: true, repeat: 2, duration: 80 })
    audioManager.playSfx('item_use')
    this.scene.refreshHud(); this.scene.updatePlayerBars(); this.scene.persist()
  }

  performPerfectBlock(enemy: MapEnemy) {
    if (!this.scene.player) return
    enemy.staggeredUntil = this.scene.time.now + this.scene.PARRY_STAGGER_MS
    const hero = this.scene.saveData.party[0]
    const maxMp = this.scene.getPlayerCombatStats().mp
    hero.currentMp = Math.min(maxMp, hero.currentMp + this.scene.PARRY_REWARD_MANA)
    const ring = this.scene.add.circle(this.scene.player.x, this.scene.player.y, 18, 0x9ff3ff, 0.12).setDepth(30).setStrokeStyle(4, 0x9ff3ff, 0.95)
    this.scene.tweens.add({ targets: ring, alpha: 0, scale: 2.2, duration: 260, ease: 'Sine.easeOut', onComplete: () => ring.destroy() })
    audioManager.playSfx('scene_whoosh')
    this.scene.triggerSlowMo(this.scene.PARRY_SLOW_MO_MS, 0.3)
    this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 36, 'PERFECT', '#ffd36e')
    this.scene.showFloatingText(this.scene.player.x, this.scene.player.y - 22, 'PING', '#9ff3ff')
    this.scene.shieldArc?.setStrokeStyle(7, 0x9ff3ff, 1).setAlpha(1)
    this.scene.tweens.add({ targets: this.scene.shieldArc, alpha: 0.25, scale: 1.25, yoyo: true, duration: 120 })
    this.scene.refreshHud(); this.scene.updatePlayerBars(); this.scene.persist()
  }

  getPlayerCombatStats(): CharacterStats {
    const member = this.scene.saveData.party[0]
    const character = CHARACTERS[member.characterId]
    const stats = this.scene.scaleCharacterStats(character, member.level)
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

  updateShieldVisual() {
    if (!this.scene.player) return
    if (!this.scene.isBlocking) {
      this.scene.shieldArc?.destroy(); this.scene.shieldArc = undefined
      return
    }
    const angle = this.scene.facingToAngle()
    const x = this.scene.player.x + Math.cos(angle) * 24
    const y = this.scene.player.y + Math.sin(angle) * 24
    if (!this.scene.shieldArc) this.scene.shieldArc = this.scene.add.arc(x, y, 24, -55, 55, false, 0x60a5fa, 0.18).setDepth(27).setStrokeStyle(5, 0x93c5fd, 0.8)
    this.scene.shieldArc.setPosition(x, y).setAngle(Phaser.Math.RadToDeg(angle))
    const inParryWindow = this.scene.time.now - this.scene.blockStartTime <= this.scene.PARRY_WINDOW_MS
    this.scene.shieldArc.setStrokeStyle(inParryWindow ? 7 : 5, inParryWindow ? 0x9ff3ff : 0x93c5fd, inParryWindow ? 1 : 0.8)
    this.scene.shieldArc.setAlpha(inParryWindow ? 0.95 + Math.sin(this.scene.time.now * 0.04) * 0.05 : 0.82)
  }

  showBlockFlash() {
    if (!this.scene.shieldArc) return
    this.scene.tweens.add({ targets: this.scene.shieldArc, alpha: 1, scale: 0.88, yoyo: true, duration: 80 })
    this.scene.showFloatingText(this.scene.shieldArc.x, this.scene.shieldArc.y - 18, 'BLOCK', '#93c5fd')
  }

  showDamageDirection(attackerX: number, attackerY: number) {
    if (!this.scene.player) return
    const angle = Phaser.Math.Angle.Between(this.scene.player.x, this.scene.player.y, attackerX, attackerY)
    const arrow = this.scene.add.triangle(this.scene.player.x + Math.cos(angle) * 42, this.scene.player.y + Math.sin(angle) * 42, 0, -8, 14, 0, 0, 8, 0xff6b6b, 0.9).setDepth(28)
    arrow.setRotation(angle)
    this.scene.tweens.add({ targets: arrow, alpha: 0, duration: 520, onComplete: () => arrow.destroy() })
  }

  updateFacingFromVector(x: number, y: number) {
    if (Math.abs(x) > Math.abs(y)) this.scene.facing = x < 0 ? 'left' : 'right'
    else this.scene.facing = y < 0 ? 'up' : 'down'
  }

  facingToAngle() {
    if (this.scene.facing === 'right') return 0
    if (this.scene.facing === 'left') return Math.PI
    if (this.scene.facing === 'up') return -Math.PI / 2
    return Math.PI / 2
  }

  showBossIntro(enemyId: string) {
    const name = ENEMIES_BY_ID[enemyId]?.name ?? 'Boss'
    audioManager.playSfx('boss_sting')
    const vignette = this.scene.add.rectangle(this.scene.scale.width / 2, this.scene.scale.height / 2, this.scene.scale.width, this.scene.scale.height, 0x7f1d1d, 0).setScrollFactor(0).setDepth(124)
    this.scene.time.timeScale = 0.5
    this.scene.time.delayedCall(500, () => { this.scene.time.timeScale = 1 })
    this.scene.tweens.add({ targets: vignette, alpha: 0.28, yoyo: true, duration: 360, ease: 'Sine.easeInOut', onComplete: () => vignette.destroy() })
    this.scene.cameras.main.zoomTo(0.95, 180, 'Sine.easeOut', true)
    this.scene.cameras.main.zoomTo(1.15, 350, 'Sine.easeOut', true)
    this.scene.time.delayedCall(800, () => this.scene.cameras.main.zoomTo(1, 450, 'Sine.easeInOut', true))
    this.scene.showEventBanner(name, 'A route guardian enters the overworld.')
  }
}
