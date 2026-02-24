import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['*.svg'],
      manifest: {
        name: 'KaloriKollen - AI Kaloriräknare',
        short_name: 'KaloriKollen',
        description: 'Fota din mat och få kalorier och näringsvärden direkt med AI',
        theme_color: '#10B981',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect width="192" height="192" fill="%2310B981" rx="40"/><text x="96" y="140" font-size="120" text-anchor="middle" fill="white">📸</text></svg>',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="%2310B981" rx="100"/><text x="256" y="380" font-size="320" text-anchor="middle" fill="white">📸</text></svg>',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 5051,
    strictPort: true,
  }
})
