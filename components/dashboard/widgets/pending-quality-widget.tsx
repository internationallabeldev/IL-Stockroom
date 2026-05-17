'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ClipboardCheck, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPendingQualityReceipts } from '@/actions/dashboard.actions'

export function PendingQualityWidget() {
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['pending-quality'],
    queryFn:  getPendingQualityReceipts,
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="size-3.5 text-foreground/60" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Calidad pendiente</h3>
          {!isLoading && (receipts?.length ?? 0) > 0 && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/50 bg-muted px-1.5 py-0.5">
              {receipts!.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/receipts/ink"
          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
        >
          Ver recepciones <ArrowRight className="size-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse" />)}
        </div>
      ) : (receipts?.length ?? 0) === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Sin recepciones pendientes</p>
        </div>
      ) : (
        <div className="space-y-1">
          {receipts!.map(r => (
            <div key={`${r.material_type}-${r.id}`} className={cn(
              'flex items-center gap-3 px-3 py-2.5 bg-muted/30 border-l-2',
              r.days_pending > 3 ? 'border-destructive' : 'border-border'
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[9px] font-bold text-foreground/50">{r.internal_batch}</span>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-foreground/40">
                    {r.material_type === 'INK' ? 'Tinta' : 'Papel'}
                  </span>
                </div>
                <p className="text-[11px] font-bold truncate mt-0.5">{r.material_name}</p>
                <p className="text-[9px] text-foreground/40 mt-0.5">
                  {r.quantity.toLocaleString('es-MX', { maximumFractionDigits: 1 })} {r.material_type === 'INK' ? 'kg' : 'm²'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={cn('font-mono text-[10px] font-bold', r.days_pending > 3 ? 'text-destructive' : 'text-foreground/50')}>
                  {r.days_pending}d
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
