import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { BOSSES } from '../data/bosses'
import { CHARACTERS, type CharacterData, type CharacterStats } from '../data/characters'
import { ENEMIES, type EnemySkill } from '../data/enemies'
import { ITEMS_BY_ID } from '../data/items'
import type { Element, Skill } from '../data/skills'
import { BattleEntity, CombatSystem } from '../systems/CombatSystem'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'

type BattleInitData = {
  battleId?: string
  enemyIds?: string[]
  isBoss?: boolean
}

const BOSS_BATTLE_REWARDS: Record<string, { emberShards: number; items: Array<{ itemId: string; quantity: number }>; rewardLine: string }> = {
  moonwake_guardian_battle: {
    emberShards: 0,
    items: [{ itemId: 'health_elixir', quantity: 1 }],
    rewardLine: 'Rewards: Skywell Shard unlocked, Elixir x1\nThe Moonwake route opens beyond the seal.',
  },
  archive_skirmish_battle: {
    emberShards: 1,
    items: [{ itemId: 'mana_potion', quantity: 1 }, { itemId: 'glass_lens', quantity: 1 }],
    rewardLine: 'Rewards: Ember Shard x1, Ether x1, Glass Lens\nThe archive paths stop rearranging for now.',
  },
  thornheart_battle: {
    emberShards: 2,
    items: [{ itemId: 'health_elixir', quantity: 1 }, { itemId: 'root_crown', quantity: 1 }],
    rewardLine: 'Rewards: Ember Shard x2, Root Crown, Elixir x1\nPip can now forage for a bonus cache.',
  },
  cartographers_lie_battle: {
    emberShards: 3,
    items: [{ itemId: 'true_map', quantity: 1 }, { itemId: 'mana_elixir', quantity: 1 }],
    rewardLine: 'Rewards: True Map, Ether Elixir, Ember Shard x3\nThe route home is finally honest.',
  },
}

type EntityView = {
  rect: Phaser.GameObjects.Rectangle
  sprite?: Phaser.GameObjects.Image
  label: Phaser.GameObjects.Text
  hpFill: Phaser.GameObjects.Rectangle
  mpFill: Phaser.GameObjects.Rectangle
  resonanceTrack?: Phaser.GameObjects.Rectangle
  resonanceFill?: Phaser.GameObjects.Rectangle
  color: number
  spotlight: Phaser.GameObjects.Ellipse
}

const BASIC_ATTACK: Skill = {
  id: 'attack',
  name: 'Attack',
  type: 'physical',
  element: 'neutral',
  mpCost: 0,
  power: 16,
  target: 'single_enemy',
  description: 'A basic attack.',
  isResonance: false,
}

const COMMANDS = ['Attack', 'Skill', 'Defend', 'Item', 'Escape'] as const
type Command = (typeof COMMANDS)[number]

export class BattleScene extends Phaser.Scene {
  private initData: BattleInitData = {}
  private combat?: CombatSystem
  private entityViews = new Map<BattleEntity, EntityView>()
  private commandTexts: Phaser.GameObjects.Text[] = []
  private optionTexts: Phaser.GameObjects.Text[] = []
  private timelineDots: Phaser.GameObjects.Arc[] = []
  private currentNameText?: Phaser.GameObjects.Text
  private messageText?: Phaser.GameObjects.Text
  private selectedSkill?: Skill
  private validTargets: BattleEntity[] = []
  private potions = 3
  private saveData: SaveData | null = null
  private waitingForTarget = false
  private actionLocked = false
  private battleEnding = false
  private deathEffectDone = new Set<BattleEntity>()
  private turnIndicator?: Phaser.GameObjects.Ellipse
  private commandKeys?: Record<'one' | 'two' | 'three' | 'four' | 'five', Phaser.Input.Keyboard.Key>
  private resonanceFlashReady = new Set<BattleEntity>()

  constructor() {
    super('BattleScene')
  }

  init(data: BattleInitData) {
    this.initData = data
  }

