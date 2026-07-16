/** Intervallo di statura (cm) a cui è consigliato un esercizio. */
export interface StatureRange {
  minCm: number
  maxCm: number
}

/**
 * Grado di difficoltà. Nei DATI sono codici in inglese, come i codici d'errore: la frase
 * («Facile», «Easy») la sceglie la lingua al rendering, non il file di backup.
 */
export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

export function isDifficulty(value: unknown): value is Difficulty {
  return DIFFICULTIES.includes(value as Difficulty)
}

/**
 * Gruppo muscolare. Anche qui codici, non parole: «Petto», «petto» e «PETTO» erano tre gruppi
 * diversi, e in inglese l'app avrebbe continuato a dire «Petto». La parola la sceglie la lingua.
 */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'calves'
  | 'fullBody'
  | 'other'

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'glutes',
  'calves',
  'fullBody',
  'other',
]

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup)
}

/**
 * Esercizio proposto da un utente o preso dal catalogo. Il media è un link YouTube (nessun
 * hosting) OPPURE, da M16, la GIF del catalogo Gym visual (linkata dal repo del dataset, mai
 * copiata qui): almeno uno dei due deve esserci.
 */
export interface Exercise {
  id: string
  name: string
  description: string
  /** Vuoto solo se c'è `gifUrl`: le voci del catalogo non hanno un video. */
  youtubeUrl: string
  /** GIF animata 180×180 del catalogo (© Gym visual): mostrarla RICHIEDE l'attribuzione. */
  gifUrl?: string
  muscleGroup: MuscleGroup
  difficulty: Difficulty
  stature?: StatureRange
  /** LEGACY (M12): l'offuscamento del volto è un consiglio, non un obbligo. Non si valida più. */
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

export const CURRENT_SCHEMA_VERSION = 6

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
