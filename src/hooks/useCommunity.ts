import { useCallback, useEffect, useState } from 'react'
import {
  COMMUNITY_UNREACHABLE_ERROR,
  communityApiUrl,
  fetchCommunity,
  hashDeviceId,
  proposeToCommunity,
  sendCommunityVote,
  type CommunitySnapshot,
} from '../services/community'
import { toggleCommunityVote, type ProposalInput } from '../services/communityData'

/** Chiavi separate da AppData: la community non entra nel backup né nello schema dati. */
const CACHE_KEY = 'open-gym-app/community'
const DEVICE_KEY = 'open-gym-app/dispositivo'
const VOTED_KEY = 'open-gym-app/voti-community'

const EMPTY: CommunitySnapshot = { exercises: [], votes: {} }

function readCache(): CommunitySnapshot {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CommunitySnapshot) : EMPTY
  } catch {
    return EMPTY
  }
}

function readVoted(): Set<string> {
  try {
    const raw = localStorage.getItem(VOTED_KEY)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

/** Id casuale per dispositivo: nel repo ne finisce solo l'hash (mai l'id stesso). */
function deviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

/**
 * Catalogo condiviso su GitHub: si legge dai file grezzi del repo (con cache locale per
 * l'uso offline) e si scrive tramite il worker. Senza VITE_COMMUNITY_API_URL la scrittura
 * è disattivata, ma la lettura del catalogo funziona comunque.
 */
export function useCommunity() {
  const [snapshot, setSnapshot] = useState<CommunitySnapshot>(readCache)
  const [votedIds, setVotedIds] = useState<Set<string>>(readVoted)
  const [message, setMessage] = useState<string | null>(null)
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

  /** Voto ottimista: la lista si aggiorna subito, e in caso di errore si torna indietro. */
  const toggleVote = useCallback(
    async (exerciseId: string) => {
      const action = votedIds.has(exerciseId) ? 'remove' : 'add'
      const before = snapshot
      const hash = await hashDeviceId(deviceId())
      const nextVoted = new Set(votedIds)
      if (action === 'add') nextVoted.add(exerciseId)
      else nextVoted.delete(exerciseId)

      setSnapshot({
        ...snapshot,
        votes: toggleCommunityVote(snapshot.votes, exerciseId, hash, action, snapshot.exercises),
      })
      persistVoted(nextVoted)

      try {
        await sendCommunityVote(exerciseId, hash, action)
        setMessage(null)
      } catch (error) {
        setSnapshot(before)
        persistVoted(votedIds)
        setMessage(error instanceof Error ? error.message : COMMUNITY_UNREACHABLE_ERROR)
      }
    },
    [persistVoted, snapshot, votedIds],
  )

  /** Invia la proposta alla community; l'esito è un messaggio, mai un blocco del salvataggio locale. */
  const propose = useCallback(async (input: ProposalInput) => {
    try {
      await proposeToCommunity(input)
      setMessage('Proposta inviata alla community!')
      const fresh = await fetchCommunity().catch(() => null)
      if (fresh) setSnapshot(fresh)
    } catch (error) {
      setMessage(
        `Salvato solo sul dispositivo: ${error instanceof Error ? error.message : COMMUNITY_UNREACHABLE_ERROR}`,
      )
    }
  }, [])

  return {
    enabled,
    exercises: snapshot.exercises,
    votes: snapshot.votes,
    votedIds,
    message,
    dismissMessage: useCallback(() => setMessage(null), []),
    toggleVote,
    propose,
  }
}
