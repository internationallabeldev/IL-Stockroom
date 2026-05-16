'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ShoppingCart, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActiveOrders } from '@/actions/dashboard.actions'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
}

export function ActiveOrdersWidget() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['active-orders-widget'],
    queryFn:  getActiveOrders,
    refetchInterval: 30_000,
  })

  return (
    <div className="bg-[#fdf9f0] border border-[#1A1A1A]/10 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-3.5 text-[#1A1A1A]/60" />
          <h3 className="text-[10px] font-bold uppercase tracking-widest">Órdenes activas</h3>
          {!isLoading && (orders?.length ?? 0) > 0 && (
            <span className="text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 bg-[#E5E1D8] px-1.5 py-0.5">
              {orders!.length}
            </span>
          )}
        </div>
        <Link
          href="/dashboard/orders/ink"
          className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-[#1A1A1A]/40 hover:text-[#1A1A1A] transition-colors"
        >
          Ver todas <ArrowRight className="size-2.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 bg-[#E5E1D8] animate-pulse" />)}
        </div>
      ) : (orders?.length ?? 0) === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#1A1A1A]/40">Sin órdenes activas</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto no-scrollbar">
          {orders!.map(order => (
            <div key={order.id} className={cn(
              'flex items-center gap-3 px-3 py-2.5 bg-[#E5E1D8]/30 border-l-2',
              order.days_overdue ? 'border-[#ba1a1a]' : 'border-[#1A1A1A]/20'
            )}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[11px] font-bold">
                    #{String(order.order_number).padStart(4, '0')}
                  </span>
                  <span className={cn(
                    'text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5',
                    order.status === 'PARTIAL' ? 'bg-blue-500/10 text-blue-700' : 'bg-yellow-500/10 text-yellow-700'
                  )}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="text-[9px] text-[#1A1A1A]/40 uppercase tracking-wider">
                    {order.material_type === 'INK' ? 'Tinta' : 'Papel'}
                  </span>
                </div>
                <p className="text-[9px] text-[#1A1A1A]/50 mt-0.5 truncate">{order.provider_name}</p>
              </div>
              {order.days_overdue !== null ? (
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] font-bold text-[#ba1a1a]">+{order.days_overdue}d</p>
                  <p className="text-[8px] text-[#ba1a1a]/70 uppercase tracking-wider">Atrasada</p>
                </div>
              ) : order.expected_delivery_date ? (
                <div className="text-right shrink-0">
                  <p className="font-mono text-[10px] font-bold text-[#1A1A1A]/50">
                    {new Date(order.expected_delivery_date).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
