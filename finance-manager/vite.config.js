import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: '个人记账本',
        short_name: '个人记账本',
        description: '你的专属生活收支管家',
        theme_color: '#0f172a', // slate-900 for top bar
        background_color: '#f8fafc', // slate-50 for background
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'https://cdn-icons-png.flaticon.com/512/10336/10336829.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://cdn-icons-png.flaticon.com/512/10336/10336829.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
