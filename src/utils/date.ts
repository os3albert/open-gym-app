/** Data locale del dispositivo in formato ISO (YYYY-MM-DD): in palestra conta il giorno locale, non UTC. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00`)
  date.setDate(date.getDate() + days)
  return todayIso(date)
}

/** Giorni della settimana in italiano, da lunedì: sono i nomi «magici» dei giorni di scheda. */
export const WEEKDAYS_IT = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
] as const

/** Nome italiano del giorno della settimana di una data ISO locale (es. 2026-07-11 → Sabato). */
export function weekdayNameIt(isoDate: string): string {
  const jsDay = new Date(`${isoDate}T00:00:00`).getDay() // 0 = domenica
  return WEEKDAYS_IT[(jsDay + 6) % 7]
}

export function formatDateIt(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
