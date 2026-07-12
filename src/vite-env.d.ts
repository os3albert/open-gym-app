/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  /** URL del worker della community; assente = proposte e voti condivisi disattivati. */
  readonly VITE_COMMUNITY_API_URL?: string
}
