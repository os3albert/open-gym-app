import { useCallback, useEffect, useState } from 'react'
import {
  COMMUNITY_UNREACHABLE_ERROR,
  communityApiUrl,
  fetchCommunityPlans,
  proposePlanToCommunity,
  sendCommunityPlanVote,
  type CommunityPlansSnapshot,
} from '../services/community'
import type { PlanProposalInput } from '../services/communityData'
import type { CommunityMessage } from './useCommunity'

/** Chiavi separate da AppData (e dalla cache degli esercizi): niente backup, niente schema. */
const CACHE_KEY = 'open-gym-app/community-schede'
const VOTED_KEY = 'open-gym-app/voti-schede-community'

const EMPTY: CommunityPlansSnapshot = { plans: [], counts: {} }

function readCache(): CommunityPlansSnapshot {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as CommunityPlansSnapshot) : EMPTY
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

/**
 * Le schede proposte dalla community: stessa architettura di useCommunity (lettura dai file
 * grezzi del repo con cache locale, scrittura tramite worker, voto ottimista con rollback).
 * Senza VITE_COMMUNITY_API_URL non parte alcuna richiesta di rete.
 */
export function useCommunityPlans() {
  const [snapshot, setSnapshot] = useState<CommunityPlansSnapshot>(readCache)
  const [votedIds, setVotedIds] = useState<Set<string>>(readVoted)
  const [message, setMessage] = useState<CommunityMessage | null>(null)
  const enabled = communityApiUrl() !== null

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    fetchCommunityPlans()
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

  /** Voto ottimista con rollback, identico a quello degli esercizi. */
  const toggleVote = useCallback(
    async (planId: string) => {
      const action = votedIds.has(planId) ? 'remove' : 'add'
      const before = snapshot
      const beforeVoted = votedIds
      const nextVoted = new Set(votedIds)
      if (action === 'add') nextVoted.add(planId)
      else nextVoted.delete(planId)

      const current = snapshot.counts[planId] ?? 0
      setSnapshot({
        ...snapshot,
        counts: {
          ...snapshot.counts,
          [planId]: Math.max(0, current + (action === 'add' ? 1 : -1)),
        },
      })
      persistVoted(nextVoted)

      try {
        const votes = await sendCommunityPlanVote(planId, action)
        if (votes !== null) {
          setSnapshot((s) => ({ ...s, counts: { ...s.counts, [planId]: votes } }))
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

  /** Invia la proposta di scheda; l'esito è un messaggio (la scheda resta comunque tra le mie). */
  const propose = useCallback(async (input: PlanProposalInput) => {
    try {
      await proposePlanToCommunity(input)
      setMessage({ kind: 'proposalSent' })
      const fresh = await fetchCommunityPlans().catch(() => null)
      if (fresh) setSnapshot(fresh)
    } catch (error) {
      setMessage({
        kind: 'error',
        reason: error instanceof Error ? error.message : COMMUNITY_UNREACHABLE_ERROR,
      })
    }
  }, [])

  return {
    enabled,
    plans: snapshot.plans,
    counts: snapshot.counts,
    votedIds,
    message,
    dismissMessage: useCallback(() => setMessage(null), []),
    toggleVote,
    propose,
  }
}
