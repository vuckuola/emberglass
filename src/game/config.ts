import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { OverworldScene } from './scenes/OverworldScene'
import { TitleScene } from './scenes/TitleScene'

export const GAME_CONFIG: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 960,
  height: 640,
  pixelArt: true,
  backgroundColor: '#08090f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 960,
    height: 640,
  },
  scene: [BootScene, TitleScene, OverworldScene],
}
