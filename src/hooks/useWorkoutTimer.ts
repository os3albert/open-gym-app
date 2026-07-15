import { useEffect, useState } from 'react'

export type WorkoutTimerPhase = 'idle' | 'exercise' | 'rest'

export interface WorkoutTimer {
  phase: WorkoutTimerPhase
  /** Millisecondi dall'avvio della sessione (0 da fermo). */
  totalMs: number
  /** Millisecondi dall'inizio della pausa corrente (0 fuori pausa). */
  restMs: number
  start: () => void
  /** Un tocco a timer avviato: chiude la pausa, o ne apre una manuale. */
  toggleRest: () => void
  stop: () => void
  /** Serie registrata: la pausa parte da sola, si riparte toccando il FAB. */
  onSetRecorded: () => void
}

/**
 * Il cronometro dell'allenamento (M14): monitora il tempo totale della sessione e le pause
 * tra le serie. Stato SOLO in memoria — vive in App, quindi sopravvive al cambio di vista
 * ma non al ricaricamento: non è un dato da backup, e AppData non c'entra.
 *
 * L'intervallo aggiorna `now` una volta al secondo solo a timer avviato; i tempi mostrati
 * sono derivati dagli istanti di partenza, mai accumulati a colpi di tick (un tick perso
 * non fa perdere tempo). Niente setState sincrono nell'effetto: la stessa lezione dello
 * spinner (#82) — qui lo stato cambia solo nei gesti e dentro l'intervallo.
 */
export function useWorkoutTimer(): WorkoutTimer {
  const [phase, setPhase] = useState<WorkoutTimerPhase>('idle')
  const [startedAt, setStartedAt] = useState(0)
  const [restStartedAt, setRestStartedAt] = useState(0)
  const [now, setNow] = useState(0)

  const active = phase !== 'idle'
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])

  function start() {
    const t = Date.now()
    setPhase('exercise')
    setStartedAt(t)
    setNow(t)
  }

  function toggleRest() {
    const t = Date.now()
    setNow(t)
    if (phase === 'rest') {
      setPhase('exercise')
    } else if (phase === 'exercise') {
      setRestStartedAt(t)
      setPhase('rest')
    }
  }

  function stop() {
    setPhase('idle')
  }

  function onSetRecorded() {
    if (phase === 'idle') return
    const t = Date.now()
    setNow(t)
    setRestStartedAt(t)
    setPhase('rest')
  }

  return {
    phase,
    totalMs: active ? Math.max(0, now - startedAt) : 0,
    restMs: phase === 'rest' ? Math.max(0, now - restStartedAt) : 0,
    start,
    toggleRest,
    stop,
    onSetRecorded,
  }
}
