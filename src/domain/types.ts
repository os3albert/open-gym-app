/** Intervallo di statura (cm) a cui è consigliato un esercizio. */
export interface StatureRange {
  minCm: number
  maxCm: number
}

/** Esercizio proposto da un utente. Il video è solo un link YouTube (nessun hosting). */
export interface Exercise {
  id: string
  name: string
  description: string
  youtubeUrl: string
  muscleGroup: string
  stature?: StatureRange
  /** L'utente dichiara che il volto nel video è offuscato con l'AI. */
  faceBlurConfirmed: boolean
  votes: number
  createdAt: string
}

/** Una serie di un esercizio eseguita con un certo peso. */
export interface WorkoutSet {
  weightKg: number
  reps: number
}

/** Sessione registrata: le serie eseguite per un esercizio in una data. */
export interface ActivityRecord {
  id: string
  exerciseId: string
  date: string
  sets: WorkoutSet[]
}

/** Esercizio previsto in una giornata della scheda, con il target di serie e ripetizioni. */
export interface PlanEntry {
  exerciseId: string
  sets: number
  reps: number
}

/** Giornata di una scheda: quali esercizi fare e con quale target (es. 3×8). */
export interface WorkoutDay {
  name: string
  entries: PlanEntry[]
}

/** Scheda di allenamento, personale o proposta da altri utenti. */
export interface WorkoutPlan {
  id: string
  name: string
  author?: string
  days: WorkoutDay[]
  votes: number
}

/** Profilo locale del dispositivo (nessuna registrazione): serve per il filtro per statura. */
export interface UserProfile {
  statureCm: number | null
}

export const CURRENT_SCHEMA_VERSION = 3

/** Tutti i dati dell'app: è l'unità di persistenza (localStorage) e di export/import JSON. */
export interface AppData {
  schemaVersion: typeof CURRENT_SCHEMA_VERSION
  exercises: Exercise[]
  plans: WorkoutPlan[]
  /** Scheda attiva su questo dispositivo: guida l'allenamento del giorno. */
  activePlanId: string | null
  activity: ActivityRecord[]
  profile: UserProfile
  /** Voti espressi da questo dispositivo (un voto per esercizio, rimovibile). */
  votedExerciseIds: string[]
}
