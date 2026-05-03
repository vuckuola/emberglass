import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { installRuntimeDiagnostics } from './diagnostics/runtimeDiagnostics'

installRuntimeDiagnostics()

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

requestAnimationFrame(() => {
  void import('./game/startGame').then(({ startGame }) => {
    startGame('game-container')
    // Dismiss the pre-Phaser HTML loading screen once the game is bootstrapped
    const dismiss = (window as any).__emberglassDismissPreloader
    if (typeof dismiss === 'function') dismiss()
  })
})

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/emberglass/sw.js')
  })
}
