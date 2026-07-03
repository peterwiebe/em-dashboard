import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import localStatePlugin from './vite-plugins/local-state-plugin'

export default defineConfig({
  plugins: [react(), localStatePlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
