import { useState } from 'react'
import type { WorkoutSet } from '../domain/types'

/**
 * Chiave localStorage SEPARATA da AppData: le bozze sono lavoro in corso, non dati da backup
 * (niente bump di schema), ma devono sopravvivere a un ricaricamento — in palestra il telefono
 * si chiude di continuo, e una serie spuntata non si deve perdere.
 */
const STORAGE_KEY = 'open-gym-app/bozze-serie'

/** Bozze per giorno e per esercizio: i giorni passati restano finché l'utente non decide. */
type DraftStore = Record<string, Record<string, WorkoutSet[]>>

function read(): DraftStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    return parsed as DraftStore
  } catch {
    // Bozze illeggibili: si riparte pulite, senza far crollare l'app
    return {}
  }
}

export interface PendingDrafts {
  date: string
  byExercise: Record<string, WorkoutSet[]>
}

/**
 * Le serie «in bozza» del set log (M17): spuntate nella card ma non ancora CONFERMATE nello
 * storico. La conferma è un gesto esplicito dell'utente — è la richiesta: rendere visibile
 * l'atto di inserire la giornata nello storico. Le bozze di un giorno passato non si scartano
 * mai in silenzio: risalgono come `pending` e si confermano (nel LORO giorno) o si scartano.
 */
export function useSetDrafts(today: string) {
  const [store, setStore] = useState<DraftStore>(read)

  function save(next: DraftStore) {
    setStore(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Quota piena: le bozze restano in memoria per la sessione, i dati veri non sono a rischio
    }
  }

  const pastDates = Object.keys(store)
    .filter((date) => date !== today)
    .filter((date) => Object.values(store[date]).some((sets) => sets.length > 0))
    .sort()

  return {
    /** Bozze di oggi per un esercizio. */
    draftsFor(exerciseId: string): WorkoutSet[] {
      return store[today]?.[exerciseId] ?? []
    },
    addDraft(exerciseId: string, set: WorkoutSet) {
      const day = store[today] ?? {}
      save({ ...store, [today]: { ...day, [exerciseId]: [...(day[exerciseId] ?? []), set] } })
    },
    removeDraft(exerciseId: string, index: number) {
      const day = store[today] ?? {}
      save({
        ...store,
        [today]: { ...day, [exerciseId]: (day[exerciseId] ?? []).filter((_, i) => i !== index) },
      })
    },
    clearDrafts(exerciseId: string) {
      const { [exerciseId]: _cleared, ...rest } = store[today] ?? {}
      save({ ...store, [today]: rest })
    },
    /** La più vecchia giornata rimasta in bozza (se c'è): il banner la risolve una alla volta. */
    pending: pastDates.length
      ? ({ date: pastDates[0], byExercise: store[pastDates[0]] } satisfies PendingDrafts)
      : null,
    clearPending(date: string) {
      const { [date]: _cleared, ...rest } = store
      save(rest)
    },
  }
}
