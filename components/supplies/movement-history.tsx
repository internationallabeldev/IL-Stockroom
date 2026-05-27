'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { getSupplyItemById } from '@/actions/supplies.actions'
import { type SupplyItem, type SupplyMovement } from '@/lib/supplies/types'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const TYPE_CONFIG = {
  IN: {
    label: 'Entrada',
    icon:  ArrowUp,
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    arrow: 'text-green-600',
  },
  OUT: {
    label: 'Uso',
    icon:  ArrowDown,
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    arrow: 'text-red-500',
  },
  ADJUSTMENT: {
    label: 'Ajuste',
    icon:  RefreshCw,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    arrow: 'text-blue-500',
  },
}

function MovementRow({ movement, unit }: { movement: SupplyMovement; unit: string }) {
  const cfg = TYPE_CONFIG[movement.movement_type]
  const Icon = cfg.icon

  const userName = movement.performed_by_user
    ? `${movement.performed_by_user.first_name ?? ''} ${movement.performed_by_user.last_name ?? ''}`.trim()
    : '—'

  return (
    <div className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest shrink-0', cfg.badge)}>
            <Icon className="size-2.5" />
            {cfg.label}
          </span>
          <span className={cn('text-sm font-bold tabular-nums shrink-0', cfg.arrow)}>
            {movement.movement_type === 'IN' ? '+' : movement.movement_type === 'OUT' ? '-' : '='}
            {movement.quantity} {unit}
          </span>
        </div>
        <span className="text-[9px] text-foreground/40 shrink-0 mt-0.5">
          {movement.created_at
            ? format(new Date(movement.created_at), "d MMM yyyy, HH:mm", { locale: es })
            : '—'}
        </span>
      </div>

      {/* Before → After */}
      <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-foreground/50">
        <span className="tabular-nums">{movement.quantity_before} {unit}</span>
        <span className="text-foreground/30">→</span>
        <span className={cn('font-bold tabular-nums', cfg.arrow)}>{movement.quantity_after} {unit}</span>
      </div>

      {/* Notes & user */}
      <div className="mt-1 flex items-center justify-between gap-3">
        {movement.notes && (
          <p className="text-[10px] text-foreground/50 italic truncate">{movement.notes}</p>
        )}
        <span className="text-[9px] text-foreground/30 shrink-0 ml-auto">{userName}</span>
      </div>
    </div>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  item: SupplyItem
}

export function MovementHistory({ open, onClose, item }: Props) {
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  const { data, isLoading } = useQuery({
    queryKey:  ['supply-item-history', item.id],
    queryFn:   () => getSupplyItemById(item.id),
    enabled:   open,
    refetchInterval: 30_000,
  })

  const movements = data?.movements ?? []
  const paged     = movements.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(movements.length / PAGE_SIZE)

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-sm font-bold uppercase tracking-widest">
            Historial de movimientos
          </SheetTitle>
          <p className="text-[10px] text-foreground/50 -mt-1">{item.name}</p>

          {/* Current stock summary */}
          <div className="mt-3 flex items-center justify-between bg-muted px-3 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/50">Stock actual</span>
            <span className="text-base font-bold tabular-nums">
              {data?.quantity_current ?? item.quantity_current}{' '}
              <span className="text-xs font-normal text-foreground/40">{item.unit}</span>
            </span>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {isLoading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse" />
              ))}
            </div>
          ) : paged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <RefreshCw className="size-6 text-foreground/20" />
              <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">Sin movimientos</p>
            </div>
          ) : (
            <div>
              {paged.map(m => (
                <MovementRow key={m.id} movement={m} unit={item.unit} />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <span className="text-[9px] text-foreground/40">
              {movements.length} movimientos
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 disabled:opacity-30 hover:text-foreground transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-[9px] tabular-nums text-foreground/30">{page + 1}/{totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 disabled:opacity-30 hover:text-foreground transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
