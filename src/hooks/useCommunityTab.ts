import { useEffect, useState } from 'react'

export type CommunityTab = 'esercizi' | 'schede'

const TABS: CommunityTab[] = ['esercizi', 'schede']

function readTabFromUrl(): CommunityTab | null {
  const value = new URLSearchParams(window.location.search).get('sezione')
  return TABS.includes(value as CommunityTab) ? (value as CommunityTab) : null
}

/**
 * La sotto-sezione della vista Community (?sezione=…): «esercizi» è l'atterraggio e non
 * mette parametro — così `?vista=community` continua ad aprire la lista degli esercizi,
 * che è il contratto dei test esistenti. Come useView: si parte SEMPRE dai parametri
 * correnti, mai da URLSearchParams vuoto.
 */
export function useCommunityTab(): [CommunityTab, (tab: CommunityTab) => void] {
  const [tab, setTab] = useState<CommunityTab>(() => readTabFromUrl() ?? 'esercizi')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (tab === 'esercizi') params.delete('sezione')
    else params.set('sezione', tab)
    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [tab])

  return [tab, setTab]
}
