import Phaser from 'phaser'
import { GAME_CONFIG } from './config'

export function startGame(parent: string) {
  return new Phaser.Game({
    ...GAME_CONFIG,
    parent,
  })
}
