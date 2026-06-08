'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Package, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getSupplyAlerts } from '@/actions/supplies.actions'
import { type SupplyItemWithStatus } from '@/lib/supplies/types'

const STATUS_DOT: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500',
  empty:    'bg-foreground/80',
}

function AlertRow({ item }: { item: SupplyItemWithStatus }) {
  const isCritical = item.status === 'critical' || item.status === 'empty'

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <span className={cn('size-2 rounded-full shrink-0', STATUS_DOT[item.status])} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[11px] font-bold truncate">{item.name}</p>
          {item.status === 'empty' && (
            <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5">
              Sin stock
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted overflow-hidden">
            <div
              className={cn('h-full', isCritical ? 'bg-red-500' : 'bg-yellow-400')}
              style={{
                width: `${Math.min(100, Math.round(
                  (item.quantity_current / Math.max(item.quantity_warning ?? Math.ceil(item.quantity_minimum * 1.5), 1)) * 100
                ))}%`
              }}
            />
          </div>
          <span className={cn('text-[9px] font-mono shrink-0 w-20 text-right', isCritical ? 'text-destructive' : 'text-foreground/50')}>
            {item.quantity_current} / {item.quantity_minimum} {item.unit}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SuppliesAlertWidget() {
  const { data, isLoading } = useQuery({
    queryKey:       ['supply-alerts'],
    queryFn:        getSupplyAlerts,
    refetchInterval: 30_000,
  })

  const critical = data?.critical ?? []
  const warning  = data?.warning  ?? []
  const total    = data?.total    ?? 0

  // Ordered: critical first then warning, max 5
  const displayItems: SupplyItemWithStatus[] = [...critical, ...warning].slice(0, 5)

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="size-3.5 text-foreground/50" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Consumibles</h3>
          {!isLoading && total > 0 && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5">
              {total}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/supplies"
          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
        >
          Ver todos <ArrowRight className="size-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse" />
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">
            Todo en orden
          </p>
        </div>
      ) : (
        <>
          <div>
            {displayItems.map(item => (
              <AlertRow key={item.id} item={item} />
            ))}
          </div>
          {total > 5 && (
            <p className="text-[9px] text-foreground/30 mt-3 text-center">
              +{total - 5} items más requieren atención
            </p>
          )}
        </>
      )}
    </div>
  )
}
