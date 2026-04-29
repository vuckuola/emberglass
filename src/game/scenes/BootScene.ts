import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    const { width, height } = this.scale
    const barWidth = 480
    const barHeight = 24
    const x = (width - barWidth) / 2
    const y = height / 2

    this.cameras.main.setBackgroundColor('#101820')

    this.add
      .text(width / 2, y - 56, 'Loading...', {
        color: '#f2d16b',
        fontFamily: 'Arial, sans-serif',
        fontSize: '28px',
      })
      .setOrigin(0.5)

    this.add.rectangle(x, y, barWidth, barHeight, 0x27333f).setOrigin(0, 0.5)
    const progressBar = this.add
      .rectangle(x, y, 0, barHeight, 0xf2d16b)
      .setOrigin(0, 0.5)

    this.load.on('progress', (value: number) => {
      progressBar.width = barWidth * value
    })
  }

  create() {
    this.scene.start('TitleScene')
  }
}
