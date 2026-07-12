/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** Origine di un URL configurato (per la CSP): stringa vuota se non c'è. */
function origin(url: string | undefined): string {
  try {
    return url ? new URL(url).origin : ''
  } catch {
    return ''
  }
}

/**
 * Content-Security-Policy come <meta>: su GitHub Pages non possiamo mandare header,
 * e la policy dipende da cosa è configurato (worker della community, script Umami),
 * quindi si genera a build time. 'unsafe-inline' negli stili è richiesto da Emotion (MUI),
 * che inietta i CSS in pagina; gli script restano senza inline.
 */
function cspPlugin(): Plugin {
  return {
    name: 'open-gym-csp',
    transformIndexHtml() {
      const worker = origin(process.env.VITE_COMMUNITY_API_URL)
      const umami = origin(process.env.VITE_UMAMI_SRC)
      const csp = [
        "default-src 'self'",
        `script-src 'self'${umami ? ` ${umami}` : ''}`,
        "style-src 'self' 'unsafe-inline'",
        "font-src 'self'",
        "img-src 'self' data: https://i.ytimg.com",
        // Le miniature YouTube, il catalogo della community e (se configurati) worker e Umami
        `connect-src 'self' https://raw.githubusercontent.com${worker ? ` ${worker}` : ''}${umami ? ` ${umami}` : ''}`,
        'frame-src https://www.youtube-nocookie.com',
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'none'",
        "frame-ancestors 'none'",
      ].join('; ')
      return [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: csp },
          injectTo: 'head-prepend',
        },
      ]
    },
  }
}

export default defineConfig({
  // Su GitHub Pages l'app vive in un sottopercorso: il workflow passa VITE_BASE=/open-gym-app/
  base: process.env.VITE_BASE || '/',
  plugins: [
    react(),
    cspPlugin(),
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
        theme_color: '#4d7c0f',
        background_color: '#fafaf9',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          // Maskable a parte: contiene solo il glifo nella safe zone, senza il riquadro
          {
            src: 'pwa-512x512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
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
    // I test di integrazione digitano davvero nei campi (userEvent, un evento per tasto):
    // sui runner della CI i 5s di default non bastano e i test scadono a tradimento.
    testTimeout: 20000,
    coverage: {
      provider: 'v8',
      // lcov: è il formato che SonarCloud importa (vedi sonar-project.properties)
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
