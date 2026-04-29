import Phaser from 'phaser'

export class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene')
  }

  create() {
    const { width, height } = this.scale

    this.cameras.main.setBackgroundColor('#08090f')

    this.add
      .text(width / 2, height / 2, 'Battle!', {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '48px',
      })
      .setOrigin(0.5)
  }
}
