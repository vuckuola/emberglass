import Phaser from 'phaser'
import { VirtualJoystick } from './VirtualJoystick'

type SceneAccess = Phaser.Scene & Record<string, any>
type TouchButton = {
  container: Phaser.GameObjects.Container
  radius: number
  action: 'attack' | 'dash' | 'block' | 'interact' | 'pause' | 'confirm' | 'cancel' | 'skill'
  skillIndex?: number
}

const INTERACTION_TILES = [
  { x: 8, y: 3 },
  { x: 5, y: 4 },
  { x: 7, y: 4 },
  { x: 4, y: 9 },
  { x: 24, y: 9 },
  { x: 3, y: 13 },
  { x: 5, y: 21 },
  { x: 10, y: 18 },
  { x: 7, y: 16 },
  { x: 4, y: 12 },
  { x: 9, y: 21 },
  { x: 12, y: 20 },
  { x: 20, y: 18 },
  { x: 20, y: 23 },
  { x: 36, y: 28 },
  { x: 25, y: 4 },
  { x: 27, y: 5 },
  { x: 27, y: 6 },
] as const

export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
}

export class TouchControls {
  readonly isMobileDevice = isTouchDevice()

  private readonly scene: SceneAccess
  private joystick?: VirtualJoystick
  private readonly buttons: TouchButton[] = []
  private readonly skillCooldowns: Phaser.GameObjects.Graphics[] = []
  private readonly skillLabels: Phaser.GameObjects.Text[] = []
  private orientationOverlay?: Phaser.GameObjects.Container
  private menuButtons?: Phaser.GameObjects.Container

