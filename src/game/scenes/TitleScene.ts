import Phaser from 'phaser'
import { audioManager } from '../audio/AudioManager'
import { SaveSystem } from '../systems/SaveSystem'

const MENU_ITEMS = ['New Game', 'Continue', 'Settings', 'Credits'] as const
type MenuItem = (typeof MENU_ITEMS)[number]

export class TitleScene extends Phaser.Scene {
  private buttons: Phaser.GameObjects.Text[] = []
  private cursor?: Phaser.GameObjects.Text
  private selectedIndex = 0

  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.scale
    audioManager.playMusic('title')

    this.drawGradientBackground(width, height)
    this.createEmbers(width, height)

    this.add
      .text(width / 2, 180, 'EMBERGLASS', {
        color: '#f0c040',
        fontFamily: 'Georgia, serif',
        fontSize: '48px',
      })
      .setOrigin(0.5)
      .setShadow(0, 0, '#f0c040', 12, true, true)

    this.add
      .text(width / 2, 230, 'Covenant of the Skywell', {
        color: '#8ab4f8',
        fontFamily: 'Georgia, serif',
        fontSize: '20px',
      })
      .setOrigin(0.5)

    const startY = 340

    MENU_ITEMS.forEach((label, index) => {
      const button = this.add
        .text(width / 2, startY + index * 50, label, {
          color: '#d7d9e8',
          fontFamily: 'Arial, sans-serif',
          fontSize: '26px',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      button.on('pointerover', () => {
        this.selectedIndex = index
        this.updateSelection()
      })

      button.on('pointerout', () => {
        this.updateSelection()
      })

      button.on('pointerdown', () => this.selectMenuItem(label))
      this.buttons.push(button)
    })

    this.cursor = this.add.text(width / 2 - 120, startY, '►', {
      color: '#ff8a32',
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
    }).setOrigin(0.5)

    this.input.keyboard?.on('keydown-UP', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-W', () => this.moveSelection(-1))
    this.input.keyboard?.on('keydown-DOWN', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-S', () => this.moveSelection(1))
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.selectMenuItem(MENU_ITEMS[this.selectedIndex])
    })

    this.updateSelection()
  }

  private drawGradientBackground(width: number, height: number) {
    const graphics = this.add.graphics()
    graphics.fillGradientStyle(0x08090f, 0x08090f, 0x1a0a2e, 0x1a0a2e, 1)
    graphics.fillRect(0, 0, width, height)
  }

  private createEmbers(width: number, height: number) {
    for (let index = 0; index < 56; index += 1) {
      const ember = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.FloatBetween(1.5, 3.5),
        0xff8a32,
        Phaser.Math.FloatBetween(0.25, 0.75),
      )

      this.driftEmber(ember, width, height, Phaser.Math.Between(0, 2200))
    }
  }

  private driftEmber(
    ember: Phaser.GameObjects.Arc,
    width: number,
    height: number,
    delay = 0,
  ) {
    this.tweens.add({
      targets: ember,
      y: -12,
      x: ember.x + Phaser.Math.Between(-40, 40),
      alpha: Phaser.Math.FloatBetween(0.1, 0.7),
      duration: Phaser.Math.Between(4200, 7800),
      delay,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        ember.setPosition(Phaser.Math.Between(0, width), height + 12)
        ember.setAlpha(Phaser.Math.FloatBetween(0.35, 0.8))
        this.driftEmber(ember, width, height)
      },
    })
  }

  private moveSelection(direction: number) {
    this.selectedIndex =
      (this.selectedIndex + direction + MENU_ITEMS.length) % MENU_ITEMS.length
    audioManager.playSfx('ui_blip')
    this.updateSelection()
  }

  private updateSelection() {
    this.buttons.forEach((button, index) => {
      button.setColor(index === this.selectedIndex ? '#fff1a8' : '#d7d9e8')
    })

    const selectedButton = this.buttons[this.selectedIndex]
    if (this.cursor && selectedButton) {
      this.cursor.setPosition(selectedButton.x - 120, selectedButton.y)
    }
  }

  private selectMenuItem(label: MenuItem) {
    audioManager.playSfx(label === 'Continue' && !SaveSystem.getSlotInfo(0)?.exists ? 'ui_cancel' : 'ui_confirm')
    if (label === 'New Game') {
      this.scene.start('OverworldScene', { newGame: true })
      return
    }

    if (label === 'Continue') {
      if (SaveSystem.getSlotInfo(0)?.exists) {
        this.scene.start('OverworldScene', { continueGame: true })
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
      return
    }

    if (label === 'Settings') {
      console.log('settings')
      return
    }

    console.log('credits')
  }
}
