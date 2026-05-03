import Phaser from 'phaser'

export type JoystickVector = { x: number; y: number }

export class VirtualJoystick {
  readonly container: Phaser.GameObjects.Container

  private readonly scene: Phaser.Scene
  private readonly base: Phaser.GameObjects.Arc
  private readonly knob: Phaser.GameObjects.Arc
  private readonly radius = 60
  private activePointerId: number | null = null
  private center: Phaser.Math.Vector2
  private vector: JoystickVector = { x: 0, y: 0 }

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene
    this.center = new Phaser.Math.Vector2(x, y)
    this.container = scene.add.container(x, y).setScrollFactor(0).setDepth(210)
    this.base = scene.add.circle(0, 0, this.radius, 0x050713, 0.34).setStrokeStyle(3, 0xffffff, 0.28)
    this.knob = scene.add.circle(0, 0, 25, 0xd7e7ff, 0.46).setStrokeStyle(2, 0xffffff, 0.52)
    this.container.add([this.base, this.knob])
    this.base.setInteractive(new Phaser.Geom.Circle(0, 0, this.radius), Phaser.Geom.Circle.Contains)

    this.base.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      pointer.event.preventDefault()
      this.activePointerId = pointer.id
      this.updateFromPointer(pointer)
    })

    this.scene.input.on('pointermove', this.handlePointerMove)
    this.scene.input.on('pointerup', this.handlePointerRelease)
    this.scene.input.on('pointerupoutside', this.handlePointerRelease)
  }

  get value(): JoystickVector {
    return this.vector
  }

  setPosition(x: number, y: number): void {
    this.center.set(x, y)
    this.container.setPosition(x, y)
    if (this.activePointerId === null) {
      this.knob.setPosition(0, 0)
    }
  }

  contains(screenX: number, screenY: number): boolean {
    return Phaser.Math.Distance.Between(screenX, screenY, this.center.x, this.center.y) <= this.radius + 14
  }

  destroy(): void {
    this.scene.input.off('pointermove', this.handlePointerMove)
    this.scene.input.off('pointerup', this.handlePointerRelease)
    this.scene.input.off('pointerupoutside', this.handlePointerRelease)
    this.container.destroy()
  }

  private readonly handlePointerMove = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== this.activePointerId) return
    this.updateFromPointer(pointer)
  }

  private readonly handlePointerRelease = (pointer: Phaser.Input.Pointer) => {
    if (pointer.id !== this.activePointerId) return
    this.activePointerId = null
    this.vector = { x: 0, y: 0 }
    this.scene.tweens.add({ targets: this.knob, x: 0, y: 0, duration: 90, ease: 'Sine.easeOut' })
  }

  private updateFromPointer(pointer: Phaser.Input.Pointer): void {
    const dx = pointer.x - this.center.x
    const dy = pointer.y - this.center.y
    const distance = Math.min(this.radius, Math.hypot(dx, dy))
    const angle = Math.atan2(dy, dx)
    const knobX = Math.cos(angle) * distance
    const knobY = Math.sin(angle) * distance
    this.knob.setPosition(knobX, knobY)
    this.vector = {
      x: Phaser.Math.Clamp(knobX / this.radius, -1, 1),
      y: Phaser.Math.Clamp(knobY / this.radius, -1, 1),
    }
  }
}
