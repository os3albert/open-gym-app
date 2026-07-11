/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Su GitHub Pages l'app vive in un sottopercorso: il workflow passa VITE_BASE=/open-gym-app/
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt': la nuova versione non si attiva da sola, l'utente la applica dal banner
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Open Gym',
        short_name: 'OpenGym',
        description:
          'Piattaforma open source di esercizi da palestra: schede di allenamento, tracking dei pesi e voti della community.',
        lang: 'it',
        display: 'standalone',
        // Niente start_url/scope espliciti né percorsi assoluti: li deriva il plugin
        // dalla base di Vite, così manifest e icone funzionano anche nel sottopercorso Pages
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    // Il modulo virtuale del service worker non esiste sotto Vitest: stub esplicito
    alias: {
      'virtual:pwa-register/react': new URL('./tests/stubs/pwa-register.ts', import.meta.url)
        .pathname,
    },
    environmentOptions: {
      jsdom: { url: 'http://localhost/' },
    },
    globals: true,
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
