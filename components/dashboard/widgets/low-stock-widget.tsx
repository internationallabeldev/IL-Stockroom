'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getLowStockAlerts } from '@/actions/dashboard.actions'
import type { LowStockItem } from '@/types/dashboard.types'

function StockRow({ item }: { item: LowStockItem }) {
  const pct  = Math.min(item.stock_percentage, 100)
  const crit = pct === 0
  const warn = pct <= 25

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      {item.color_code && (
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color_code }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-[11px] font-bold truncate">{item.name}</p>
          {crit && (
            <span className="shrink-0 text-[8px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5">
              Sin stock
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted overflow-hidden">
            <div
              className={cn('h-full transition-all', crit ? 'bg-destructive' : warn ? 'bg-yellow-500' : 'bg-green-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className={cn('text-[9px] font-mono shrink-0 w-16 text-right', crit ? 'text-destructive' : 'text-foreground/50')}>
            {item.current_stock.toLocaleString('es-MX', { maximumFractionDigits: 1 })} {item.unit}
          </span>
        </div>
      </div>
    </div>
  )
}

export function LowStockWidget({ materialType }: { materialType?: 'INK' | 'PAPER' | 'BOTH' }) {
  const type = materialType ?? 'BOTH'

  const { data, isLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn:  getLowStockAlerts,
    refetchInterval: 30_000,
  })

  const inks   = type !== 'PAPER' ? (data?.inks   ?? []) : []
  const papers = type !== 'INK'   ? (data?.papers ?? []) : []
  const all    = [...inks, ...papers]

  const catalogHref = type === 'INK'
    ? '/dashboard/catalog/inks'
    : type === 'PAPER'
    ? '/dashboard/catalog/paper'
    : '/dashboard/catalog/inks'

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-3.5 text-yellow-600" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Stock bajo</h3>
          {!isLoading && all.length > 0 && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 px-1.5 py-0.5">
              {all.length}
            </span>
          )}
        </div>
        <Link
          href={catalogHref}
          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
        >
          Ver catálogo <ArrowRight className="size-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-muted animate-pulse" />
          ))}
        </div>
      ) : all.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Todo en stock</p>
        </div>
      ) : (
        <div className="max-h-80 overflow-y-auto no-scrollbar">
          {type === 'BOTH' && inks.length > 0 && (
            <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/30 mb-2">Tintas</p>
          )}
          {inks.map(item => <StockRow key={`ink-${item.id}`} item={item} />)}

          {type === 'BOTH' && papers.length > 0 && (
            <p className="text-[8px] font-bold uppercase tracking-widest text-foreground/30 mt-4 mb-2">Papel</p>
          )}
          {papers.map(item => <StockRow key={`paper-${item.id}`} item={item} />)}
        </div>
      )}
    </div>
  )
}
