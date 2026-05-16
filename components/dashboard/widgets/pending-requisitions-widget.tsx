'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ClipboardList, ArrowRight, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPendingRequisitions } from '@/actions/dashboard.actions'

const STATUS_LABEL: Record<string, string> = {
  PENDING:  'Pendiente',
  APPROVED: 'Aprobada',
  PARTIAL:  'Parcial',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING:  'bg-yellow-500/10 text-yellow-700',
  APPROVED: 'bg-blue-500/10 text-blue-700',
  PARTIAL:  'bg-orange-500/10 text-orange-700',
}

export function PendingRequisitionsWidget() {
  const { data: reqs, isLoading } = useQuery({
    queryKey: ['pending-requisitions'],
    queryFn:  getPendingRequisitions,
    refetchInterval: 30_000,
  })

  const urgent = (reqs ?? []).filter(r => r.hours_waiting > 24)

  return (
    <div className="bg-[#fdf9f0] border border-[#1A1A1A]/10 flex flex-col">
      {urgent.length > 0 && (
        <div className="px-5 py-2.5 bg-[#ba1a1a] text-[#F5F2EA] flex items-center gap-2">
          <Clock className="size-3 shrink-0" />
          <p className="text-[9px] font-bold uppercase tracking-widest">
            {urgent.length} requisición{urgent.length > 1 ? 'es' : ''} con más de 24 h de espera
          </p>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-3.5 text-[#1A1A1A]/60" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest">Requisiciones pendientes</h3>
            {!isLoading && (reqs?.length ?? 0) > 0 && (
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 bg-[#E5E1D8] px-1.5 py-0.5">
                {reqs!.length}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/requisitions/ink"
            className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
          >
            Ver todas <ArrowRight className="size-2.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 bg-[#E5E1D8] animate-pulse" />)}
          </div>
        ) : (reqs?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="size-2 rounded-full bg-green-500" />
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">Sin requisiciones pendientes</p>
          </div>
        ) : (
          <div className="space-y-1 max-h-80 overflow-y-auto no-scrollbar">
            {reqs!.map(req => (
              <div key={req.id} className={cn(
                'flex items-center gap-3 px-3 py-2.5 border-l-2 bg-[#E5E1D8]/30',
                req.hours_waiting > 24 ? 'border-[#ba1a1a]' : 'border-[#1A1A1A]/20'
              )}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-bold">#{req.requisition_number}</span>
                    <span className={cn('text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5', STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-600')}>
                      {STATUS_LABEL[req.status] ?? req.status}
                    </span>
                    <span className="text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                      {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
                    </span>
                  </div>
                  <p className="text-[9px] text-[#1A1A1A]/50 mt-0.5 truncate">
                    OT: {req.production_order} · {req.requested_by_name}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={cn('font-mono text-[10px] font-bold', req.hours_waiting > 24 ? 'text-[#ba1a1a]' : 'text-[#1A1A1A]/50')}>
                    {req.hours_waiting}h
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