  constructor(scene: Phaser.Scene) {
    this.scene = scene as SceneAccess
    if (!this.isMobileDevice) return

    const { width, height } = this.scene.scale
    this.joystick = new VirtualJoystick(this.scene, 80, height - 80)
    this.createActionButtons(width, height)
    this.createSkillButtons(width, height)
    this.createPauseButton(width)
    this.createOrientationOverlay(width, height)
    this.scene.skillBar?.setVisible(false)
    this.scene.scale.on('resize', this.handleResize)
    screen.orientation?.addEventListener?.('change', this.updateOrientationWarning)
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy())
    this.update()
  }

  update(): void {
    if (!this.isMobileDevice) return
    this.scene.touchMove = this.joystick?.value ?? { x: 0, y: 0 }
    const hasTarget = this.hasInteractionTarget()
    const inCombat = this.isInCombat()
    const gameControlsVisible = !this.scene.menuOverlay && !this.scene.pauseOverlay
    this.setButtonVisible('attack', gameControlsVisible)
    this.setButtonVisible('dash', gameControlsVisible)
    this.setButtonVisible('interact', gameControlsVisible && hasTarget)
    this.setButtonVisible('block', gameControlsVisible && inCombat && !hasTarget)
    this.setSkillButtonsVisible(this.hasUnlockedSkills() && gameControlsVisible)
    this.updateSkillCooldowns()
    this.updateMenuButtons()
    this.updateOrientationWarning()
  }

  containsScreenPoint(x: number, y: number): boolean {
    if (!this.isMobileDevice) return false
    if (this.joystick?.contains(x, y)) return true
    return this.buttons.some((button) => button.container.visible && Phaser.Math.Distance.Between(x, y, button.container.x, button.container.y) <= button.radius)
  }

  destroy(): void {
    this.joystick?.destroy()
    this.buttons.forEach((button) => button.container.destroy())
    this.orientationOverlay?.destroy()
    this.menuButtons?.destroy()
    this.scene.scale.off('resize', this.handleResize)
    screen.orientation?.removeEventListener?.('change', this.updateOrientationWarning)
    this.scene.touchMove = null
    this.scene.touchBlockActive = false
    this.scene.skillBar?.setVisible(true)
  }

  private createActionButtons(width: number, height: number): void {
    const anchorX = width - 92
    const anchorY = height - 82
    this.createButton(anchorX, anchorY, 64, 0xb91c1c, '⚔', 'attack')
    this.createButton(anchorX - 72, anchorY - 2, 52, 0x2563eb, '➜', 'dash')
    this.createButton(anchorX - 22, anchorY - 72, 52, 0x15803d, '⬟', 'block')
    this.createButton(anchorX - 92, anchorY - 78, 48, 0xca8a04, 'E', 'interact')
  }

  private createSkillButtons(width: number, height: number): void {
    const startX = width - 248
    const y = height - 184
    for (let index = 0; index < 4; index += 1) {
      const button = this.createButton(startX + index * 52, y, 48, 0x3f3f46, `${index + 1}`, 'skill', index)
      const cooldown = this.scene.add.graphics().setScrollFactor(0).setDepth(224)
      const label = this.scene.add.text(button.container.x, button.container.y, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '13px', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0).setDepth(225)
      this.skillCooldowns[index] = cooldown
      this.skillLabels[index] = label
    }
  }

  private createPauseButton(width: number): void {
    this.createButton(width - 36, 34, 48, 0x111827, '⚙', 'pause')
  }

  private createButton(x: number, y: number, size: number, color: number, label: string, action: TouchButton['action'], skillIndex?: number): TouchButton {
    const radius = size / 2
    const container = this.scene.add.container(x, y).setScrollFactor(0).setDepth(220)
    const circle = this.scene.add.circle(0, 0, radius, color, 0.62).setStrokeStyle(2, 0xffffff, 0.42)
    const text = this.scene.add.text(0, 0, label, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: action === 'attack' ? '25px' : '18px', fontStyle: 'bold' }).setOrigin(0.5)
    container.add([circle, text])
    circle.setInteractive(new Phaser.Geom.Circle(0, 0, radius), Phaser.Geom.Circle.Contains)
    circle.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.preventDefault()
      this.pressButton(action, container, skillIndex)
    })
    if (action === 'block') {
      circle.on('pointerup', () => { this.scene.touchBlockActive = false; this.releaseButton(container) })
      circle.on('pointerout', () => { this.scene.touchBlockActive = false; this.releaseButton(container) })
    } else {
      circle.on('pointerup', () => this.releaseButton(container))
      circle.on('pointerout', () => this.releaseButton(container))
    }
    const button = { container, radius, action, skillIndex }
    this.buttons.push(button)
    return button
  }

  private pressButton(action: TouchButton['action'], container: Phaser.GameObjects.Container, skillIndex?: number): void {
    this.scene.tweens.killTweensOf(container)
    container.setScale(0.9)
    this.scene.tweens.add({ targets: container, scale: 1, duration: 120, ease: 'Back.easeOut' })
    navigator.vibrate?.(12)

    if (action === 'attack') {
      if (!this.scene.performPlayerAttack(undefined, undefined, 'space')) this.scene.bufferInput('attack')
    } else if (action === 'dash') {
      if (!this.scene.startDash()) this.scene.bufferInput('dash')
    } else if (action === 'block') {
      this.scene.touchBlockActive = true
      if (!this.scene.isBlocking) this.scene.blockStartTime = this.scene.time.now
    } else if (action === 'interact') {
      if (!this.scene.interact()) this.scene.bufferInput('interact')
    } else if (action === 'pause') {
      this.scene.pauseOverlay ? this.scene.closePauseOverlay() : this.scene.openPauseOverlay()
    } else if (action === 'skill' && skillIndex !== undefined) {
      this.scene.queueHint('skills', '1-4 for skills')
      this.scene.useRealtimeSkill(skillIndex)
    }
  }

  private releaseButton(container: Phaser.GameObjects.Container): void {
    this.scene.tweens.killTweensOf(container)
    this.scene.tweens.add({ targets: container, scale: 1, duration: 80, ease: 'Sine.easeOut' })
  }

  private setButtonVisible(action: TouchButton['action'], visible: boolean): void {
    this.buttons.filter((button) => button.action === action).forEach((button) => button.container.setVisible(visible))
  }

  private setSkillButtonsVisible(visible: boolean): void {
    this.buttons.filter((button) => button.action === 'skill').forEach((button) => button.container.setVisible(visible))
    this.skillCooldowns.forEach((graphics) => graphics.setVisible(visible))
    this.skillLabels.forEach((label) => label.setVisible(visible))
  }

  private updateSkillCooldowns(): void {
    const skills = this.scene.getRealtimeSkills?.() ?? []
    const hero = this.scene.saveData?.party?.[0]
    this.skillCooldowns.forEach((graphics, index) => {
      const button = this.buttons.find((entry) => entry.action === 'skill' && entry.skillIndex === index)
      const skill = skills[index]
      if (!button || !skill || !hero) return
      const remaining = Math.max(0, this.scene.skillReadyAt[index] - this.scene.time.now)
      graphics.clear().setVisible(button.container.visible)
      this.skillLabels[index]?.setPosition(button.container.x, button.container.y).setVisible(button.container.visible)
      if (remaining > 0) {
        graphics.fillStyle(0x02030a, 0.72).slice(button.container.x, button.container.y, 24, -90, -90 + 360 * (remaining / skill.cooldown), true).fillPath()
        this.skillLabels[index]?.setText(`${Math.ceil(remaining / 1000)}`)
      } else {
        this.skillLabels[index]?.setText(hero.currentMp < skill.mpCost ? `${skill.mpCost}` : '')
      }
    })
  }

  private updateMenuButtons(): void {
    if (!this.scene.menuOverlay) {
      this.menuButtons?.setVisible(false)
      return
    }
    if (!this.menuButtons) {
      const { width, height } = this.scene.scale
      this.menuButtons = this.scene.add.container(width - 92, height - 54).setScrollFactor(0).setDepth(230)
      const confirm = this.scene.add.text(-52, 0, 'OK', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', backgroundColor: '#14532dcc', padding: { x: 17, y: 13 } }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      const cancel = this.scene.add.text(18, 0, 'X', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '18px', backgroundColor: '#7f1d1dcc', padding: { x: 19, y: 13 } }).setOrigin(0.5).setInteractive({ useHandCursor: true })
      confirm.on('pointerdown', (pointer: Phaser.Input.Pointer) => { pointer.event.preventDefault(); this.scene.closeMenu() })
      cancel.on('pointerdown', (pointer: Phaser.Input.Pointer) => { pointer.event.preventDefault(); this.scene.closeMenu() })
      this.menuButtons.add([confirm, cancel])
    }
    this.menuButtons.setVisible(true)
  }

  private createOrientationOverlay(width: number, height: number): void {
    this.orientationOverlay = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(400).setVisible(false)
    this.orientationOverlay.add(this.scene.add.rectangle(width / 2, height / 2, width, height, 0x02030a, 0.9))
    this.orientationOverlay.add(this.scene.add.text(width / 2, height / 2 - 46, '↻', { color: '#fff1a8', fontFamily: 'Arial, sans-serif', fontSize: '54px', fontStyle: 'bold' }).setOrigin(0.5))
    this.orientationOverlay.add(this.scene.add.text(width / 2, height / 2 + 28, 'Please rotate your device for the best experience', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '22px', wordWrap: { width: width - 80 }, align: 'center' }).setOrigin(0.5))
  }

  private readonly handleResize = (gameSize: Phaser.Structs.Size) => {
    const width = gameSize.width
    const height = gameSize.height
    this.joystick?.setPosition(80, height - 80)
    this.repositionButton('attack', width - 92, height - 82)
    this.repositionButton('dash', width - 164, height - 84)
    this.repositionButton('block', width - 114, height - 154)
    this.repositionButton('interact', width - 184, height - 160)
    this.repositionButton('pause', width - 36, 34)
    this.buttons.filter((button) => button.action === 'skill').forEach((button, index) => button.container.setPosition(width - 248 + index * 52, height - 184))
    this.orientationOverlay?.destroy()
    this.createOrientationOverlay(width, height)
  }

  private repositionButton(action: TouchButton['action'], x: number, y: number): void {
    this.buttons.find((button) => button.action === action)?.container.setPosition(x, y)
  }

  private readonly updateOrientationWarning = () => {
    this.orientationOverlay?.setVisible(this.isMobileDevice && this.scene.scale.height > this.scene.scale.width)
  }

  private hasUnlockedSkills(): boolean {
    return Boolean(this.scene.saveData?.party?.[0]?.skills?.length) || (this.scene.saveData?.party?.[0]?.level ?? 1) >= 2
  }

  private isInCombat(): boolean {
    if (!this.scene.player) return false
    return this.scene.mapEnemies?.some((enemy: any) => !enemy.dead && Phaser.Math.Distance.Between(enemy.x, enemy.y, this.scene.player.x, this.scene.player.y) < enemy.aggroRange) ?? false
  }

  private hasInteractionTarget(): boolean {
    const tile = this.scene.getInteractionTile?.()
    const playerTile = this.scene.player ? this.scene.worldToTile?.(this.scene.player.x, this.scene.player.y) : null
    return INTERACTION_TILES.some((target) => this.scene.matchesTile?.(tile, target) || this.scene.matchesTile?.(playerTile, target))
  }
}
