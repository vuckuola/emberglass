import Phaser from 'phaser'

const PLAYER_SPEED = 200

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private player?: Phaser.GameObjects.Rectangle

  constructor() {
    super('OverworldScene')
  }

  create() {
    this.cameras.main.setBackgroundColor('#0b171a')
    this.add.rectangle(0, 0, 2400, 1600, 0x1c9a94).setOrigin(0)

    this.player = this.add.rectangle(480, 320, 32, 48, 0xff8a32)
    this.cursors = this.input.keyboard?.createCursorKeys()

    this.cameras.main.setBounds(0, 0, 2400, 1600)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.cursors) {
      return
    }

    const seconds = delta / 1000
    let velocityX = 0
    let velocityY = 0

    if (this.cursors.left.isDown) {
      velocityX -= PLAYER_SPEED
    }

    if (this.cursors.right.isDown) {
      velocityX += PLAYER_SPEED
    }

    if (this.cursors.up.isDown) {
      velocityY -= PLAYER_SPEED
    }

    if (this.cursors.down.isDown) {
      velocityY += PLAYER_SPEED
    }

    if (velocityX !== 0 && velocityY !== 0) {
      const diagonalScale = Math.SQRT1_2
      velocityX *= diagonalScale
      velocityY *= diagonalScale
    }

    this.player.x = Phaser.Math.Clamp(
      this.player.x + velocityX * seconds,
      this.player.width / 2,
      2400 - this.player.width / 2,
    )
    this.player.y = Phaser.Math.Clamp(
      this.player.y + velocityY * seconds,
      this.player.height / 2,
      1600 - this.player.height / 2,
    )
  }
}
