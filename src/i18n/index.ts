/**
 * Internazionalizzazione fatta in casa, senza dipendenze (stessa scelta del grafico SVG).
 *
 * Il dizionario italiano è la fonte di verità: `en` è tipizzato come `typeof it`, quindi una
 * chiave mancante o con parametri diversi NON compila. Una traduzione dimenticata rompe la
 * build, non arriva in produzione.
 *
 * Le voci sono stringhe, oppure funzioni quando servono parametri: così anche i parametri
 * sono controllati dal compilatore, e `t('…')` non può essere chiamata con l'oggetto sbagliato.
 */
import { en } from './en'
import { it } from './it'

export type Language = 'it' | 'en'

export const LANGUAGES: Language[] = ['it', 'en']

/**
 * Il dizionario italiano definisce la FORMA di tutti gli altri: stesse chiavi, e per le voci
 * con parametri la stessa firma. Le stringhe vanno allargate (`'Ciao'` → `string`), altrimenti
 * l'`as const` del file italiano imporrebbe agli altri le stesse identiche frasi.
 */
type Widen<T> = T extends (params: infer P) => string ? (params: P) => string : string

export type Dictionary = { [K in keyof typeof it]: Widen<(typeof it)[K]> }

export type TextKey = keyof Dictionary

/** Parametri richiesti da una chiave: nessuno se la voce è una stringa. */
type Params<K extends TextKey> = Dictionary[K] extends (params: infer P) => string ? [P] : []

export type Translate = <K extends TextKey>(key: K, ...params: Params<K>) => string

const DICTIONARIES: Record<Language, Dictionary> = { it, en }

export function isLanguage(value: unknown): value is Language {
  return LANGUAGES.includes(value as Language)
}

/** La funzione di traduzione per una lingua. Pura: nessun React, testabile in Node. */
export function makeTranslate(language: Language): Translate {
  const dictionary = DICTIONARIES[language]
  return ((key: TextKey, params?: unknown) => {
    const entry = dictionary[key]
    return typeof entry === 'function' ? (entry as (p: unknown) => string)(params) : entry
  }) as Translate
}

/**
 * Messaggio di un errore di dominio. Dominio e worker lanciano CODICI (`EMPTY_NAME`), non frasi:
 * la frase la sceglie la lingua, qui. Un codice sconosciuto (o un errore imprevisto) non deve
 * far sparire l'informazione: si mostra così com'è.
 */
export function translateError(t: Translate, error: unknown): string {
  const code = error instanceof Error ? error.message : String(error)
  const key = `errors.${code}` as TextKey
  return key in it ? t(key) : code
}
