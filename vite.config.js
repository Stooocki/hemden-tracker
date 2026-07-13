import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/hemden-tracker/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Hemden-Tracker',
        short_name: 'Hemden',
        description: 'Tracke wann deine Hemden zuletzt gewaschen wurden',
        theme_color: '#1a1a1a',
        background_color: '#f5f4f0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/hemden-tracker/',
        icons: [
          { src: '/hemden-tracker/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/hemden-tracker/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
