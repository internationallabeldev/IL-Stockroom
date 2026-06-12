'use client'

import { Layers, Package, AlertTriangle, Activity, ArrowRight, Minus } from 'lucide-react'
import type { InkLot } from '@/actions/ink-inventory.actions'
import { InventoryStatsBar, type StatItem } from '../inventory-stats-bar-shell'
import { getLotDailyRate } from './lot-utils'

export function InkInventoryStatsBar({ lots, iconOnly = false }: { lots: InkLot[]; iconOnly?: boolean }) {
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

  const stats: StatItem[] = [
    {
      icon: Layers,
      label: 'Lotes activos',
      value: String(active.length),
      accent: null,
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
    ...(fifoLot
      ? [{
          icon: ArrowRight,
          label: 'Prioridad FIFO',
          value: fifoLot.internal_batch,
          accent: null,
          mono: true,
        } as StatItem]
      : []),
  ]

  return <InventoryStatsBar stats={stats} iconOnly={iconOnly} />
}
