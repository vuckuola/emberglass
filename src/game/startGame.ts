import Phaser from 'phaser'
import { GAME_CONFIG } from './config'

export function startGame(parent: string) {
  const game = new Phaser.Game({
    ...GAME_CONFIG,
    parent,
  })
  ;(window as any).__EMBERGLASS_GAME__ = game
  return game
}
