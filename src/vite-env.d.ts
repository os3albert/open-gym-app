/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL del worker della community; assente = proposte e voti condivisi disattivati. */
  readonly VITE_COMMUNITY_API_URL?: string
  /** Script Umami (statistiche anonime); assente = nessuna statistica, nessuna richiesta. */
  readonly VITE_UMAMI_SRC?: string
  readonly VITE_UMAMI_WEBSITE_ID?: string
}
