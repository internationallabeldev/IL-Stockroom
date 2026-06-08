'use client'

import { Layers, Package, AlertTriangle, Activity, ArrowRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InkLot } from '@/actions/ink-inventory.actions'
import { getLotDailyRate } from './lot-utils'

export function InkInventoryStatsBar({ lots }: { lots: InkLot[] }) {
  const active = lots.filter(l => l.enabled)

  const totalKg = active.reduce((s, l) => s + (l.remaining_kg ?? 0), 0)

  const belowMin = active.filter(l => {
    const min = l.ink_catalog?.min_stock_kg ?? 0
    return min > 0 && (l.remaining_kg ?? 0) < min
  }).length

  const rates = active.map(getLotDailyRate).filter((r): r is number => r !== null)
  const avgRate = rates.length > 0 ? rates.reduce((s, r) => s + r, 0) / rates.length : null

  const noMovement = active.filter(l => (l.used_kg ?? 0) === 0).length

  const fifoLot = active
    .filter(l => (l.remaining_kg ?? 0) > 0 && l.receipt?.receipt_date)
    .sort((a, b) =>
      (a.receipt!.receipt_date as string).localeCompare(b.receipt!.receipt_date as string)
    )[0]

  const stats = [
    {
      icon: Layers,
      label: 'Lotes activos',
      value: String(active.length),
      accent: null as 'amber' | 'red' | null,
    },
    {
      icon: Package,
      label: 'KG disponibles',
      value: `${totalKg.toFixed(1)} kg`,
      accent: null,
    },
    ...(belowMin > 0
      ? [{
          icon: AlertTriangle,
          label: 'Bajo mínimo',
          value: String(belowMin),
          accent: 'amber' as const,
        }]
      : []),
    ...(avgRate !== null
      ? [{
          icon: Activity,
          label: 'Consumo prom.',
          value: `${avgRate.toFixed(1)} kg/d`,
          accent: null,
        }]
      : []),
    ...(noMovement > 0
      ? [{
          icon: Minus,
          label: 'Sin movimiento',
          value: String(noMovement),
          accent: null,
        }]
      : []),
  ]

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2">
      {stats.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden sm:inline">·</span>}
          <Icon
            className={cn(
              'size-3 shrink-0',
              accent === 'red'   ? 'text-red-500'   :
              accent === 'amber' ? 'text-amber-400'  :
              'text-muted-foreground/50',
            )}
          />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {label}
          </span>
          <span
            className={cn(
              'text-[11px] font-bold tabular-nums',
              accent === 'red'   ? 'text-red-500'   :
              accent === 'amber' ? 'text-amber-400'  :
              'text-foreground/80',
            )}
          >
            {value}
          </span>
        </div>
      ))}

      {fifoLot && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden sm:inline">·</span>
          <ArrowRight className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            Prioridad FIFO
          </span>
          <span className="text-[11px] font-bold font-mono text-foreground/80">
            {fifoLot.internal_batch}
          </span>
        </div>
      )}
    </div>
  )
}
