/** Genera un id univoco senza dipendere da crypto (non disponibile in tutti gli ambienti di test). */
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}
