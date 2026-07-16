import type { TrendPoint } from '../domain/activity'
import { useT } from '../i18n/context'
import { formatDateIt } from '../utils/date'

interface Props {
  /** Carico massimo per giorno (kg): la serie dell'asse sinistro. */
  weight: TrendPoint[]
  /** Ripetizioni per giorno: la serie dell'asse destro. */
  reps: TrendPoint[]
}

const WIDTH = 480
const HEIGHT = 190
// Due assi: a destra ci vanno le etichette delle ripetizioni, serve lo stesso spazio di sinistra
const PAD = { top: 20, right: 44, bottom: 26, left: 44 }

/**
 * Peso e ripetizioni INSIEME, come si guarda un allenamento: quanto ho caricato e quante ne ho
 * fatte. Due serie su due scale (kg a sinistra, reps a destra) e la stessa scala temporale.
 *
 * Riusa il linguaggio di TrendChart (griglia recessiva, marker sottili, tooltip nativi) senza
 * toccarlo: la SUA aria-label è contratto dei test dello Storico. Questa ha la propria, ed è
 * contratto anche lei: «Andamento di peso e ripetizioni: …».
 */
export function DualTrendChart({ weight, reps }: Props) {
  // Prima di ogni return anticipato: gli hook si chiamano sempre, e sempre nello stesso ordine
  const t = useT()

  if (weight.length === 0 && reps.length === 0) return null

  // Le due serie vengono dalla stessa aggregazione per giorno: l'asse X è l'unione delle date
  const dates = [...new Set([...weight, ...reps].map((p) => p.date))].sort()
  const times = dates.map((d) => new Date(`${d}T00:00:00`).getTime())
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const x = (time: number) =>
    tMax === tMin
      ? (WIDTH + PAD.left - PAD.right) / 2
      : PAD.left + ((time - tMin) / (tMax - tMin)) * (WIDTH - PAD.left - PAD.right)

  const scaleY = (values: number[]) => {
    const vMin = Math.min(...values)
    const vMax = Math.max(...values)
    const vPad = Math.max((vMax - vMin) * 0.15, 2.5)
    return {
      vMin,
      vMax,
      y: (v: number) =>
        PAD.top +
        ((vMax + vPad - v) / (vMax + vPad - (vMin - vPad))) * (HEIGHT - PAD.top - PAD.bottom),
    }
  }

  const toCoords = (points: TrendPoint[], y: (v: number) => number) =>
    points.map((p) => ({ ...p, cx: x(new Date(`${p.date}T00:00:00`).getTime()), cy: y(p.value) }))

  const weightScale = weight.length > 0 ? scaleY(weight.map((p) => p.value)) : null
  const repsScale = reps.length > 0 ? scaleY(reps.map((p) => p.value)) : null
  const weightCoords = weightScale ? toCoords(weight, weightScale.y) : []
  const repsCoords = repsScale ? toCoords(reps, repsScale.y) : []

  const gridYs = [PAD.top, HEIGHT / 2 - 3, HEIGHT - PAD.bottom]
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]

  const label = t('chart.dualLabel', {
    weightFrom: weight[0]?.value ?? 0,
    weightTo: weight[weight.length - 1]?.value ?? 0,
    repsFrom: reps[0]?.value ?? 0,
    repsTo: reps[reps.length - 1]?.value ?? 0,
    from: formatDateIt(firstDate),
    to: formatDateIt(lastDate),
  })

  return (
    <svg
      className="trend-chart"
      data-cy="dual-trend-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={label}
    >
      {gridYs.map((gy, i) => (
        <line key={i} x1={PAD.left} x2={WIDTH - PAD.right} y1={gy} y2={gy} className="grid-line" />
      ))}

      {/* Legenda-unità agli angoli: dice di chi è ciascun asse senza rubare spazio */}
      <text x={PAD.left - 6} y={12} textAnchor="end" className="axis-label unit-weight">
        kg
      </text>
      <text x={WIDTH - PAD.right + 6} y={12} textAnchor="start" className="axis-label unit-reps">
        reps
      </text>

      {weightScale && (
        <>
          <text
            x={PAD.left - 6}
            y={weightScale.y(weightScale.vMax) + 4}
            textAnchor="end"
            className="axis-label"
          >
            {weightScale.vMax}
          </text>
          <text
            x={PAD.left - 6}
            y={weightScale.y(weightScale.vMin) + 4}
            textAnchor="end"
            className="axis-label"
          >
            {weightScale.vMin}
          </text>
        </>
      )}
      {repsScale && (
        <>
          <text
            x={WIDTH - PAD.right + 6}
            y={repsScale.y(repsScale.vMax) + 4}
            textAnchor="start"
            className="axis-label"
          >
            {repsScale.vMax}
          </text>
          <text
            x={WIDTH - PAD.right + 6}
            y={repsScale.y(repsScale.vMin) + 4}
            textAnchor="start"
            className="axis-label"
          >
            {repsScale.vMin}
          </text>
        </>
      )}

      <text x={PAD.left} y={HEIGHT - 8} textAnchor="start" className="axis-label">
        {formatDateIt(firstDate)}
      </text>
      {dates.length > 1 && (
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="axis-label">
          {formatDateIt(lastDate)}
        </text>
      )}

      {weightCoords.length > 1 && (
        <polyline
          className="trend-line"
          fill="none"
          points={weightCoords.map((c) => `${c.cx},${c.cy}`).join(' ')}
        />
      )}
      {repsCoords.length > 1 && (
        <polyline
          className="trend-line trend-line-reps"
          fill="none"
          points={repsCoords.map((c) => `${c.cx},${c.cy}`).join(' ')}
        />
      )}

      {weightCoords.map((c) => (
        <g key={`w-${c.date}`}>
          <circle className="trend-marker" cx={c.cx} cy={c.cy} r={3.5} />
          <circle className="trend-hit" cx={c.cx} cy={c.cy} r={12}>
            <title>{`${formatDateIt(c.date)} — ${c.value} kg`}</title>
          </circle>
        </g>
      ))}
      {repsCoords.map((c) => (
        <g key={`r-${c.date}`}>
          <circle className="trend-marker trend-marker-reps" cx={c.cx} cy={c.cy} r={3.5} />
          <circle className="trend-hit" cx={c.cx} cy={c.cy} r={12}>
            <title>{`${formatDateIt(c.date)} — ${c.value} reps`}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}
