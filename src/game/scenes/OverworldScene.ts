import Phaser from 'phaser'
import { GENERATED_ASSETS, hasTexture } from '../assets/generatedAssets'
import { ENEMIES } from '../data/enemies'
import { SaveSystem, type SaveData } from '../systems/SaveSystem'

const TILE_SIZE = 48
const MAP_WIDTH = 20
const MAP_HEIGHT = 15
const PLAYER_SPEED = 160
const SAVE_TILE = { x: 5, y: 5 }
const CHEST_TILE = { x: 15, y: 8 }
const NPC_TILE = { x: 10, y: 3 }

type Direction = 'up' | 'down' | 'left' | 'right'
type OverworldInitData = { newGame?: boolean; continueGame?: boolean }

export class OverworldScene extends Phaser.Scene {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private player?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  private playerOutline?: Phaser.GameObjects.Rectangle
  private keys?: Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space', Phaser.Input.Keyboard.Key>
  private walls = new Set<string>()
  private facing: Direction = 'down'
  private lastEncounterTile = ''
  private saveNoticeShown = false
  private chestOpened = false
  private busy = false
  private initData: OverworldInitData = {}

  constructor() {
    super('OverworldScene')
  }

  init(data: OverworldInitData) {
    this.initData = data
  }

  create() {
    this.cameras.main.setBackgroundColor('#08090f')
    this.walls.clear()
    this.saveNoticeShown = false
    this.busy = false

    this.createBackdrop()
    this.createMap()
    this.createObjects()

    const saved = this.initData.continueGame ? SaveSystem.load(0) : null
    const startX = saved?.position.x ?? TILE_SIZE * 2.5
    const startY = saved?.position.y ?? TILE_SIZE * 2.5
    this.playerOutline = this.add.rectangle(startX, startY, 38, 54, 0x1b1020, 0.45).setDepth(10)
    this.player = this.createPlayer(startX, startY)
    this.cursors = this.input.keyboard?.createCursorKeys()
    this.keys = this.input.keyboard?.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
    }) as Record<'w' | 'a' | 's' | 'd' | 'enter' | 'space', Phaser.Input.Keyboard.Key>

    this.cameras.main.setBounds(0, 0, MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12)
  }

  update(_time: number, delta: number) {
    if (!this.player || !this.playerOutline || !this.cursors || !this.keys || this.busy) {
      return
    }

    const seconds = delta / 1000
    let velocityX = 0
    let velocityY = 0

    if (this.cursors.left.isDown || this.keys.a.isDown) {
      velocityX -= PLAYER_SPEED
      this.facing = 'left'
    }

    if (this.cursors.right.isDown || this.keys.d.isDown) {
      velocityX += PLAYER_SPEED
      this.facing = 'right'
    }

    if (this.cursors.up.isDown || this.keys.w.isDown) {
      velocityY -= PLAYER_SPEED
      this.facing = 'up'
    }

    if (this.cursors.down.isDown || this.keys.s.isDown) {
      velocityY += PLAYER_SPEED
      this.facing = 'down'
    }

    if (velocityX !== 0 && velocityY !== 0) {
      const diagonalScale = Math.SQRT1_2
      velocityX *= diagonalScale
      velocityY *= diagonalScale
    }

    this.movePlayer(velocityX * seconds, velocityY * seconds)
    this.playerOutline.setPosition(this.player.x, this.player.y)
    this.checkSavePoint()
    this.checkEncounter()

    if (
      Phaser.Input.Keyboard.JustDown(this.keys.enter) ||
      Phaser.Input.Keyboard.JustDown(this.keys.space)
    ) {
      this.interact()
    }
  }

  private createMap() {
    for (let tileY = 0; tileY < MAP_HEIGHT; tileY += 1) {
      for (let tileX = 0; tileX < MAP_WIDTH; tileX += 1) {
        const isBorder =
          tileX === 0 || tileY === 0 || tileX === MAP_WIDTH - 1 || tileY === MAP_HEIGHT - 1
        const isInteriorWall =
          (tileY === 6 && tileX >= 4 && tileX <= 8) ||
          (tileY === 10 && tileX >= 2 && tileX <= 5) ||
          (tileX === 13 && tileY >= 2 && tileY <= 5) ||
          (tileX >= 11 && tileX <= 12 && tileY === 11)

        const isWall = isBorder || isInteriorWall
        if (hasTexture(this, GENERATED_ASSETS.tileset)) {
          const frameX = isWall ? 16 : (tileX + tileY) % 5 === 0 ? 32 : 0
          this.add
            .tileSprite(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, GENERATED_ASSETS.tileset)
            .setOrigin(0)
            .setTilePosition(frameX, 0)
            .setDepth(0)
        } else {
          const color = isWall ? 0x0a1a1a : 0x0a2a2a
          this.add
            .rectangle(tileX * TILE_SIZE, tileY * TILE_SIZE, TILE_SIZE, TILE_SIZE, color)
            .setOrigin(0)
            .setStrokeStyle(1, 0x123838, 0.35)
        }

        if (isWall) {
          this.walls.add(this.tileKey(tileX, tileY))
        }
      }
    }
  }

  private createBackdrop() {
    if (!hasTexture(this, GENERATED_ASSETS.overworldBg)) {
      return
    }

    this.add
      .image((MAP_WIDTH * TILE_SIZE) / 2, (MAP_HEIGHT * TILE_SIZE) / 2, GENERATED_ASSETS.overworldBg)
      .setDisplaySize(MAP_WIDTH * TILE_SIZE, MAP_HEIGHT * TILE_SIZE)
      .setDepth(-10)
  }

  private createObjects() {
    const saveX = this.tileCenter(SAVE_TILE.x)
    const saveY = this.tileCenter(SAVE_TILE.y)
    this.add.circle(saveX, saveY, 14, 0x52d9ff, 0.85).setDepth(3)
    this.add.circle(saveX, saveY, 22, 0x52d9ff, 0.18).setDepth(2)
    this.tweens.add({
      targets: this.add.circle(saveX, saveY, 26, 0x52d9ff, 0.12).setDepth(1),
      scale: 1.35,
      alpha: 0.02,
      yoyo: true,
      repeat: -1,
      duration: 1100,
    })

    if (hasTexture(this, GENERATED_ASSETS.chest)) {
      this.add.image(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), GENERATED_ASSETS.chest).setScale(1.25).setDepth(4)
    } else {
      this.add
        .rectangle(this.tileCenter(CHEST_TILE.x), this.tileCenter(CHEST_TILE.y), 32, 26, 0x8a5a21)
        .setStrokeStyle(3, 0xf0c040, 0.8)
        .setDepth(4)
    }

    if (hasTexture(this, GENERATED_ASSETS.npc)) {
      this.add.sprite(this.tileCenter(NPC_TILE.x), this.tileCenter(NPC_TILE.y), GENERATED_ASSETS.npc, 0).setDepth(4)
    } else {
      this.add
        .rectangle(this.tileCenter(NPC_TILE.x), this.tileCenter(NPC_TILE.y), 34, 44, 0x3278d4)
        .setStrokeStyle(2, 0x8ab4f8, 0.9)
        .setDepth(4)
    }
  }

  private createPlayer(x: number, y: number): Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle {
    if (hasTexture(this, GENERATED_ASSETS.heroes.nara)) {
      return this.add.sprite(x, y, GENERATED_ASSETS.heroes.nara, 0).setDepth(11)
    }

    return this.add.rectangle(x, y, 32, 48, 0xff8a32).setDepth(11)
  }

  private movePlayer(deltaX: number, deltaY: number) {
    if (!this.player) {
      return
    }

    if (deltaX !== 0) {
      const nextX = Phaser.Math.Clamp(
        this.player.x + deltaX,
        this.player.width / 2,
        MAP_WIDTH * TILE_SIZE - this.player.width / 2,
      )
      if (!this.collidesAt(nextX, this.player.y)) {
        this.player.x = nextX
      }
    }

    if (deltaY !== 0) {
      const nextY = Phaser.Math.Clamp(
        this.player.y + deltaY,
        this.player.height / 2,
        MAP_HEIGHT * TILE_SIZE - this.player.height / 2,
      )
      if (!this.collidesAt(this.player.x, nextY)) {
        this.player.y = nextY
      }
    }
  }

  private collidesAt(x: number, y: number): boolean {
    if (!this.player) {
      return false
    }

    const halfWidth = this.player.width / 2
    const halfHeight = this.player.height / 2
    const points = [
      { x: x - halfWidth + 3, y: y - halfHeight + 3 },
      { x: x + halfWidth - 3, y: y - halfHeight + 3 },
      { x: x - halfWidth + 3, y: y + halfHeight - 3 },
      { x: x + halfWidth - 3, y: y + halfHeight - 3 },
    ]

    return points.some((point) => this.isWallAtWorld(point.x, point.y))
  }

  private checkSavePoint() {
    if (!this.player) {
      return
    }

    const tile = this.worldToTile(this.player.x, this.player.y)
    if (tile.x === SAVE_TILE.x && tile.y === SAVE_TILE.y && !this.saveNoticeShown) {
      this.saveNoticeShown = true
      SaveSystem.autoSave(this.createSaveData())
      this.showToast('Save point found')
    }
  }

  private interact() {
    const tile = this.getInteractionTile()
    const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null

    if (this.matchesTile(tile, CHEST_TILE) || this.matchesTile(playerTile, CHEST_TILE)) {
      if (!this.chestOpened) {
        this.chestOpened = true
        this.showToast('Found: Health Potion!')
      }
      return
    }

    if (this.matchesTile(tile, NPC_TILE) || this.matchesTile(playerTile, NPC_TILE)) {
      this.showToast('Welcome to Luma Quay, traveler.')
    }
  }

  private checkEncounter() {
    if (!this.player) {
      return
    }

    const tile = this.worldToTile(this.player.x, this.player.y)
    const tileKey = this.tileKey(tile.x, tile.y)
    if (tileKey === this.lastEncounterTile) {
      return
    }

    this.lastEncounterTile = tileKey
    if (tile.x > 14 && tile.y > 10 && Math.random() < 0.15) {
      this.busy = true
      const verdantEnemies = Phaser.Utils.Array.Shuffle(
        ENEMIES.filter((enemy) => enemy.region === 'verdant'),
      )
      this.cameras.main.fadeOut(300, 0, 0, 0)
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start('BattleScene', {
          enemyIds: verdantEnemies.slice(0, 2).map((enemy) => enemy.id),
          isBoss: false,
        })
      })
    }
  }

  private showToast(message: string) {
    const { width } = this.scale
    const text = this.add
      .text(width / 2, 86, message, {
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '22px',
        backgroundColor: '#0a0a2e',
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(100)

    this.tweens.add({
      targets: text,
      y: 66,
      alpha: 0,
      delay: 1100,
      duration: 400,
      onComplete: () => text.destroy(),
    })
  }

  private createSaveData(): SaveData {
    const position = this.player
      ? { mapId: 'Luma Quay', x: this.player.x, y: this.player.y }
      : { mapId: 'Luma Quay', x: TILE_SIZE * 2.5, y: TILE_SIZE * 2.5 }

    return {
      version: SaveSystem.SAVE_VERSION,
      timestamp: Date.now(),
      slot: 0,
      party: [
        {
          characterId: 'nara',
          level: 3,
          currentHp: 104,
          currentMp: 44,
          equipment: { weapon: null, charm: null, relic: null },
          skills: ['emberglass_strike', 'skywell_spark'],
        },
        {
          characterId: 'kael',
          level: 3,
          currentHp: 128,
          currentMp: 28,
          equipment: { weapon: null, charm: null, relic: null },
          skills: ['iron_cleave', 'guard_break'],
        },
        {
          characterId: 'io',
          level: 3,
          currentHp: 88,
          currentMp: 58,
          equipment: { weapon: null, charm: null, relic: null },
          skills: ['lumen_bolt', 'mend'],
        },
      ],
      inventory: [{ itemId: 'health_potion', quantity: 3 }],
      gold: 0,
      position,
      quests: {},
      flags: {},
      playTime: 0,
    }
  }

  private getInteractionTile() {
    if (!this.player) {
      return null
    }

    const tile = this.worldToTile(this.player.x, this.player.y)
    if (this.facing === 'left') {
      tile.x -= 1
    } else if (this.facing === 'right') {
      tile.x += 1
    } else if (this.facing === 'up') {
      tile.y -= 1
    } else {
      tile.y += 1
    }
    return tile
  }

  private matchesTile(
    tile: { x: number; y: number } | null,
    target: { x: number; y: number },
  ): boolean {
    return tile?.x === target.x && tile.y === target.y
  }

  private isWallAtWorld(x: number, y: number): boolean {
    const tile = this.worldToTile(x, y)
    return this.walls.has(this.tileKey(tile.x, tile.y))
  }

  private worldToTile(x: number, y: number) {
    return {
      x: Math.floor(x / TILE_SIZE),
      y: Math.floor(y / TILE_SIZE),
    }
  }

  private tileCenter(tile: number): number {
    return tile * TILE_SIZE + TILE_SIZE / 2
  }

  private tileKey(x: number, y: number): string {
    return `${x},${y}`
  }
}