  create() {
    const { width, height } = this.scale
    audioManager.playMusic(this.initData.isBoss ? 'boss' : 'battle')

    this.entityViews = new Map()
    this.commandTexts = []
    this.optionTexts = []
    this.timelineDots = []
    this.resonanceFlashReady = new Set()
    this.selectedSkill = undefined
    this.validTargets = []
    this.waitingForTarget = false
    this.actionLocked = false
    this.battleEnding = false
    this.commandKeys = this.input.keyboard?.addKeys({
      one: Phaser.Input.Keyboard.KeyCodes.ONE,
      two: Phaser.Input.Keyboard.KeyCodes.TWO,
      three: Phaser.Input.Keyboard.KeyCodes.THREE,
      four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      five: Phaser.Input.Keyboard.KeyCodes.FIVE,
    }) as Record<'one' | 'two' | 'three' | 'four' | 'five', Phaser.Input.Keyboard.Key> | undefined

    this.drawBackground(width, height)
    this.saveData = SaveSystem.load(0)
    this.potions = this.getInventoryQuantity('health_potion')
    this.createBattle()
    this.createEntityViews()
    this.createBottomPanel(width, height)
    this.createTimeline()
    this.cameras.main.fadeIn(360, 5, 6, 18)

    this.messageText = this.add
      .text(width / 2, height / 2, '', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(100)

    this.showBattleIntro(() => this.startTurn())
  }

  update() {
    if (!this.commandKeys || this.actionLocked || this.battleEnding || this.waitingForTarget || !this.combat?.currentEntity.isPlayer) {
      return
    }

    const selectedIndex = [this.commandKeys.one, this.commandKeys.two, this.commandKeys.three, this.commandKeys.four, this.commandKeys.five]
      .findIndex((key) => Phaser.Input.Keyboard.JustDown(key))
    if (selectedIndex >= 0) {
      this.selectCommand(COMMANDS[selectedIndex])
    }
  }

  private showBattleIntro(onComplete: () => void) {
    if (!this.initData.isBoss) {
      audioManager.playSfx('scene_whoosh')
      this.showMessage(`Battle Start!\nRelics are active.${this.getMiraIntroLine()}`, 1300, onComplete)
      return
    }

    const boss = BOSSES.find((entry) => entry.id === this.initData.enemyIds?.[0])
    const intro = boss?.introDialogue.join('\n') ?? 'A shrine guardian bars the way.'
    const { width, height } = this.scale
    const omen = this.add.rectangle(width / 2, height / 2 - 96, 760, 118, 0x240814, 0.62).setDepth(94).setStrokeStyle(2, 0xff6b6b, 0.64)
    const sigil = this.add.circle(width / 2, height / 2 - 96, 52, 0xff6b6b, 0.12).setDepth(94.5).setStrokeStyle(2, 0xffd36e, 0.46)
    this.tweens.add({ targets: sigil, scale: 1.25, alpha: 0, duration: 900, repeat: 2, ease: 'Sine.easeOut', onComplete: () => { omen.destroy(); sigil.destroy() } })
    this.cameras.main.flash(420, 210, 180, 255, false)
    this.cameras.main.shake(260, 0.006)
    audioManager.playSfx('boss_sting')
    this.showMessage(`${boss?.name ?? 'Guardian'}\n${intro}${this.getMiraIntroLine()}`, 3300, onComplete)
  }

  private getMiraIntroLine() {
    return this.saveData?.flags.mira_recruited ? '\nMira\'s arcane link bolsters the party. MAG +3.' : ''
  }

  private drawBackground(width: number, height: number) {
    this.cameras.main.setBackgroundColor('#0a0a1a')
    if (hasTexture(this, GENERATED_ASSETS.battleBg)) {
      this.add.image(width / 2, height / 2, GENERATED_ASSETS.battleBg).setDisplaySize(width, height)
    }

    const graphics = this.add.graphics()
    if (!hasTexture(this, GENERATED_ASSETS.battleBg)) {
      graphics.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x121236, 0x080814, 1)
      graphics.fillRect(0, 0, width, height)
    }
    graphics.fillStyle(0x040510, 0.28)
    graphics.fillRect(0, 0, width, height)
    graphics.fillStyle(0xffd36e, 0.045)
    graphics.fillRoundedRect(34, 68, 410, 386, 26)
    graphics.fillStyle(0x9ff3ff, 0.038)
    graphics.fillRoundedRect(528, 58, 390, 310, 26)
    graphics.lineStyle(1, this.initData.isBoss ? 0xff6b6b : 0xf0c040, 0.34)
    graphics.strokeRoundedRect(22, 22, width - 44, height - 172, 24)
  }

  private createBattle() {
    const party = ['nara', 'kael', 'io'].map((id) => {
      const savedMember = this.saveData?.party.find((member) => member.characterId === id)
      return this.createPartyEntity(CHARACTERS[id], savedMember?.level ?? 3, savedMember)
    })
    const enemyIds = this.initData.enemyIds?.length
      ? this.initData.enemyIds
      : ['vinecrawler', 'moss_knight']
    const enemies = enemyIds.map((id) => this.createEnemyEntity(id, Boolean(this.initData.isBoss)))

    this.combat = new CombatSystem(party, enemies.filter(Boolean))
  }

  private createPartyEntity(
    character: CharacterData,
    level: number,
    savedMember?: SaveData['party'][number],
  ): BattleEntity {
    const stats = this.applyEquipmentStats(
      this.scaleStats(character.baseStats, character.growth, level),
      savedMember,
    )
    return new BattleEntity({
      id: character.id,
      name: character.name,
      isPlayer: true,
      stats,
      currentHp: savedMember?.currentHp ?? stats.hp,
      currentMp: savedMember?.currentMp ?? stats.mp,
      skills: character.skills,
      element: character.element,
      weaknesses: [],
      resists: [],
    })
  }

  private createEnemyEntity(id: string, isBoss: boolean): BattleEntity {
    const data = isBoss
      ? BOSSES.find((boss) => boss.id === id) ?? BOSSES[0]
      : ENEMIES.find((enemy) => enemy.id === id) ?? ENEMIES[0]

    return new BattleEntity({
      id: data.id,
      name: data.name,
      isPlayer: false,
      stats: data.stats,
      currentHp: data.stats.hp,
      currentMp: data.stats.mp,
      skills: data.skills.map((skill) => this.enemySkillToSkill(skill)),
      element: this.normalizeElement(data.skills[0]?.element),
      weaknesses: data.weaknesses.map((element) => this.normalizeElement(element)),
      resists: data.resists.map((element) => this.normalizeElement(element)),
      expReward: data.expReward,
      goldReward: data.goldReward,
    })
  }

