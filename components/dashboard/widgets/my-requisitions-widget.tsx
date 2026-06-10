'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ClipboardList, CheckCircle, ArrowRight } from 'lucide-react'
import { getPendingRequisitions } from '@/actions/dashboard.actions'

export function MyRequisitionsWidget() {
  const { data: reqs, isLoading } = useQuery({
    queryKey: ['pending-requisitions'],
    queryFn:  getPendingRequisitions,
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-card border border-border p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="size-3.5 text-foreground/60" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Mis requisiciones</h3>
        </div>
        <Link
          href="/dashboard/requisitions/ink"
          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
        >
          Nueva requisición <ArrowRight className="size-2.5" />
        </Link>
      </div>
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse" />)}
        </div>
      ) : (reqs?.length ?? 0) === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <CheckCircle className="size-5 text-green-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40">Sin requisiciones activas</p>
        </div>
      ) : (
        <div className="space-y-1 flex-1 min-h-0 overflow-y-auto no-scrollbar">
          {reqs!.slice(0, 8).map(req => (
            <div key={req.id} className="flex items-center gap-3 px-3 py-2.5 bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-bold">#{req.requisition_number}</span>
                  <span className="text-[9px] text-foreground/40 uppercase tracking-wider">
                    {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
                  </span>
                </div>
                <p className="text-[9px] text-foreground/40 mt-0.5">OT: {req.production_order}</p>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-yellow-700 bg-yellow-500/10 px-1.5 py-0.5">
                {req.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
