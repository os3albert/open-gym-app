/** Elenco di valori da min a max: `range(0, 300, 2.5)` = i carichi di un bilanciere. */
export function range(min: number, max: number, step = 1): number[] {
  const values: number[] = []
  // Si conta in passi interi e si arrotonda: 0.1 + 0.2 in virgola mobile non fa 0.3
  for (let i = 0; min + i * step <= max + 1e-9; i++) {
    values.push(Number((min + i * step).toFixed(2)))
  }
  return values
}
