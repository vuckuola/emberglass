import Phaser from 'phaser'

const MENU_ITEMS = ['New Game', 'Continue', 'Settings', 'Credits'] as const

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('TitleScene')
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor('#08090f')

    this.add
      .text(width / 2, height * 0.24, 'EMBERGLASS', {
        color: '#f2c94c',
        fontFamily: 'Georgia, serif',
        fontSize: '72px',
      })
      .setOrigin(0.5)

    const startY = height / 2 - 66

    MENU_ITEMS.forEach((label, index) => {
      const button = this.add
        .text(width / 2, startY + index * 44, label, {
          color: '#f7ead0',
          fontFamily: 'Arial, sans-serif',
          fontSize: '28px',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true })

      button.on('pointerover', () => {
        button.setColor('#f2c94c')
      })

      button.on('pointerout', () => {
        button.setColor('#f7ead0')
      })

      if (label === 'New Game') {
        button.on('pointerdown', () => {
          console.log('newGame')
        })
      }
    })
  }
}
