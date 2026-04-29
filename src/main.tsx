import React from 'react'
import { createRoot } from 'react-dom/client'
import Phaser from 'phaser'
import App from './App.tsx'
import { GAME_CONFIG } from './game/config'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  new Phaser.Game({
    ...GAME_CONFIG,
    parent: 'game-container',
  })
})