  private scaleStats(
    baseStats: CharacterStats,
    growth: CharacterData['growth'],
    level: number,
  ): CharacterStats {
    const levelUps = Math.max(0, level - 1)
    return {
      hp: baseStats.hp + growth.hp * levelUps,
      mp: baseStats.mp + growth.mp * levelUps,
      atk: baseStats.atk + growth.atk * levelUps,
      def: baseStats.def + growth.def * levelUps,
      spd: baseStats.spd + growth.spd * levelUps,
      mag: baseStats.mag + growth.mag * levelUps,
    }
  }

  private applyEquipmentStats(
    stats: CharacterStats,
    savedMember?: SaveData['party'][number],
  ): CharacterStats {
    const adjusted = { ...stats }
    const equippedIds = savedMember
      ? [savedMember.equipment.weapon, savedMember.equipment.charm, savedMember.equipment.relic]
      : []

    equippedIds.forEach((itemId) => {
      const item = itemId ? ITEMS_BY_ID[itemId] : undefined
      if (!item?.effect.stat || typeof item.effect.value !== 'number') {
        return
      }

      item.effect.stat.split(',').forEach((stat) => {
        const key = stat.trim() as keyof CharacterStats
        if (key in adjusted) {
          adjusted[key] += item.effect.value ?? 0
        }
      })
    })

    if (this.saveData?.home.workshop === 1) {
      adjusted.atk += 2
      adjusted.def += 1
    }

    if (this.saveData?.flags.mira_recruited) {
      adjusted.mag += 3
    }

    return adjusted
  }

  private createEntityViews() {
    if (!this.combat) {
      return
    }

    const partyColors: Record<string, number> = {
      nara: 0xff8a32,
      kael: 0xd94747,
      io: 0x3f8cff,
    }

    this.combat.party.forEach((entity, index) => {
      const x = 180 + index * 120
      this.createEntityView(entity, x, 400, partyColors[entity.id] ?? 0xff8a32)
    })

    this.combat.enemies.forEach((entity, index) => {
      const x = 620 + index * 110
      const y = 150 + (index % 2) * 72
      this.createEntityView(entity, x, y, entity.expReward > 100 ? 0x7336c7 : 0x3a8f58)
    })
  }

