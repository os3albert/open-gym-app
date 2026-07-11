import type { AppView } from '../hooks/useView'

const TABS: Array<{ view: AppView; label: string }> = [
  { view: 'esercizi', label: 'Esercizi' },
  { view: 'schede', label: 'Schede' },
  { view: 'allenamento', label: 'Allenamento' },
  { view: 'storico', label: 'Storico' },
]

interface Props {
  view: AppView
  onChange: (view: AppView) => void
}

export function TabNav({ view, onChange }: Props) {
  return (
    <nav className="tab-nav" aria-label="Sezioni dell'app">
      {TABS.map((tab) => (
        <button
          key={tab.view}
          type="button"
          data-cy={`tab-${tab.view}`}
          className={view === tab.view ? 'tab active' : 'tab'}
          aria-current={view === tab.view ? 'page' : undefined}
          onClick={() => onChange(tab.view)}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
