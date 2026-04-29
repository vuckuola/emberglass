import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  private progressBar?: Phaser.GameObjects.Rectangle

  constructor() {
    super('BootScene')
  }

  preload() {
    const { width, height } = this.scale
    const barWidth = 960
    const barHeight = 20
    const x = (width - barWidth) / 2
    const y = height - 72

    this.cameras.main.setBackgroundColor('#08090f')

    this.add
      .text(width / 2, y - 42, 'Loading...', {
        color: '#f2d16b',
        fontFamily: 'Arial, sans-serif',
        fontSize: '24px',
      })
      .setOrigin(0.5)

    this.add.rectangle(x, y, barWidth, barHeight, 0x151824).setOrigin(0, 0.5)
    this.add
      .rectangle(x, y, barWidth, barHeight, 0x000000, 0)
      .setStrokeStyle(2, 0xf0c040, 0.55)
      .setOrigin(0, 0.5)

    this.progressBar = this.add
      .rectangle(x, y, 0, barHeight, 0xf2d16b)
      .setOrigin(0, 0.5)

    this.load.on('progress', (value: number) => {
      if (this.progressBar) {
        this.progressBar.width = barWidth * value
      }
    })
  }

  create() {
    this.tweens.add({
      targets: this.progressBar,
      width: 960,
      duration: 2000,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        this.cameras.main.fadeOut(500, 8, 9, 15)
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
          this.scene.start('TitleScene')
        })
      },
    })
  }
}
