type Props = {
  current: number | null
  min: number | null
  unit: string
}

export function StockBadge({ current, min, unit }: Props) {
  const curr = current ?? 0
  const minimum = min ?? 0

  if (curr === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-destructive/40 text-destructive">
        <span className="size-1.5 rounded-full bg-destructive inline-block" />
        Sin stock
      </span>
    )
  }

  if (curr < minimum) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-amber-400/40 text-amber-600 dark:text-amber-400">
        <span className="size-1.5 rounded-full bg-amber-400 inline-block" />
        Stock bajo
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-emerald-400/40 text-emerald-600 dark:text-emerald-400">
      <span className="size-1.5 rounded-full bg-emerald-400 inline-block" />
      OK
    </span>
  )
}

export function StockBar({ current, min }: { current: number | null; min: number | null }) {
  const curr = current ?? 0
  const minimum = min ?? 0
  if (minimum === 0) return null

  const pct = Math.min(100, (curr / minimum) * 100)
  const color = curr === 0 ? 'bg-destructive' : curr < minimum ? 'bg-amber-400' : 'bg-emerald-400'

  return (
    <div className="w-full h-1 bg-[#E5E1D8] overflow-hidden">
      <div className={`h-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}
