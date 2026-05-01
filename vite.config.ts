import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/emberglass/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'phaser',
              test: /node_modules[\\/]phaser[\\/]/,
              priority: 2,
            },
            {
              name: 'game',
              test: /src[\\/]game[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
})
