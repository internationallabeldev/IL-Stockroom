'use client'

import { cn } from '@/lib/utils'
import type { RequisitionInkItem, RequisitionPaperItem } from '@/actions/requisitions.actions'

type Props = {
  inkItems:   RequisitionInkItem[]
  paperItems: RequisitionPaperItem[]
}

export function RequisitionProgress({ inkItems, paperItems }: Props) {
  if (inkItems.length === 0 && paperItems.length === 0) return null

  return (
    <section className="border border-[#1A1A1A]/15">
      <div className="px-4 py-2.5 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
        <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Progreso de entrega
        </p>
      </div>
      <div className="divide-y divide-[#1A1A1A]/08">
        {inkItems.map(item => {
          const del = item.kg_delivered ?? 0
          const req = item.kg_requested
          const pct = req > 0 ? Math.min(100, (del / req) * 100) : 0
          return (
            <ItemRow
              key={item.id}
              name={item.ink_catalog?.name ?? '—'}
              code={item.ink_catalog?.code}
              delivered={`${del.toFixed(2)} kg`}
              requested={`${req.toFixed(2)} kg`}
              pct={pct}
              fulfilled={item.is_fulfilled ?? false}
            />
          )
        })}
        {paperItems.map(item => {
          const del = item.m2_delivered ?? 0
          const req = item.m2_requested ?? 0
          const pct = req > 0 ? Math.min(100, (del / req) * 100) : 0
          return (
            <ItemRow
              key={item.id}
              name={item.paper_catalog?.name ?? '—'}
              code={item.paper_catalog?.code}
              delivered={`${del.toFixed(3)} m²`}
              requested={`${req.toFixed(3)} m²`}
              pct={pct}
              fulfilled={item.is_fulfilled ?? false}
            />
          )
        })}
      </div>
    </section>
  )
}

function ItemRow({
  name, code, delivered, requested, pct, fulfilled,
}: {
  name: string; code?: string; delivered: string; requested: string; pct: number; fulfilled: boolean
}) {
  return (
    <div className="px-4 py-3 space-y-1.5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#1A1A1A] truncate">{name}</p>
          {code && <p className="text-[9px] font-mono text-[#5f5e59]">{code}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[11px] font-mono font-bold text-[#1A1A1A]">
            {delivered} / {requested}
          </p>
          <span className={cn(
            'text-[9px] font-bold uppercase tracking-widest',
            fulfilled ? 'text-green-700' : pct > 0 ? 'text-amber-700' : 'text-[#5f5e59]',
          )}>
            {fulfilled ? 'Completado' : pct > 0 ? `${pct.toFixed(0)}% parcial` : 'Pendiente'}
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-[#1A1A1A]/10 w-full">
        <div
          className={cn('h-full transition-all duration-300', fulfilled ? 'bg-green-500' : 'bg-[#1A1A1A]')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
