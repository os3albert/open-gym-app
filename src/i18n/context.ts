import { createContext, useContext } from 'react'
import { makeTranslate, type Translate } from './index'

/**
 * La funzione di traduzione passa per un contesto invece che di prop in prop: `t` serve in
 * fondo all'albero (le card degli esercizi, i campi dei form) e trascinarla ovunque
 * inquinerebbe ogni firma senza aggiungere nulla.
 *
 * Il default è la traduzione italiana, non un errore: un componente montato da solo in un test
 * deve poter rendere il suo testo senza doversi ricordare del provider.
 */
export const TranslateContext = createContext<Translate>(makeTranslate('it'))

export function useT(): Translate {
  return useContext(TranslateContext)
}
