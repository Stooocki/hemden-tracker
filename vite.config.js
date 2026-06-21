import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/hemden-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Hemden-Tracker',
        short_name: 'Hemden',
        description: 'Tracke wann deine Hemden zuletzt gewaschen wurden',
        theme_color: '#1a1a1a',
        background_color: '#f5f4f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/hemden-tracker/'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg}']
      }
    })
  ]
})
