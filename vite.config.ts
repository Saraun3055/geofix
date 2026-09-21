/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    // PWA is skipped in test mode (vitest sets mode: 'test') so the service
    // worker / manifest generation never interferes with jsdom test runs.
    ...(mode === 'test'
      ? []
      : [
          VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.svg'],
            manifest: {
              name: 'GeoFix Madurai',
              short_name: 'GeoFix',
              description:
                'Top-rated local plumbers, electricians & technicians — instant WhatsApp connect with Madurai\u2019s best repair experts.',
              theme_color: '#7a1b1c',
              background_color: '#fdfbf7',
              display: 'standalone',
              start_url: '/',
              scope: '/',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png',
                },
                {
                  src: '/pwa-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                },
                {
                  src: '/pwa-maskable-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'maskable',
                },
                {
                  src: '/apple-touch-icon.png',
                  sizes: '180x180',
                  type: 'image/png',
                },
              ],
            },
          }),
        ]),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
}))