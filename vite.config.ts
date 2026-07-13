/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from '@cloudflare/vite-plugin'

/**
 * Origine di un URL configurato (per la CSP): stringa vuota se la variabile non c'è.
 *
 * Se invece c'è ma è malformata, la build si FERMA. Non è pignoleria: un `catch` che
 * restituiva '' ha già mandato in produzione un sito rotto in silenzio — l'URL del worker
 * era senza `https://`, quindi l'app lo trattava come percorso relativo e la CSP perdeva
 * l'origine senza dirlo a nessuno. Meglio una build rossa che un deploy muto.
 */
function origin(name: string, url: string | undefined): string {
  if (!url) return ''
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      `${name} non è un URL valido: «${url}». Serve un URL assoluto, es. https://esempio.dev`,
    )
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(`${name} deve usare http o https, non «${parsed.protocol}»`)
  }
  return parsed.origin
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
    // Solo in build: in dev Vite serve script inline (preamble react-refresh, HMR) che
    // `script-src 'self'` bloccherebbe, lasciando la pagina bianca. L'E2E gira sulla
    // build di produzione, quindi la policy resta comunque coperta dai test.
    apply: 'build',
    transformIndexHtml() {
      const worker = origin('VITE_COMMUNITY_API_URL', process.env.VITE_COMMUNITY_API_URL)
      const umami = origin('VITE_UMAMI_SRC', process.env.VITE_UMAMI_SRC)
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

/**
 * L'app è installabile da due origini diverse: GitHub Pages in sottopercorso
 * (VITE_BASE=/open-gym-app/) e il Worker Cloudflare in root. `id`, `start_url` e `scope`
 * del manifest DEVONO seguire la base, o il browser considera l'app fuori dal suo scope
 * e non la installa. Per il browser restano due app distinte: è voluto.
 */
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      // 'prompt': la nuova versione non si attiva da sola, l'utente la applica dal banner
      registerType: 'prompt',
      includeAssets: ['favicon.svg'],
      manifest: {
        // id/start_url/scope seguono la base: senza, l'app non è installabile fuori dalla root
        id: base,
        start_url: base,
        scope: base,
        name: 'Open Gym',
        short_name: 'OpenGym',
        description:
          'Piattaforma open source di esercizi da palestra: schede di allenamento, tracking dei pesi e voti della community.',
        lang: 'it',
        display: 'standalone',
        theme_color: '#4d7c0f',
        // Stesso background.default dello schema chiaro in src/theme.ts
        background_color: '#f6f6f4',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
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
    cloudflare(),
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
