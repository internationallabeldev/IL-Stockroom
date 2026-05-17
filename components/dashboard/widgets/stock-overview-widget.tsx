'use client'

import { useQuery } from '@tanstack/react-query'
import { Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getStockOverview } from '@/actions/dashboard.actions'
import type { StockOverviewItem } from '@/types/dashboard.types'

function StockRow({ item }: { item: StockOverviewItem }) {
  const pct  = item.min_stock > 0 ? Math.min((item.current_stock / item.min_stock) * 100, 200) : 100
  const low  = item.min_stock > 0 && item.current_stock <= item.min_stock
  const crit = item.current_stock === 0

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      {item.color_code && (
        <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color_code }} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold truncate">{item.name}</p>
          <span className={cn('font-mono text-[10px] shrink-0 ml-2', crit ? 'text-destructive font-bold' : low ? 'text-yellow-600' : 'text-foreground/50')}>
            {item.current_stock.toLocaleString('es-MX', { maximumFractionDigits: 1 })} {item.unit}
          </span>
        </div>
        {item.min_stock > 0 && (
          <div className="h-1 bg-muted overflow-hidden">
            <div
              className={cn('h-full transition-all', crit ? 'bg-destructive' : low ? 'bg-yellow-500' : 'bg-green-500')}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export function StockOverviewWidget({ materialType }: { materialType: 'INK' | 'PAPER' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['stock-overview'],
    queryFn:  getStockOverview,
    refetchInterval: 30_000,
  })

  const items = materialType === 'INK' ? (data?.inks ?? []) : (data?.papers ?? [])

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Package className="size-3.5 text-foreground/60" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest">
          {materialType === 'INK' ? 'Stock de tintas' : 'Stock de papel'}
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-10 bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Sin materiales</p>
        </div>
      ) : (
        <div>
          {items.map(item => <StockRow key={item.id} item={item} />)}
        </div>
      )}
    </div>
  )
}