  private createEntityView(entity: BattleEntity, x: number, y: number, color: number) {
    const spotlight = this.add.ellipse(x, y + (entity.isPlayer ? 38 : 30), entity.isPlayer ? 96 : 114, entity.isPlayer ? 30 : 34, entity.isPlayer ? 0xffd36e : 0xff6b6b, 0.08).setDepth(0.45)
    this.add.ellipse(x, y + (entity.isPlayer ? 38 : 30), entity.isPlayer ? 48 : 58, 14, 0x050510, 0.46).setDepth(0.5)

    const rect = this.add
      .rectangle(x, y, entity.isPlayer ? 58 : 68, entity.isPlayer ? 72 : 58, color)
      .setStrokeStyle(2, entity.isPlayer ? 0xfff1a8 : 0x9ff3ff, 0.36)
      .setInteractive({ useHandCursor: true })
      .setAlpha(this.getEntityAssetKey(entity) ? 0.18 : 1)
      .setDepth(1)

    rect.on('pointerdown', () => this.tryTarget(entity))

    const assetKey = this.getEntityAssetKey(entity)
    const sprite = assetKey
      ? this.add
          .image(x, y - (entity.isPlayer ? 4 : 0), assetKey)
          .setInteractive({ useHandCursor: true })
          .setDepth(2)
      : undefined
    sprite?.setScale(entity.isPlayer ? 1.25 : 1.05)
    sprite?.on('pointerdown', () => this.tryTarget(entity))

    const label = this.add
      .text(x, y - 54, entity.name, {
        color: entity.isPlayer ? '#fff1a8' : '#ffffff',
        fontFamily: 'Georgia, serif',
        fontSize: '15px',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#000000', 6, true, true)

    const hpTrackW = 90
    const hpBarH = 8
    const hpY = y + 48
    this.add.rectangle(x - hpTrackW / 2, hpY, hpTrackW, hpBarH, 0x1a0a0a, 0.8).setOrigin(0, 0.5).setDepth(10)
    this.add.rectangle(x - hpTrackW / 2, hpY, hpTrackW, hpBarH, 0x2a1515, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, 0x4a2020, 0.4).setDepth(10.1)
    const hpFill = this.add.rectangle(x - hpTrackW / 2 + 1, hpY, hpTrackW - 2, hpBarH - 2, 0x36d65f).setOrigin(0, 0.5).setDepth(10.2)
    const mpTrackW = 68
    const mpBarH = 6
    const mpY = y + 60
    this.add.rectangle(x - mpTrackW / 2, mpY, mpTrackW, mpBarH, 0x0a0a1a, 0.8).setOrigin(0, 0.5).setDepth(10)
    this.add.rectangle(x - mpTrackW / 2, mpY, mpTrackW, mpBarH, 0x101828, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, 0x1a2040, 0.4).setDepth(10.1)
    const mpFill = this.add.rectangle(x - mpTrackW / 2 + 1, mpY, mpTrackW - 2, mpBarH - 2, 0x3f8cff).setOrigin(0, 0.5).setDepth(10.2)
    const resonanceY = y + 70
    const resonanceTrack = entity.isPlayer
      ? this.add.rectangle(x - 36, resonanceY, 72, 5, 0x052a2a, 0.72).setOrigin(0, 0.5).setDepth(10).setVisible(false)
      : undefined
    const resonanceFill = entity.isPlayer
      ? this.add.rectangle(x - 36, resonanceY, 0, 3, 0x00e5cc).setOrigin(0, 0.5).setDepth(10.2).setVisible(false)
      : undefined

    this.entityViews.set(entity, { rect, sprite, label, hpFill, mpFill, resonanceTrack, resonanceFill, color, spotlight })
  }

  private getEntityAssetKey(entity: BattleEntity): string | undefined {
    const key = entity.isPlayer
      ? GENERATED_ASSETS.heroes[entity.id as keyof typeof GENERATED_ASSETS.heroes]
      : GENERATED_ASSETS.enemies[entity.id as keyof typeof GENERATED_ASSETS.enemies]
    return key && hasTexture(this, key) ? key : undefined
  }

  private createBottomPanel(width: number, height: number) {
    const panelY = height - 140
    this.add.rectangle(width / 2, panelY - 6, width - 20, 10, 0xffd36e, 0.12).setDepth(48.5)
    if (hasTexture(this, GENERATED_ASSETS.uiPanel)) {
      this.add.image(width / 2, panelY + 70, GENERATED_ASSETS.uiPanel).setDisplaySize(width - 24, 132).setAlpha(0.96)
    } else {
      this.add.rectangle(12, panelY, width - 24, 132, 0x0a0e1e, 0.96).setOrigin(0).setStrokeStyle(2, 0xf3e1b0, 0.55).setDepth(49)
      const cg = this.add.graphics().setDepth(49.1)
      cg.lineStyle(2, 0xf0c040, 0.4)
      cg.beginPath(); cg.moveTo(18, panelY + 10); cg.lineTo(18, panelY + 2); cg.lineTo(26, panelY + 2); cg.strokePath()
      cg.beginPath(); cg.moveTo(width - 18, panelY + 10); cg.lineTo(width - 18, panelY + 2); cg.lineTo(width - 26, panelY + 2); cg.strokePath()
    }

    this.add.text(32, panelY + 18, 'ACTIVE ACTOR', {
      color: '#8ab4f8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '11px',
    }).setDepth(50)

    this.currentNameText = this.add.text(32, panelY + 36, '', {
      color: '#f0c040',
      fontFamily: 'Georgia, serif',
      fontSize: '22px',
    }).setDepth(50)

    COMMANDS.forEach((command, index) => {
      const chip = this.add.rectangle(54 + index * 116, panelY + 82, 100, 42, 0x11172a, 0.72).setDepth(49.5).setStrokeStyle(1, 0xf0c040, 0.24)
      const numText = this.add.text(14 + index * 116, panelY + 69, `${index + 1}`, {
        color: '#f0c040',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
      }).setDepth(50)
      const text = this.add
        .text(34 + index * 116, panelY + 80, command, {
          color: '#d7d9e8',
          fontFamily: 'Arial, sans-serif',
          fontSize: '20px',
        })
        .setInteractive({ useHandCursor: true })
        .setDepth(50)
      text.on('pointerdown', () => this.selectCommand(command))
      text.on('pointerover', () => { text.setColor('#fff1a8'); numText.setColor('#fff1a8'); chip.setStrokeStyle(1, 0xfff1a8, 0.62) })
      text.on('pointerout', () => { text.setColor('#d7d9e8'); numText.setColor('#f0c040'); chip.setStrokeStyle(1, 0xf0c040, 0.24) })
      this.commandTexts.push(text)
    })

    this.add.text(width - 330, panelY + 24, 'Commands 1–5 • Target with mouse/tap', {
      color: '#8ab4f8',
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
    }).setDepth(50)
  }

  private createTimeline() {
    this.timelineDots.forEach((dot) => dot.destroy())
    this.timelineDots = []

    if (!this.combat) {
      return
    }

    this.combat.turnOrder.slice(0, 10).forEach((entity, index) => {
      const dot = this.add
        .circle(352 + index * 28, 34, 8, entity.isPlayer ? 0xf0c040 : 0xd94747)
        .setStrokeStyle(entity === this.combat?.currentEntity ? 3 : 1, 0xffffff, 0.8)
      this.timelineDots.push(dot)
    })
  }

  private startTurn() {
    if (!this.combat) {
      return
    }

    this.refreshUi()

    if (this.combat.state === 'victory' || this.combat.state === 'defeat') {
      this.handleBattleEnd()
      return
    }

    if (!this.combat.beginCurrentTurn()) {
      this.time.delayedCall(400, () => this.startTurn())
      return
    }

    this.refreshUi()
    const actor = this.combat.currentEntity
    this.currentNameText?.setText(actor.name)
    this.updateTurnIndicator()
    if (actor.isPlayer) {
      this.showActionMenu()
      return
    }

    this.clearOptions()
    this.clearTargeting()
    this.setCommandsEnabled(false)
    this.showMessage(`${actor.name} prepares an attack`, 700, () => this.executeEnemyTurn())
  }

  private showActionMenu() {
    if (!this.combat) {
      return
    }

    this.actionLocked = false
    this.clearOptions()
    this.clearTargeting()
    this.setCommandsEnabled(true)
    this.currentNameText?.setText(this.combat.currentEntity.name)
    this.updateTurnIndicator()
  }

  private updateTurnIndicator() {
    this.turnIndicator?.destroy()
    if (!this.combat?.currentEntity) return
    const view = this.entityViews.get(this.combat.currentEntity)
    if (!view) return
    const target = view.sprite ?? view.rect
    view.spotlight.setFillStyle(this.combat.currentEntity.isPlayer ? 0xffd36e : 0xff6b6b, 0.18)
    this.turnIndicator = this.add.ellipse(target.x, target.y + 18, 92, 30, 0xfff1a8, 0).setDepth(0.8).setStrokeStyle(2, 0xfff1a8, 0.55)
    this.tweens.add({
      targets: this.turnIndicator,
      alpha: 0.12,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private selectCommand(command: Command) {
    if (!this.combat || !this.combat.currentEntity.isPlayer || this.actionLocked || this.battleEnding) {
      return
    }

    this.clearOptions()
    this.clearTargeting()
    audioManager.playSfx('ui_confirm')

    if (command === 'Attack') {
      this.beginTargetSelection(BASIC_ATTACK)
      return
    }

    if (command === 'Skill') {
      this.showSkillOptions()
      return
    }

    if (command === 'Defend') {
      this.actionLocked = true
      this.setCommandsEnabled(false)
      this.combat.currentEntity.statusEffects.set('buff_def', 1)
      audioManager.playSfx('defend_guard')
      this.showMessage(`${this.combat.currentEntity.name} defends`, 550, () => {
        this.combat?.finishAction()
        this.startTurn()
      })
      return
    }

    if (command === 'Item') {
      this.showItemOptions()
      return
    }

    this.tryEscape()
  }

  private showSkillOptions() {
    if (!this.combat) {
      return
    }

    const actor = this.combat.currentEntity
    actor.skills.filter((skill) => !skill.isResonance || actor.resonance >= 100).forEach((skill, index) => {
      const canUse = actor.currentMp >= skill.mpCost && (!skill.isResonance || actor.resonance >= 100)
      const text = this.add
        .text(32, this.scale.height - 38 - index * 26, `${skill.name}  MP ${skill.mpCost}`, {
          color: canUse ? '#d7d9e8' : '#74788f',
          fontFamily: 'Arial, sans-serif',
          fontSize: '17px',
        })
        .setInteractive({ useHandCursor: canUse })
      text.on('pointerdown', () => {
        if (canUse) {
          audioManager.playSfx('ui_blip')
          this.beginTargetSelection(skill)
        }
      })
      this.optionTexts.push(text)
    })
  }

  private showItemOptions() {
    const text = this.add
      .text(32, this.scale.height - 38, `Health Potion x${this.potions}`, {
        color: this.potions > 0 ? '#d7d9e8' : '#74788f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '17px',
      })
      .setInteractive({ useHandCursor: this.potions > 0 })

    text.on('pointerdown', () => {
      if (!this.combat || this.potions <= 0) {
        return
      }
      this.selectedSkill = undefined
      audioManager.playSfx('ui_blip')
      this.waitingForTarget = true
      this.validTargets = this.combat.party.filter((entity) => entity.isAlive)
      this.highlightTargets(this.validTargets)
    })
    this.optionTexts.push(text)
  }

  private beginTargetSelection(skill: Skill) {
    if (!this.combat || this.actionLocked || this.battleEnding) {
      return
    }

    if (!this.combat.selectSkill(skill)) {
      audioManager.playSfx('ui_cancel')
      this.showMessage('Not enough MP', 700, () => this.showActionMenu())
      return
    }

    audioManager.playSfx(skill.type === 'magical' || skill.type === 'heal' ? 'magic_cast' : 'attack_thrust')

    this.selectedSkill = skill
    this.waitingForTarget = true
    this.validTargets = this.combat.getValidTargets(this.combat.currentEntity, skill.target)
    this.highlightTargets(this.validTargets)
  }

  private tryTarget(target: BattleEntity) {
    if (!this.combat || this.actionLocked || this.battleEnding || !this.waitingForTarget || !this.validTargets.includes(target)) {
      return
    }

    this.actionLocked = true
    this.setCommandsEnabled(false)

    if (!this.selectedSkill) {
      this.usePotion(target)
      return
    }

    const targets =
      this.selectedSkill.target === 'all_enemies' || this.selectedSkill.target === 'all_allies'
        ? this.validTargets
        : [target]
    const results = this.combat.executeSelectedSkill(targets)
    this.afterAction(targets, results)
  }

  private usePotion(target: BattleEntity) {
    if (!this.combat || this.potions <= 0) {
      return
    }

    this.potions -= 1
    this.addInventory('health_potion', -1)
    this.persistSave()
    audioManager.playSfx('item_use')
    const healed = Math.min(45, target.maxHp - target.currentHp)
    target.currentHp = Math.min(target.maxHp, target.currentHp + 45)
    this.showFloatingNumber(target, healed || 0, true)
    this.combat.finishAction()
    this.afterAction([target], [])
  }

  private executeEnemyTurn() {
    if (!this.combat) {
      return
    }

    const before = new Map(
      [...this.combat.party, ...this.combat.enemies].map((entity) => [entity, entity.currentHp]),
    )
    this.combat.executeEnemyTurn()
    audioManager.playSfx('attack_swing')
    const changedTargets = [...this.combat.party, ...this.combat.enemies].filter(
      (entity) => before.get(entity) !== entity.currentHp,
    )

    changedTargets.forEach((target) => {
      const delta = target.currentHp - (before.get(target) ?? target.currentHp)
      this.showFloatingNumber(target, Math.abs(delta), delta > 0)
      this.flashTarget(target)
      audioManager.playSfx(delta > 0 ? 'heal' : 'hit_physical')
    })
    if (changedTargets.some((target) => (before.get(target) ?? target.currentHp) > target.currentHp)) {
      this.cameras.main.shake(100, 0.01)
    }

    this.afterAction(changedTargets, [])
  }

  private afterAction(targets: BattleEntity[], results: ReturnType<CombatSystem['executeSkill']>) {
    const actedSkill = this.selectedSkill
    this.clearTargeting()
    this.setCommandsEnabled(false)
    this.refreshUi()

    results.forEach((result, index) => {
      const target = targets[index]
      if (!target || result.missed) {
        return
      }
      this.showFloatingNumber(target, result.damage, result.healed, result.critical, result.effectiveness)
      this.flashTarget(target)
      if (result.healed) {
        audioManager.playSfx('heal')
      } else if (result.critical || result.effectiveness === 'super_effective') {
        audioManager.playSfx('critical_flash')
        this.time.delayedCall(45, () => audioManager.playSfx('impact_heavy'))
      } else {
        audioManager.playSfx(actedSkill?.type === 'magical' ? 'hit_magical' : 'hit_physical')
      }
      if (!result.healed) {
        this.cameras.main.shake(100, 0.01)
      }
    })

    if (this.combat?.state === 'victory' || this.combat?.state === 'defeat') {
      this.time.delayedCall(800, () => this.handleBattleEnd())
      return
    }

    this.time.delayedCall(800, () => this.startTurn())
  }

  private tryEscape() {
    if (!this.combat || this.actionLocked || this.battleEnding) {
      return
    }

    this.actionLocked = true
    this.setCommandsEnabled(false)

    if (this.initData.isBoss) {
      audioManager.playSfx('ui_cancel')
      this.showMessage('The seal refuses retreat!', 800, () => {
        this.actionLocked = false
        this.showActionMenu()
      })
      return
    }

    if (Math.random() < 0.5) {
      this.combat.state = 'escaped'
      audioManager.playSfx('ui_confirm')
      this.showMessage('Escaped!', 700, () => this.scene.start('OverworldScene', { continueGame: true }))
      return
    }

    audioManager.playSfx('ui_cancel')
    this.showMessage('Could not escape!', 700, () => {
      this.combat?.finishAction()
      this.actionLocked = false
      this.startTurn()
    })
  }

  private handleBattleEnd() {
    if (!this.combat || this.battleEnding) {
      return
    }

    this.battleEnding = true
    this.clearOptions()
    this.setCommandsEnabled(false)
    this.refreshUi()

    if (this.combat.state === 'victory') {
      const reward = this.combat.getReward()
      const bossReward = this.initData.battleId ? BOSS_BATTLE_REWARDS[this.initData.battleId] : undefined
      const emberShards = bossReward?.emberShards ?? (this.initData.battleId ? 1 : 0)
      const itemRewards = bossReward?.items ?? [{ itemId: 'health_potion', quantity: 1 }]
      audioManager.playMusic('victory')
      audioManager.playSfx('victory_fanfare')
      this.cameras.main.flash(450, 255, 241, 168, false)
      this.showVictoryCard(reward.exp, reward.gold, bossReward?.rewardLine ?? `Rewards: Ember Shard x${emberShards}, Potion x1\nPress onward to claim your prize.`, Boolean(bossReward))
      this.showMessage(`Victory!\nEXP +${reward.exp}   Gold +${reward.gold}\n${bossReward?.rewardLine ?? `Rewards: Ember Shard x${emberShards}, Potion x1\nPress onward to claim your prize.`}`, bossReward ? 3900 : 3100, () => {
        this.cameras.main.fadeOut(420, 5, 6, 18)
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('OverworldScene', {
            continueGame: true,
            battleResult: {
              battleId: this.initData.battleId,
              victory: true,
              rewards: { exp: reward.exp, gold: reward.gold, emberShards, items: itemRewards },
            },
          })
        })
      })
      return
    }

    if (this.combat.state === 'defeat') {
      this.showMessage('Defeat...\nYou regroup at the last safe point.', 1800, () => {
        const hasSave = Boolean(SaveSystem.load(0))
        this.scene.start('OverworldScene', hasSave ? { continueGame: true, battleResult: { victory: false } } : { newGame: true, battleResult: { victory: false } })
      })
    }
  }

  private refreshUi() {
    if (!this.combat) {
      return
    }

    for (const [entity, view] of this.entityViews) {
      const hpRatio = Phaser.Math.Clamp(entity.currentHp / entity.maxHp, 0, 1)
      const mpRatio = entity.maxMp > 0 ? Phaser.Math.Clamp(entity.currentMp / entity.maxMp, 0, 1) : 0
      view.hpFill.width = Math.max(0, 86 * hpRatio)
      view.hpFill.fillColor = hpRatio > 0.35 ? 0x36d65f : hpRatio > 0.15 ? 0xd4a020 : 0xd94747
      view.mpFill.width = Math.max(0, 64 * mpRatio)
      if (view.resonanceTrack && view.resonanceFill) {
        const resonanceRatio = Phaser.Math.Clamp(entity.resonance / 100, 0, 1)
        const visible = entity.resonance > 0
        view.resonanceTrack.setVisible(visible)
        view.resonanceFill.setVisible(visible)
        view.resonanceFill.width = Math.max(0, 72 * resonanceRatio)
        if (entity.resonance >= 100 && !this.resonanceFlashReady.has(entity)) {
          this.resonanceFlashReady.add(entity)
          view.resonanceFill.setFillStyle(0xffd36e)
          this.tweens.add({ targets: view.resonanceFill, alpha: 0.35, yoyo: true, duration: 140, repeat: 3, onComplete: () => view.resonanceFill?.setFillStyle(0x00e5cc).setAlpha(1) })
        } else if (entity.resonance < 100) {
          this.resonanceFlashReady.delete(entity)
          view.resonanceFill.setFillStyle(0x00e5cc).setAlpha(1)
        }
      }
      view.rect.setAlpha(entity.isAlive ? 1 : 0.35)
      view.spotlight.setAlpha(entity.isAlive ? 1 : 0.2)
      if (entity !== this.combat?.currentEntity) {
        view.spotlight.setFillStyle(entity.isPlayer ? 0xffd36e : 0xff6b6b, 0.08)
      }
      if (view.sprite) {
        view.sprite.setAlpha(entity.isAlive ? 1 : 0.35)
      }
      view.label.setAlpha(entity.isAlive ? 1 : 0.45)
      if (!entity.isAlive && !this.deathEffectDone.has(entity)) {
        this.deathEffectDone.add(entity)
        this.addDeathEffect(view)
      }
    }

    this.currentNameText?.setText(this.combat.currentEntity?.name ?? '')
    this.createTimeline()
  }

  private setCommandsEnabled(enabled: boolean) {
    this.commandTexts.forEach((text) => {
      if (enabled) {
        text.setInteractive({ useHandCursor: true }).setAlpha(1)
      } else {
        text.disableInteractive().setAlpha(0.45)
      }
    })
  }

  private highlightTargets(targets: BattleEntity[]) {
    targets.forEach((target) => {
      const view = this.entityViews.get(target)
      view?.rect.setStrokeStyle(4, 0xfff1a8, 1)
      view?.spotlight.setFillStyle(0xfff1a8, 0.2)
    })
  }

  private clearTargeting() {
    this.waitingForTarget = false
    this.selectedSkill = undefined
    this.validTargets = []
    for (const [entity, view] of this.entityViews) {
      view.rect.setStrokeStyle(2, entity.isPlayer ? 0xffffff : 0x8ab4f8, 0.25)
      view.spotlight.setFillStyle(entity.isPlayer ? 0xffd36e : 0xff6b6b, 0.08)
    }
  }

  private clearOptions() {
    this.optionTexts.forEach((text) => text.destroy())
    this.optionTexts = []
  }

  private showMessage(message: string, duration: number, onComplete?: () => void) {
    this.messageText?.setText(message).setAlpha(1)
    this.time.delayedCall(duration, () => {
      this.messageText?.setText('')
      onComplete?.()
    })
  }

  private showFloatingNumber(
    entity: BattleEntity,
    amount: number,
    healed: boolean,
    critical = false,
    effectiveness = 'normal',
  ) {
    const view = this.entityViews.get(entity)
    if (!view) {
      return
    }

    const burstColor = healed ? 0x45e67a : effectiveness === 'super_effective' || critical ? 0xfff1a8 : 0xff5050
    const burst = this.add.circle(view.rect.x, view.rect.y - 8, critical || effectiveness === 'super_effective' ? 34 : 24, burstColor, healed ? 0.08 : 0.16).setDepth(89)
    this.tweens.add({ targets: burst, scale: 1.8, alpha: 0, duration: 260, ease: 'Sine.easeOut', onComplete: () => burst.destroy() })

    const text = this.add
      .text(view.rect.x, view.rect.y - 44, `${critical ? 'CRIT ' : ''}${healed ? '+' : '-'}${amount}${effectiveness === 'super_effective' ? '!' : ''}`, {
        color: healed ? '#45e67a' : effectiveness === 'super_effective' ? '#fff1a8' : '#ff5050',
        fontFamily: 'Arial, sans-serif',
        fontSize: critical || effectiveness === 'super_effective' ? '24px' : '20px',
      })
      .setOrigin(0.5)
      .setDepth(90)

    this.tweens.add({
      targets: text,
      y: text.y - (critical || effectiveness === 'super_effective' ? 46 : 34),
      alpha: 0,
      scale: critical || effectiveness === 'super_effective' ? 1.18 : 1,
      duration: critical || effectiveness === 'super_effective' ? 860 : 700,
      ease: 'Sine.easeOut',
      onComplete: () => text.destroy(),
    })
  }

  private flashTarget(entity: BattleEntity) {
    const view = this.entityViews.get(entity)
    if (!view) return
    const targets = [view.rect, view.sprite, view.spotlight].filter(Boolean) as Phaser.GameObjects.GameObject[]
    this.tweens.add({ targets, x: '+=7', duration: 45, yoyo: true, repeat: 2, ease: 'Stepped' })
    view.rect.setStrokeStyle(4, 0xffffff, 0.95)
    this.time.delayedCall(160, () => view.rect.setStrokeStyle(2, entity.isPlayer ? 0xffffff : 0x8ab4f8, 0.25))
  }

  private showVictoryCard(exp: number, gold: number, rewardLine: string, bossReward: boolean) {
    const { width, height } = this.scale
    const glow = this.add.rectangle(width / 2, height / 2 - 108, 642, bossReward ? 170 : 150, bossReward ? 0xffd36e : 0x9ff3ff, 0.08).setDepth(97.8)
    const panel = this.add.rectangle(width / 2, height / 2 - 108, 600, bossReward ? 142 : 124, 0x181020, 0.96).setDepth(98).setStrokeStyle(2, bossReward ? 0xffd36e : 0x9ff3ff, 0.86)
    const title = this.add.text(width / 2, height / 2 - 150, bossReward ? 'COVENANT FULFILLED' : 'VICTORY', { color: bossReward ? '#ffd36e' : '#fff1a8', fontFamily: 'Georgia, serif', fontSize: bossReward ? '24px' : '28px' }).setOrigin(0.5).setDepth(99)
    const rewards = this.add.text(width / 2, height / 2 - 108, `EXP +${exp}    Gold +${gold}\n${rewardLine}`, { align: 'center', color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: 540 } }).setOrigin(0.5).setDepth(99)
    panel.setScale(0.92)
    title.setAlpha(0)
    rewards.setAlpha(0)
    this.tweens.add({ targets: panel, scale: 1, duration: 260, ease: 'Back.easeOut' })
    this.tweens.add({ targets: [title, rewards], alpha: 1, delay: 120, duration: 240 })
    for (let i = 0; i < 5; i++) {
      const sparkle = this.add.circle(width / 2 + Phaser.Math.Between(-180, 180), height / 2 - 108, Phaser.Math.Between(2, 4), 0xffd36e, 0.8).setDepth(99.5)
      this.tweens.add({
        targets: sparkle,
        y: sparkle.y - Phaser.Math.Between(30, 60),
        alpha: 0,
        duration: Phaser.Math.Between(600, 1200),
        delay: 200 + i * 80,
        ease: 'Sine.easeOut',
        onComplete: () => sparkle.destroy(),
      })
    }
    this.tweens.add({ targets: [glow, panel, title, rewards], alpha: 0, delay: bossReward ? 3150 : 2450, duration: 360, onComplete: () => { glow.destroy(); panel.destroy(); title.destroy(); rewards.destroy() } })
  }

  private addDeathEffect(view: EntityView) {
    const target = view.sprite ?? view.rect
    if (!target || !target.active) return
    const x = target.x
    const y = target.y
    for (let i = 0; i < 3; i++) {
      const particle = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff, 0.7).setDepth(95)
      this.tweens.add({
        targets: particle,
        x: x + Phaser.Math.Between(-30, 30),
        y: y + Phaser.Math.Between(-30, 10),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(400, 700),
        delay: i * 60,
        ease: 'Sine.easeOut',
        onComplete: () => particle.destroy(),
      })
    }
  }

  private enemySkillToSkill(skill: EnemySkill): Skill {
    return {
      id: skill.id,
      name: skill.name,
      type: skill.power > 0 ? 'physical' : 'buff',
      element: this.normalizeElement(skill.element),
      mpCost: 0,
      power: skill.power || 1,
      target: skill.power > 0 ? 'single_enemy' : 'self',
      description: skill.name,
      isResonance: false,
    }
  }

  private normalizeElement(element: string | undefined): Element {
    switch (element) {
      case 'wind':
      case 'ember':
      case 'arcane':
      case 'ice':
      case 'thunder':
      case 'earth':
      case 'light':
      case 'dark':
      case 'neutral':
        return element
      case 'fire':
        return 'ember'
      default:
        return 'neutral'
    }
  }

  private getInventoryQuantity(itemId: string): number {
    return this.saveData?.inventory.find((item) => item.itemId === itemId)?.quantity ?? 3
  }

  private addInventory(itemId: string, quantity: number) {
    if (!this.saveData) {
      return
    }

    const item = this.saveData.inventory.find((entry) => entry.itemId === itemId)
    if (item) {
      item.quantity = Math.max(0, item.quantity + quantity)
    } else if (quantity > 0) {
      this.saveData.inventory.push({ itemId, quantity })
    }
  }

  private persistSave() {
    if (this.saveData && !SaveSystem.autoSave(this.saveData)) {
      this.showMessage('Could not save item use. Browser storage may be blocked.', 900)
    }
  }
}
