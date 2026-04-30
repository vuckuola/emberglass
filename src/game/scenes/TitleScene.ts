import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { SaveSystem } from '../systems/SaveSystem'

const MENU_ITEMS = ['New Game', 'Continue', 'Settings', 'Credits'] as const
type MenuItem = (typeof MENU_ITEMS)[number]

export class TitleScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Text[] = []
  private cursor?: Phaser.GameObjects.Text
  private selectedIndex = 0
  private transitionLocked = false
  private notice?: Phaser.GameObjects.Text
  private saveSummary?: Phaser.GameObjects.Text

  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.scale
    audioManager.playMusic('title')
    this.transitionLocked = false
    this.notice = undefined
    this.saveSummary = undefined

    this.drawGradientBackground(width, height)
    this.createStarfield(width, height)
    this.createAurora(width)
    this.createMountainSilhouettes(width, height)
    this.createSkywellGlow(width)
    this.createEmbers(width, height)
    this.createDecorativeFrame(width, height)
    this.createHeroStage(width)
    this.createTitle(width)

    this.add
      .text(width / 2, 226, 'Covenant of the Skywell', {
        color: '#b9d9ff',
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#3a5a9a', 12, true, true)

    this.add
      .text(width / 2, 258, 'A handcrafted JRPG slice of emberlight, routes, relics, and boss vows', {
        color: '#d7d9e8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
      })
      .setOrigin(0.5)

    this.add
      .text(width / 2, 302, 'Start the showcase route', {
        color: '#ffd36e',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)

    const startY = 340

    MENU_ITEMS.forEach((label, index) => {
      const button = this.add
        .text(width / 2, startY + index * 48, label, {
          color: '#c0c4d8',
          fontFamily: 'Arial, sans-serif',
          fontSize: '25px',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      button.on('pointerover', () => {
        this.selectedIndex = index
        this.tweens.add({
          targets: button,
          scale: 1.05,
          duration: 140,
          ease: 'Sine.easeOut',
        })
        this.updateSelection()
      })

      button.on('pointerout', () => {
        this.tweens.add({
          targets: button,
          scale: 1,
          duration: 140,
          ease: 'Sine.easeOut',
        })
        this.updateSelection()
      })

      button.on('pointerdown', () => this.selectMenuItem(label))
      this.buttons.push(button)
    })

    this.createSaveSummary(width, startY)

    this.cursor = this.add.text(width / 2 - 120, startY, '◈', {
      color: '#ff8a32',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5)
      .setShadow(0, 0, '#ff8a32', 12, true, true)

    this.tweens.add({
      targets: this.cursor,
      alpha: 0.55,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })

    this.add
      .text(width / 2, height - 18, 'v0.18', {
        color: '#3a3050',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
      })
      .setOrigin(0.5)

    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.selectMenuItem(MENU_ITEMS[this.selectedIndex])
    })
    this.input.keyboard?.on('keydown-R', () => this.resetDemoSave())

    this.add
      .text(width / 2, height - 42, 'WASD/Arrows: Select  •  Enter/Tap: Confirm  •  R: Reset demo save', {
        color: '#5f6684',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
      })
      .setOrigin(0.5)

    this.updateSelection()
  }

  private drawGradientBackground(width: number, height: number) {
    const graphics = this.add.graphics()
    const stops = [
      { position: 0, color: 0x05050f },
      { position: 0.12, color: 0x08081a },
      { position: 0.24, color: 0x0d0a2e },
      { position: 0.38, color: 0x141034 },
      { position: 0.52, color: 0x1a0f20 },
      { position: 0.66, color: 0x211124 },
      { position: 0.78, color: 0x2a1520 },
      { position: 0.9, color: 0x321718 },
      { position: 1, color: 0x3a1a10 },
    ]

    for (let y = 0; y < height; y += 2) {
      const position = y / height
      const stopIndex = stops.findIndex((stop) => stop.position >= position)
      const end = stops[Math.max(stopIndex, 1)]
      const start = stops[Math.max(stopIndex - 1, 0)]
      const range = end.position - start.position || 1
      const amount = Phaser.Math.Clamp((position - start.position) / range, 0, 1)
      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.IntegerToColor(start.color),
        Phaser.Display.Color.IntegerToColor(end.color),
        100,
        amount * 100,
      )

      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1)
      graphics.fillRect(0, y, width, 2)
    }
  }

  private createStarfield(width: number, height: number) {
    for (let index = 0; index < 120; index += 1) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(8, Math.floor(height * 0.62)),
        Phaser.Math.FloatBetween(0.7, 1.8),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8),
      )

      if (index % 3 === 0) {
        this.tweens.add({
          targets: star,
          alpha: Phaser.Math.FloatBetween(0.15, 0.75),
          duration: Phaser.Math.Between(2000, 5000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }
    }
  }

  private createAurora(width: number) {
    const bands = [
      { y: 110, color: 0x1a6b5a, alpha: 0.14, offset: 0 },
      { y: 165, color: 0x3a5a9a, alpha: 0.12, offset: 1.4 },
      { y: 230, color: 0x5a3a7a, alpha: 0.09, offset: 2.8 },
      { y: 290, color: 0x1a6b5a, alpha: 0.08, offset: 4.2 },
    ]

    bands.forEach((band, bandIndex) => {
      const graphics = this.add.graphics()
      graphics.fillStyle(band.color, band.alpha)
      graphics.beginPath()
      graphics.moveTo(-80, band.y)

      for (let x = -80; x <= width + 80; x += 24) {
        const wave = Math.sin(x * 0.016 + band.offset) * (18 + bandIndex * 4)
        graphics.lineTo(x, band.y + wave)
      }

      for (let x = width + 80; x >= -80; x -= 24) {
        const wave = Math.sin(x * 0.014 + band.offset + 1.8) * (24 + bandIndex * 5)
        graphics.lineTo(x, band.y + 58 + wave)
      }

      graphics.closePath()
      graphics.fillPath()

      this.tweens.add({
        targets: graphics,
        x: bandIndex % 2 === 0 ? 36 : -36,
        duration: Phaser.Math.Between(7000, 11000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })
  }

  private createMountainSilhouettes(width: number, height: number) {
    this.drawMountainLayer(width, height, 380, 180, 0x26324a, 0.3, 0.018)
    this.drawMountainLayer(width, height, 420, 140, 0x141827, 0.5, 0.024)
    this.drawMountainLayer(width, height, 480, 80, 0x08080d, 0.8, 0.038)
  }

  private drawMountainLayer(
    width: number,
    height: number,
    baseline: number,
    maxHeight: number,
    color: number,
    alpha: number,
    frequency: number,
  ) {
    const graphics = this.add.graphics()
    graphics.fillStyle(color, alpha)
    graphics.beginPath()
    graphics.moveTo(0, height)
    graphics.lineTo(0, baseline)

    for (let x = 0; x <= width; x += 32) {
      const seeded =
        Math.sin(x * frequency + maxHeight * 0.13) * 0.5 +
        Math.sin(x * frequency * 2.7 + baseline * 0.07) * 0.3 +
        Math.sin(x * frequency * 5.1 + 4.5) * 0.2
      const normalized = (seeded + 1) / 2
      const y = baseline - normalized * maxHeight
      graphics.lineTo(x, y)
    }

    graphics.lineTo(width, height)
    graphics.closePath()
    graphics.fillPath()
  }

  private createSkywellGlow(width: number) {
    const container = this.add.container(width / 2, 380)
    const colors = [0xffd070, 0xffa43a, 0xd06020, 0x7a3218]

    for (let index = 0; index < 12; index += 1) {
      const radius = 200 - index * 15
      const alpha = 0.012 + index * 0.0025
      const circle = this.add.circle(0, 0, radius, colors[Math.floor(index / 3)], alpha)
      container.add(circle)
    }

    container.setAlpha(0.15)
    this.tweens.add({
      targets: container,
      alpha: 0.2,
      duration: 4000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    })
  }

  private createEmbers(width: number, height: number) {
    const colors = [0xff8a32, 0xffcc44, 0xff5533]

    for (let index = 0; index < 80; index += 1) {
      const radius = Phaser.Math.FloatBetween(1.2, 5)
      const color = Phaser.Utils.Array.GetRandom(colors)
      const ember = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        radius,
        color,
        Phaser.Math.FloatBetween(0.25, 0.75),
      )

      if (radius > 3.4) {
        ember.setStrokeStyle(2, color, 0.16)
      }

      const trail = this.add.circle(
        ember.x,
        ember.y + radius * 2.5,
        radius * 0.65,
        color,
        0.12,
      )

      this.driftEmber(ember, width, height, Phaser.Math.Between(0, 2200), trail)
    }
  }

  private driftEmber(
    ember: Phaser.GameObjects.Arc,
    width: number,
    height: number,
    delay = 0,
    trail?: Phaser.GameObjects.Arc,
  ) {
    if (trail) {
      trail.setPosition(ember.x, ember.y + ember.radius * 2.5)
      trail.setAlpha(ember.alpha * 0.28)
    }

    this.tweens.add({
      targets: trail ? [ember, trail] : ember,
      y: (target: Phaser.GameObjects.Arc) => target.y - height - 24,
      x: (target: Phaser.GameObjects.Arc) => target.x + Phaser.Math.Between(-40, 40),
      alpha: Phaser.Math.FloatBetween(0.1, 0.7),
      duration: Phaser.Math.Between(4200, 7800),
      delay,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        ember.setPosition(Phaser.Math.Between(0, width), height + 12)
        ember.setAlpha(Phaser.Math.FloatBetween(0.35, 0.8))
        this.driftEmber(ember, width, height, 0, trail)
      },
    })
  }

  private createDecorativeFrame(width: number, height: number) {
    const graphics = this.add.graphics()
    graphics.lineStyle(1, 0x3a3050, 0.85)
    graphics.strokeRect(18, 18, width - 36, height - 36)
    graphics.lineStyle(1, 0x5b4768, 0.28)
    graphics.strokeRect(28, 28, width - 56, height - 56)

    const cornerSize = 38
    const corners = [
      { x: 34, y: 34, sx: 1, sy: 1 },
      { x: width - 34, y: 34, sx: -1, sy: 1 },
      { x: 34, y: height - 34, sx: 1, sy: -1 },
      { x: width - 34, y: height - 34, sx: -1, sy: -1 },
    ]

    corners.forEach((corner) => {
      graphics.lineStyle(2, 0x3a3050, 0.9)
      graphics.beginPath()
      graphics.moveTo(corner.x, corner.y + corner.sy * cornerSize)
      graphics.lineTo(corner.x, corner.y)
      graphics.lineTo(corner.x + corner.sx * cornerSize, corner.y)
      graphics.strokePath()

      graphics.fillStyle(0x4b3a5f, 0.8)
      graphics.beginPath()
      graphics.moveTo(corner.x + corner.sx * 16, corner.y)
      graphics.lineTo(corner.x, corner.y + corner.sy * 16)
      graphics.lineTo(corner.x - corner.sx * 16, corner.y)
      graphics.lineTo(corner.x, corner.y - corner.sy * 16)
      graphics.closePath()
      graphics.fillPath()
    })
  }

  private createHeroStage(width: number) {
    const stage = this.add.graphics()
    stage.fillStyle(0x050713, 0.58)
    stage.fillRoundedRect(width / 2 - 308, 92, 616, 330, 28)
    stage.lineStyle(1, 0xf0c040, 0.28)
    stage.strokeRoundedRect(width / 2 - 308, 92, 616, 330, 28)
    stage.lineStyle(1, 0x9ff3ff, 0.18)
    stage.strokeRoundedRect(width / 2 - 282, 112, 564, 286, 22)

    const halo = this.add.ellipse(width / 2, 292, 390, 82, 0xff8a32, 0.07)
    const lens = this.add.ellipse(width / 2, 300, 250, 34, 0x9ff3ff, 0.08)
    this.tweens.add({ targets: [halo, lens], alpha: '+=0.05', duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })

    for (let index = 0; index < 5; index += 1) {
      const shard = this.add.polygon(width / 2 - 170 + index * 84, 286 + Math.sin(index) * 12, [0, -22, 12, 0, 0, 24, -12, 0], 0xffd36e, 0.12 + index * 0.015)
      shard.setStrokeStyle(1, 0xfff1a8, 0.18)
      this.tweens.add({ targets: shard, y: shard.y - 8, angle: index % 2 === 0 ? 5 : -5, duration: 1800 + index * 220, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' })
    }
  }

  private createTitle(width: number) {
    const title = 'EMBERGLASS'
    const letters: Phaser.GameObjects.Text[] = []
    const spacing = 36
    const startX = width / 2 - ((title.length - 1) * spacing) / 2

    title.split('').forEach((letter, index) => {
      const text = this.add
        .text(startX + index * spacing, 160 + Math.sin(index * 0.85) * 4, letter, {
          color: '#f0c040',
          fontFamily: 'Georgia, serif',
          fontSize: '56px',
        })
        .setOrigin(0.5)
        .setShadow(0, 0, '#f0c040', 16, true, true)

      letters.push(text)

      this.tweens.add({
        targets: text,
        y: text.y + 4,
        duration: 2200 + index * 90,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    })

    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tween) => {
        const amount = tween.getValue() ?? 0
        const color = Phaser.Display.Color.Interpolate.ColorWithColor(
          Phaser.Display.Color.HexStringToColor('#f0c040'),
          Phaser.Display.Color.HexStringToColor('#ffe070'),
          100,
          amount,
        )
        const hex = Phaser.Display.Color.RGBToString(color.r, color.g, color.b, 0, '#')
        letters.forEach((letter) => letter.setColor(hex))
      },
    })
  }

  private moveSelection(direction: number) {
    if (this.transitionLocked) {
      return
    }

    this.selectedIndex =
      (this.selectedIndex + direction + MENU_ITEMS.length) % MENU_ITEMS.length
    audioManager.playSfx('ui_blip')
    this.updateSelection()
  }

  private updateSelection() {
    this.buttons.forEach((button, index) => {
      button.setScale(index === this.selectedIndex ? 1.08 : 1)
      button.setColor(index === this.selectedIndex ? '#fff1a8' : '#c0c4d8')
      button.setShadow(
        0,
        0,
        index === this.selectedIndex ? '#fff1a8' : '#000000',
        index === this.selectedIndex ? 10 : 0,
        true,
        true,
      )
    })

    const selectedButton = this.buttons[this.selectedIndex]
    if (this.cursor && selectedButton) {
      this.cursor.setPosition(selectedButton.x - 120, selectedButton.y)
    }
  }

  private selectMenuItem(label: MenuItem) {
    if (this.transitionLocked) {
      return
    }

    const slotInfo = SaveSystem.getSlotInfo(0)
    audioManager.playSfx(label === 'Continue' && !slotInfo?.exists ? 'ui_cancel' : 'ui_confirm')
    if (label === 'New Game') {
      this.beginGameTransition({ newGame: true })
      return
    }

    if (label === 'Continue') {
      if (slotInfo?.exists) {
        this.beginGameTransition({ continueGame: true })
        return
      }

      const button = this.buttons[this.selectedIndex]
      button.setColor('#ff4040')
      this.tweens.add({
        targets: button,
        alpha: 0.35,
        yoyo: true,
        repeat: 2,
        duration: 90,
        onComplete: () => {
          button.setAlpha(1)
          this.updateSelection()
        },
      })
      this.showTitleNotice('No save found. Choose New Game to begin the showcase slice; progress saves at the blue skywell.')
      return
    }

    if (label === 'Settings') {
      this.showTitleNotice('Settings are not implemented in this slice. Audio starts after first browser interaction.')
      return
    }

    this.showTitleNotice('Emberglass vertical slice: design, code, generated art, and procedural audio prototype.')
  }

  private resetDemoSave() {
    if (this.transitionLocked) {
      return
    }

    SaveSystem.delete(0)
    audioManager.playSfx('ui_cancel')
    this.saveSummary?.setText('No save yet • New Game starts at Luma Quay')
    this.showTitleNotice('Demo save reset. New Game now starts from a fresh Luma Quay state.')
  }

  private createSaveSummary(width: number, startY: number) {
    const slotInfo = SaveSystem.getSlotInfo(0)
    const summary = slotInfo?.exists
      ? `Continue: ${slotInfo.mapName ?? 'Luma Quay'} • ${this.formatTimestamp(slotInfo.timestamp)} • ${this.formatPlayTime(slotInfo.playTime)}`
      : 'No save yet • New Game starts at Luma Quay'

    this.saveSummary = this.add
      .text(width / 2, startY + 48 + 25, summary, {
        color: slotInfo?.exists ? '#8ab4f8' : '#5f6684',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
      })
      .setOrigin(0.5)
  }

  private formatTimestamp(timestamp?: number) {
    if (!timestamp) {
      return 'unsaved'
    }

    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  private formatPlayTime(playTime?: number) {
    const minutes = Math.max(0, Math.floor((playTime ?? 0) / 60))
    return minutes > 0 ? `${minutes}m played` : 'fresh save'
  }

  private lockForTransition() {
    this.transitionLocked = true
    this.buttons.forEach((button) => button.disableInteractive().setAlpha(0.55))
  }

  private beginGameTransition(data: { newGame?: boolean; continueGame?: boolean }) {
    const { width, height } = this.scale
    this.lockForTransition()
    audioManager.playSfx('scene_whoosh')

    const veil = this.add.rectangle(width / 2, height / 2, width, height, 0x050612, 0).setDepth(80)
    const line = this.add.rectangle(width / 2, height / 2, 0, 2, 0xffd36e, 0.88).setDepth(81)
    const caption = this.add.text(width / 2, height / 2 + 34, data.newGame ? 'The Skywell calls...' : 'Returning to the covenant...', {
      color: '#fff1a8',
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
    }).setOrigin(0.5).setAlpha(0).setDepth(82)

    this.tweens.add({ targets: line, width: width * 0.72, duration: 360, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: caption, alpha: 1, y: caption.y - 8, duration: 360, ease: 'Sine.easeOut' })
    this.tweens.add({ targets: veil, alpha: 1, delay: 220, duration: 520, ease: 'Sine.easeInOut' })
    this.cameras.main.fadeOut(780, 5, 6, 18)
    this.time.delayedCall(820, () => this.scene.start('OverworldScene', data))
  }

  private showTitleNotice(message: string) {
    const { width, height } = this.scale
    this.notice?.destroy()
    const text = this.add
      .text(width / 2, height - 78, message, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        backgroundColor: '#11142a',
        padding: { x: 12, y: 7 },
        wordWrap: { width: 620 },
      })
      .setOrigin(0.5)
      .setDepth(50)
    this.notice = text

    this.tweens.add({
      targets: text,
      alpha: 0,
      delay: 2300,
      duration: 350,
      onComplete: () => {
        if (this.notice === text) {
          this.notice = undefined
        }
        text.destroy()
      },
    })
  }
}
