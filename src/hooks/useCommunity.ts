import { useCallback, useEffect, useState } from 'react'
import {
  COMMUNITY_UNREACHABLE_ERROR,
  communityApiUrl,
  fetchCommunity,
  proposeToCommunity,
  sendCommunityVote,
  type CommunitySnapshot,
} from '../services/community'
import type { ProposalInput } from '../services/communityData'

/** Chiavi separate da AppData: la community non entra nel backup né nello schema dati. */
const CACHE_KEY = 'open-gym-app/community'
const VOTED_KEY = 'open-gym-app/voti-community'

const EMPTY: CommunitySnapshot = { exercises: [], counts: {} }

/**
 * L'esito di un'operazione sulla community, NON la sua frase: l'hook non sa in che lingua
 * sta l'interfaccia. `reason` è il codice d'errore (o il testo grezzo che il worker ha
 * risposto, se non è un codice noto); la frase la compone chi rende, con `t`.
 */
export type CommunityMessage =
  | { kind: 'proposalSent' }
  | { kind: 'localOnly'; reason: string }
  | { kind: 'error'; reason: string }

function readCache(): CommunitySnapshot {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CommunitySnapshot) : EMPTY
  } catch {
    return EMPTY
  }
}

/** Quali esercizi ho votato: serve solo alla UI (il conteggio è autorevole solo lato worker). */
function readVoted(): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/**
 * Catalogo condiviso su GitHub: si legge dai file grezzi del repo (con cache locale per
 * l'uso offline) e si scrive tramite il worker. Senza VITE_COMMUNITY_API_URL la scrittura
 * è disattivata e non parte alcuna richiesta di rete.
 */
export function useCommunity() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot>(readCache)
  const [votedIds, setVotedIds] = useState<Set<string>>(readVoted)
  const [message, setMessage] = useState<CommunityMessage | null>(null)
  const enabled = communityApiUrl() !== null

  useEffect(() => {
    // Senza worker configurato la community è spenta del tutto: nessuna richiesta di rete
    // (e i test girano sull'app puramente locale, senza dipendere da GitHub).
    if (!enabled) return
    let cancelled = false
    fetchCommunity()
      .then((fresh) => {
        if (cancelled) return
        setSnapshot(fresh)
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(fresh))
        } catch {
          // Quota piena: si continua con la copia in memoria, il catalogo non è dato dell'utente
        }
      })
      // Offline o repo non raggiungibile: resta l'ultima copia in cache
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [enabled])

  const persistVoted = useCallback((next: Set<string>) => {
    setVotedIds(next)
    try {
      localStorage.setItem(VOTED_KEY, JSON.stringify([...next]))
    } catch {
      // Idem: il voto è comunque già partito verso la community
    }
  }, [])

  /**
   * Voto ottimista: il conteggio si muove subito e viene poi rimpiazzato da quello
   * autorevole del worker (l'app non decide quanti voti ha un esercizio: lo dice il repo).
   * Se la richiesta fallisce, si torna esattamente allo stato di prima.
   */
  const toggleVote = useCallback(
    async (exerciseId: string) => {
      const action = votedIds.has(exerciseId) ? 'remove' : 'add'
      const before = snapshot
      const beforeVoted = votedIds
      const nextVoted = new Set(votedIds)
      if (action === 'add') nextVoted.add(exerciseId)
      else nextVoted.delete(exerciseId)

      const current = snapshot.counts[exerciseId] ?? 0
      setSnapshot({
        ...snapshot,
        counts: {
          ...snapshot.counts,
          [exerciseId]: Math.max(0, current + (action === 'add' ? 1 : -1)),
        },
      })
      persistVoted(nextVoted)

      try {
        const votes = await sendCommunityVote(exerciseId, action)
        if (votes !== null) {
          setSnapshot((s) => ({ ...s, counts: { ...s.counts, [exerciseId]: votes } }))
        }
        setMessage(null)
      } catch (error) {
        setSnapshot(before)
        persistVoted(beforeVoted)
        setMessage({
          kind: 'error',
          reason: error instanceof Error ? error.message : COMMUNITY_UNREACHABLE_ERROR,
        })
      }
    },
    [persistVoted, snapshot, votedIds],
  )

  /** Invia la proposta alla community; l'esito è un messaggio, mai un blocco del salvataggio locale. */
  const propose = useCallback(async (input: ProposalInput) => {
    try {
      await proposeToCommunity(input)
      setMessage({ kind: 'proposalSent' })
      const fresh = await fetchCommunity().catch(() => null)
      if (fresh) setSnapshot(fresh)
    } catch (error) {
      setMessage({
        kind: 'localOnly',
        reason: error instanceof Error ? error.message : COMMUNITY_UNREACHABLE_ERROR,
      })
    }
  }, [])

  return {
    enabled,
    exercises: snapshot.exercises,
    counts: snapshot.counts,
    votedIds,
    message,
    dismissMessage: useCallback(() => setMessage(null), []),
    toggleVote,
    propose,
  }
}
