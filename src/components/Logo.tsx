interface Props {
  /** Lato in pixel del riquadro (il logo è quadrato). */
  size?: number
}

/**
 * Marchio di Open Gym: manubrio inclinato nel riquadro dell'accento.
 * Stesso disegno di public/logo.svg (favicon e icone PWA): se cambia uno, cambiano tutti.
 */
export function Logo({ size = 36 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Open Gym"
      focusable="false"
    >
      <defs>
        <linearGradient id="og-logo-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#65a30d" />
          <stop offset="1" stopColor="#3f6212" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" fill="url(#og-logo-bg)" />
      <g fill="#f7fee7" transform="rotate(-24 32 32)">
        <rect x="4" y="28" width="5" height="8" rx="2.5" />
        <rect x="11" y="19" width="10" height="26" rx="5" />
        <rect x="23" y="29" width="18" height="6" rx="3" />
        <rect x="43" y="19" width="10" height="26" rx="5" />
        <rect x="55" y="28" width="5" height="8" rx="2.5" />
      </g>
    </svg>
  )
}
