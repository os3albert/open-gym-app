import type { TrendMetric, TrendPoint } from '../domain/activity'
import { formatDateIt } from '../utils/date'

interface Props {
  points: TrendPoint[]
  metric?: TrendMetric
}

const WIDTH = 480
const HEIGHT = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 44 }

/** Etichette per metrica: unità dei valori e titolo usato nella descrizione accessibile. */
const METRIC_LABELS: Record<TrendMetric, { unit: string; title: string }> = {
  maxWeight: { unit: 'kg', title: 'Andamento del carico' },
  totalReps: { unit: 'reps', title: 'Andamento delle ripetizioni totali' },
  maxReps: { unit: 'reps', title: 'Andamento delle ripetizioni massime' },
  volume: { unit: 'kg×reps', title: 'Andamento del volume' },
}

/**
 * Andamento di un esercizio nel tempo: singola serie su scala temporale lineare.
 * Marchi sottili, griglia recessiva, etichette dirette solo su primo/ultimo punto,
 * tooltip nativi (<title>) su hit-target più grandi del marker.
 */
export function TrendChart({ points, metric = 'maxWeight' }: Props) {
  if (points.length === 0) {
    return <p data-cy="trend-empty">Nessuna sessione registrata per questo esercizio.</p>
  }

  const { unit, title } = METRIC_LABELS[metric]
  const times = points.map((p) => new Date(`${p.date}T00:00:00`).getTime())
  const values = points.map((p) => p.value)
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const vMin = Math.min(...values)
  const vMax = Math.max(...values)
  const vPad = Math.max((vMax - vMin) * 0.15, 2.5)

  const x = (t: number) =>
    tMax === tMin
      ? (WIDTH + PAD.left - PAD.right) / 2
      : PAD.left + ((t - tMin) / (tMax - tMin)) * (WIDTH - PAD.left - PAD.right)
  const y = (v: number) =>
    PAD.top + ((vMax + vPad - v) / (vMax + vPad - (vMin - vPad))) * (HEIGHT - PAD.top - PAD.bottom)

  const coords = points.map((p, i) => ({ ...p, cx: x(times[i]), cy: y(p.value) }))
  const gridYs = [vMin - vPad, (vMin + vMax) / 2, vMax + vPad].map(y)
  const first = points[0]
  const last = points[points.length - 1]

  return (
    <svg
      className="trend-chart"
      data-cy="trend-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`${title}: da ${first.value} ${unit} (${formatDateIt(first.date)}) a ${last.value} ${unit} (${formatDateIt(last.date)})`}
    >
      {gridYs.map((gy, i) => (
        <line key={i} x1={PAD.left} x2={WIDTH - PAD.right} y1={gy} y2={gy} className="grid-line" />
      ))}
      <text x={PAD.left - 6} y={y(vMax) + 4} textAnchor="end" className="axis-label">
        {vMax}
      </text>
      <text x={PAD.left - 6} y={y(vMin) + 4} textAnchor="end" className="axis-label">
        {vMin}
      </text>
      <text x={PAD.left} y={HEIGHT - 8} textAnchor="start" className="axis-label">
        {formatDateIt(first.date)}
      </text>
      {points.length > 1 && (
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="axis-label">
          {formatDateIt(last.date)}
        </text>
      )}
      {coords.length > 1 && (
        <polyline
          className="trend-line"
          fill="none"
          points={coords.map((c) => `${c.cx},${c.cy}`).join(' ')}
        />
      )}
      {coords.map((c, i) => (
        <g key={c.date}>
          {(i === 0 || i === coords.length - 1) && (
            <text
              x={c.cx}
              y={c.cy - 10}
              // Etichette ancorate verso l'interno: quelle dei punti estremi uscirebbero dal riquadro
              textAnchor={coords.length === 1 ? 'middle' : i === 0 ? 'start' : 'end'}
              className="point-label"
            >
              {c.value} {unit}
            </text>
          )}
          <circle className="trend-marker" cx={c.cx} cy={c.cy} r={4} />
          <circle className="trend-hit" cx={c.cx} cy={c.cy} r={14}>
            <title>{`${formatDateIt(c.date)} — ${c.value} ${unit}`}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}
