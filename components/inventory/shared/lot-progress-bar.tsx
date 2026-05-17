import { cn } from '@/lib/utils'

type Props = {
  initial: number
  used:    number
  unit?:   'kg' | 'm²'
}

function barColor(pct: number) {
  if (pct < 0.25) return 'bg-red-500'
  if (pct < 0.50) return 'bg-yellow-500'
  return 'bg-green-500'
}

export function LotProgressBar({ initial, used, unit = 'kg' }: Props) {
  const remaining = Math.max(0, initial - used)
  const pct       = initial > 0 ? remaining / initial : 0
  const color     = barColor(pct)

  return (
    <div className="space-y-1 min-w-28">
      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
        <span>{remaining.toFixed(1)} {unit}</span>
        <span>{(pct * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-muted overflow-hidden">
        <div className={cn('h-full transition-all', color)} style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  )
}
