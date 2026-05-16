'use client'

import { useQuery } from '@tanstack/react-query'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Droplets, FileText, PackageCheck, ArrowDownToLine,
  ShoppingCart, ClipboardList, Activity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getRecentActivity } from '@/actions/dashboard.actions'
import type { RecentActivityEvent } from '@/types/dashboard.types'

const EVENT_CONFIG = {
  ink_output:    { icon: Droplets,        color: 'text-[#008dc2]', bg: 'bg-[#008dc2]/10' },
  paper_output:  { icon: FileText,        color: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
  ink_receipt:   { icon: ArrowDownToLine, color: 'text-green-600', bg: 'bg-green-600/10' },
  paper_receipt: { icon: PackageCheck,    color: 'text-green-600', bg: 'bg-green-600/10' },
  order:         { icon: ShoppingCart,    color: 'text-[#1A1A1A]', bg: 'bg-[#1A1A1A]/10' },
  requisition:   { icon: ClipboardList,   color: 'text-yellow-600', bg: 'bg-yellow-600/10' },
}

function EventRow({ event }: { event: RecentActivityEvent }) {
  const cfg  = EVENT_CONFIG[event.type]
  const Icon = cfg.icon

  let relativeTime = '—'
  try {
    relativeTime = formatDistanceToNow(parseISO(event.date), { addSuffix: true, locale: es })
  } catch {}

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#1A1A1A]/8 last:border-0">
      <div className={cn('size-7 shrink-0 flex items-center justify-center mt-0.5', cfg.bg)}>
        <Icon className={cn('size-3.5', cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold truncate">{event.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {event.user_name && (
            <span className="text-[9px] text-[#1A1A1A]/40 truncate">{event.user_name}</span>
          )}
          <span className="text-[9px] text-[#1A1A1A]/30 ml-auto shrink-0">{relativeTime}</span>
        </div>
      </div>
    </div>
  )
}

export function RecentActivityWidget() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn:  getRecentActivity,
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-[#fdf9f0] border border-[#1A1A1A]/10 p-5 flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="size-3.5 text-[#1A1A1A]/60" />
        <h3 className="text-[10px] font-bold uppercase tracking-widest">Actividad reciente</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="size-7 bg-[#E5E1D8] animate-pulse shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[#E5E1D8] animate-pulse w-3/4" />
                <div className="h-2.5 bg-[#E5E1D8] animate-pulse w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (events?.length ?? 0) === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <Activity className="size-6 text-[#1A1A1A]/15" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/30">Sin actividad reciente</p>
        </div>
      ) : (
        <div>
          {events!.map(event => <EventRow key={event.id} event={event} />)}
        </div>
      )}
    </div>
  )
}
