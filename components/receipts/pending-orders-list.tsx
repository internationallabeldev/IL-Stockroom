'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Droplet, FileText, ChevronRight, AlertTriangle } from 'lucide-react'
import { getReceivableOrders, type ReceivableOrder } from '@/actions/receipts.actions'
import { cn } from '@/lib/utils'

type Tab = 'INK' | 'PAPER'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function isOverdue(dateStr: string | null | undefined) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

function ItemProgress({ order, type }: { order: ReceivableOrder; type: Tab }) {
  const items = type === 'INK' ? order.ink_items : order.paper_items
  const total    = items.length
  const complete = items.filter(i => i.is_complete).length
  const pct      = total === 0 ? 0 : Math.round((complete / total) * 100)

  return (
    <div className="min-w-[100px]">
      <div className="flex items-center justify-between text-[10px] font-mono mb-1">
        <span className="text-[#5f5e59]">{complete}/{total} art.</span>
        <span className="text-[#1A1A1A]">{pct}%</span>
      </div>
      <div className="h-1 bg-[#E5E1D8] overflow-hidden">
        <div
          className={cn('h-full transition-all', complete === total && total > 0 ? 'bg-green-500' : 'bg-[#1A1A1A]')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const cls = status === 'PARTIAL'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : 'bg-yellow-50 text-yellow-700 border-yellow-200'
  const label = status === 'PARTIAL' ? 'Parcial' : 'Pendiente'
  return (
    <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${cls}`}>
      {label}
    </span>
  )
}

function OrdersTable({ orders, type }: { orders: ReceivableOrder[]; type: Tab }) {
  if (orders.length === 0) {
    return (
      <div className="border border-dashed border-[#1A1A1A]/20 p-12 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          No hay órdenes pendientes de recepción
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[#1A1A1A]/15 overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#E5E1D8]/60 border-b border-[#1A1A1A]/10">
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Orden</th>
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Proveedor</th>
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Estado</th>
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Progreso</th>
            <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Entrega est.</th>
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1A1A]/8">
          {orders.map(order => {
            const overdue = isOverdue(order.expected_delivery_date)
            return (
              <tr key={order.id} className="hover:bg-[#E5E1D8]/30 transition-colors">
                <td className="px-4 py-3 font-mono text-[11px] font-bold">
                  OC-{String(order.order_number).padStart(4, '0')}
                </td>
                <td className="px-4 py-3 text-[11px] text-[#1A1A1A]">
                  {order.providers?.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-4 py-3">
                  <ItemProgress order={order} type={type} />
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'inline-flex items-center gap-1 text-[11px] font-mono',
                    overdue ? 'text-red-600 font-bold' : 'text-[#5f5e59]'
                  )}>
                    {overdue && <AlertTriangle className="size-3 shrink-0" />}
                    {fmtDate(order.expected_delivery_date)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/dashboard/receipts/${order.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                  >
                    Recibir
                    <ChevronRight className="size-3" />
                  </Link>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  initialInk:      ReceivableOrder[]
  initialPaper:    ReceivableOrder[]
  defaultMaterial?: 'INK' | 'PAPER'
}

export function PendingOrdersList({ initialInk, initialPaper, defaultMaterial }: Props) {
  const [tab, setTab] = useState<Tab>(defaultMaterial ?? 'INK')

  const { data } = useQuery({
    queryKey:        ['receivable-orders'],
    queryFn:         () => getReceivableOrders(),
    initialData:     { inkOrders: initialInk, paperOrders: initialPaper },
    refetchInterval: 30_000,
  })

  const inkOrders   = data.inkOrders
  const paperOrders = data.paperOrders

  const activeOrders = defaultMaterial
    ? (defaultMaterial === 'INK' ? inkOrders : paperOrders)
    : (tab === 'INK' ? inkOrders : paperOrders)
  const activeType = defaultMaterial ?? tab

  return (
    <div>
      {!defaultMaterial && (
        <div className="flex border-b border-[#1A1A1A]/15 mb-5">
          <button
            onClick={() => setTab('INK')}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
              tab === 'INK'
                ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A] -mb-px'
                : 'text-[#5f5e59] hover:text-[#1A1A1A]'
            )}
          >
            <Droplet className="size-3" />
            Tintas
            <span className="font-mono text-[9px] text-[#5f5e59]">({inkOrders.length})</span>
          </button>
          <button
            onClick={() => setTab('PAPER')}
            className={cn(
              'flex items-center gap-2 px-5 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors',
              tab === 'PAPER'
                ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A] -mb-px'
                : 'text-[#5f5e59] hover:text-[#1A1A1A]'
            )}
          >
            <FileText className="size-3" />
            Papel
            <span className="font-mono text-[9px] text-[#5f5e59]">({paperOrders.length})</span>
          </button>
        </div>
      )}

      <OrdersTable orders={activeOrders} type={activeType} />
    </div>
  )
}
