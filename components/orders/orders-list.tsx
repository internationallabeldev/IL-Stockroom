'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  getPurchaseOrders,
  type PurchaseOrderSummary,
  type MaterialType,
  type OrderStatus,
} from '@/actions/purchase-orders.actions'
import { OrderStatusBadge } from './order-status-badge'
import { InkOrderForm } from './ink-order-form'
import { PaperOrderForm } from './paper-order-form'
import type { Provider } from '@/actions/providers.actions'
import type { InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { cn } from '@/lib/utils'

const STATUS_TABS: { value: OrderStatus | ''; label: string }[] = [
  { value: '',          label: 'Todas' },
  { value: 'PENDING',   label: 'Pendiente' },
  { value: 'PARTIAL',   label: 'Parcial' },
  { value: 'COMPLETED', label: 'Completada' },
  { value: 'CANCELLED', label: 'Cancelada' },
]

const PAGE_SIZE = 15

type Props = {
  initialOrders: PurchaseOrderSummary[]
  materialType: MaterialType
  providers: Provider[]
  inkCatalog: InkCatalogItem[]
  paperCatalog: PaperCatalogItem[]
  canCreate: boolean
}

export function OrdersList({
  initialOrders, materialType, providers, inkCatalog, paperCatalog, canCreate,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)

  const { data: orders = initialOrders } = useQuery({
    queryKey: ['purchase-orders', materialType, statusFilter],
    queryFn: () => getPurchaseOrders({
      material_type: materialType,
      ...(statusFilter ? { status: statusFilter } : {}),
    }),
    initialData: initialOrders,
    refetchInterval: 30_000,
  })

  const totalPages = Math.max(1, Math.ceil(orders.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = orders.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Status tabs */}
        <div className="flex border border-[#1A1A1A]/20">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => { setStatusFilter(t.value); setPage(1) }}
              className={cn(
                'px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                statusFilter === t.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {canCreate && (
          <button
            onClick={() => setFormOpen(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            <Plus className="size-3.5" />
            Nueva orden
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-4">
        {orders.length} orden{orders.length !== 1 ? 'es' : ''}
      </p>

      {/* Table */}
      {paginated.length === 0 ? (
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            No hay órdenes para mostrar
          </p>
        </div>
      ) : (
        <>
          <div className="border border-[#1A1A1A]/15 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                  {['#Orden', 'Proveedor', 'Artículos', 'Cantidad', 'Solicitud', 'Entrega esp.', 'Estado', ''].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A1A1A]/08">
                {paginated.map(order => {
                  const items   = materialType === 'INK' ? order.ink_items : order.paper_items
                  const total   = materialType === 'INK'
                    ? order.ink_items.reduce((s, i) => s + (i.total_kg_ordered  ?? 0), 0)
                    : order.paper_items.reduce((s, i) => s + (i.total_m2_ordered ?? 0), 0)
                  const unit    = materialType === 'INK' ? 'kg' : 'm²'
                  const complete = items.filter(i => i.is_complete).length

                  return (
                    <tr key={order.id} className="hover:bg-[#E5E1D8]/20 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sm">
                        #{order.order_number}
                      </td>
                      <td className="px-4 py-3 text-sm max-w-[160px] truncate">
                        {order.providers?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {complete}/{items.length} completos
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">
                        {total.toFixed(1)} {unit}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {fmtDate(order.request_date)}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-[#5f5e59]">
                        {order.expected_delivery_date ? fmtDate(order.expected_delivery_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <OrderStatusBadge status={order.status} size="xs" />
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
                        >
                          <Eye className="size-3.5" />
                          Ver
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end gap-1 mt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="size-3.5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                .reduce<(number | '…')[]>((acc, n, i, arr) => {
                  if (i > 0 && n - (arr[i - 1] as number) > 1) acc.push('…')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '…'
                    ? <span key={`e${i}`} className="w-7 text-center text-[10px] text-[#5f5e59]">…</span>
                    : <button
                        key={n}
                        onClick={() => setPage(n as number)}
                        className={cn('size-7 text-[10px] font-bold border transition-colors', safePage === n
                          ? 'bg-[#1A1A1A] text-[#F5F2EA] border-[#1A1A1A]'
                          : 'border-[#1A1A1A]/20 hover:bg-[#E5E1D8]'
                        )}
                      >{n}</button>
                )}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          )}
        </>
      )}

      {materialType === 'INK' ? (
        <InkOrderForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          providers={providers}
          inkCatalog={inkCatalog}
        />
      ) : (
        <PaperOrderForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          providers={providers}
          paperCatalog={paperCatalog}
        />
      )}
    </>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
