import type { TrendPoint } from '../domain/activity'
import { formatDateIt } from '../utils/date'

interface Props {
  points: TrendPoint[]
}

const WIDTH = 480
const HEIGHT = 200
const PAD = { top: 16, right: 16, bottom: 26, left: 44 }

/**
 * Andamento del carico nel tempo: singola serie su scala temporale lineare.
 * Marchi sottili, griglia recessiva, etichette dirette solo su primo/ultimo punto,
 * tooltip nativi (<title>) su hit-target più grandi del marker.
 */
export function TrendChart({ points }: Props) {
  if (points.length === 0) {
    return <p data-cy="trend-empty">Nessuna sessione registrata per questo esercizio.</p>
  }

  const times = points.map((p) => new Date(`${p.date}T00:00:00`).getTime())
  const weights = points.map((p) => p.maxWeightKg)
  const tMin = Math.min(...times)
  const tMax = Math.max(...times)
  const wMin = Math.min(...weights)
  const wMax = Math.max(...weights)
  const wPad = Math.max((wMax - wMin) * 0.15, 2.5)

  const x = (t: number) =>
    tMax === tMin
      ? (WIDTH + PAD.left - PAD.right) / 2
      : PAD.left + ((t - tMin) / (tMax - tMin)) * (WIDTH - PAD.left - PAD.right)
  const y = (w: number) =>
    PAD.top + ((wMax + wPad - w) / (wMax + wPad - (wMin - wPad))) * (HEIGHT - PAD.top - PAD.bottom)

  const coords = points.map((p, i) => ({ ...p, cx: x(times[i]), cy: y(p.maxWeightKg) }))
  const gridYs = [wMin - wPad, (wMin + wMax) / 2, wMax + wPad].map(y)

  return (
    <svg
      className="trend-chart"
      data-cy="trend-chart"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label={`Andamento del carico: da ${points[0].maxWeightKg} kg (${formatDateIt(points[0].date)}) a ${points[points.length - 1].maxWeightKg} kg (${formatDateIt(points[points.length - 1].date)})`}
    >
      {gridYs.map((gy, i) => (
        <line key={i} x1={PAD.left} x2={WIDTH - PAD.right} y1={gy} y2={gy} className="grid-line" />
      ))}
      <text x={PAD.left - 6} y={y(wMax) + 4} textAnchor="end" className="axis-label">
        {wMax}
      </text>
      <text x={PAD.left - 6} y={y(wMin) + 4} textAnchor="end" className="axis-label">
        {wMin}
      </text>
      <text x={PAD.left} y={HEIGHT - 8} textAnchor="start" className="axis-label">
        {formatDateIt(points[0].date)}
      </text>
      {points.length > 1 && (
        <text x={WIDTH - PAD.right} y={HEIGHT - 8} textAnchor="end" className="axis-label">
          {formatDateIt(points[points.length - 1].date)}
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
            <text x={c.cx} y={c.cy - 10} textAnchor="middle" className="point-label">
              {c.maxWeightKg} kg
            </text>
          )}
          <circle className="trend-marker" cx={c.cx} cy={c.cy} r={4} />
          <circle className="trend-hit" cx={c.cx} cy={c.cy} r={14}>
            <title>{`${formatDateIt(c.date)} — ${c.maxWeightKg} kg`}</title>
          </circle>
        </g>
      ))}
    </svg>
  )
}
