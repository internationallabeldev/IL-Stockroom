'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Ban, ArrowLeft, FileText } from 'lucide-react'
import dynamic from 'next/dynamic'
import { cancelPurchaseOrder, type PurchaseOrderDetail } from '@/actions/purchase-orders.actions'
import { OrderStatusBadge } from './order-status-badge'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const OrderPdfButton = dynamic(
  () => import('./order-pdf-button').then(m => ({ default: m.OrderPdfButton })),
  { ssr: false, loading: () => null },
)

type Props = {
  order: PurchaseOrderDetail
  canEdit: boolean
}

export function OrderDetail({ order, canEdit }: Props) {
  const router = useRouter()
  const [cancelling, setCancelling] = useState(false)

  const isPending   = order.status === 'PENDING'
  const isLocked    = order.status === 'COMPLETED' || order.status === 'CANCELLED'
  const materialIsInk = order.material_type === 'INK'

  async function handleCancel() {
    if (!confirm(`¿Cancelar la orden #${order.order_number}? Esta acción no se puede deshacer.`)) return
    setCancelling(true)
    const res = await cancelPurchaseOrder(order.id)
    if (res.error) { toast.error(res.error); setCancelling(false); return }
    toast.success('Orden cancelada')
    router.refresh()
  }

  // Progress helpers
  const inkProgress = order.ink_items.map(item => ({
    ...item,
    pct: item.total_kg_ordered
      ? Math.min(100, ((item.total_kg_received ?? 0) / item.total_kg_ordered) * 100)
      : 0,
  }))
  const paperProgress = order.paper_items.map(item => ({
    ...item,
    pct: item.total_m2_ordered
      ? Math.min(100, ((item.total_m2_received ?? 0) / item.total_m2_ordered) * 100)
      : 0,
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Back + actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver
        </button>

        <div className="flex gap-2 items-center">
          <OrderPdfButton order={order} />
          {canEdit && isPending && !isLocked && (
            <>
              <button
                onClick={() => router.push(`/dashboard/orders/${order.id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
              >
                <Pencil className="size-3" />
                Editar
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Ban className="size-3" />
                {cancelling ? 'Cancelando…' : 'Cancelar orden'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Header card */}
      <div className="bg-[#fdf9f0] border border-[#1A1A1A]/15">
        <div className="px-6 py-4 border-b border-[#1A1A1A]/10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
              {order.material_type === 'INK' ? 'Orden de tintas' : 'Orden de papel'}
            </p>
            <h1 className="font-heading text-3xl font-bold tracking-tight mt-0.5">
              #{order.order_number}
            </h1>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3">
          <DetailField label="Proveedor"        value={order.providers?.name ?? '—'} />
          <DetailField label="Solicitado"        value={fmt(order.request_date)} />
          {order.expected_delivery_date && (
            <DetailField label="Entrega esperada" value={fmt(order.expected_delivery_date)} />
          )}
          {order.actual_delivery_date && (
            <DetailField label="Entrega real"     value={fmt(order.actual_delivery_date)} />
          )}
          <DetailField label="Pago"             value={order.payment_method} />
          <DetailField label="Envío"            value={order.shipment_method} />
          <DetailField label="Lugar de entrega" value={order.delivery_place} />
        </div>

        {order.notes && (
          <div className="px-6 py-3 border-t border-[#1A1A1A]/10 bg-[#E5E1D8]/20">
            <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/70 mb-1">Notas</p>
            <p className="text-sm text-[#5f5e59]">{order.notes}</p>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-[#fdf9f0] border border-[#1A1A1A]/15">
        <div className="px-6 py-3 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
            Artículos — {materialIsInk ? 'Tintas' : 'Papel'}
          </p>
        </div>

        {materialIsInk && (
          <div className="divide-y divide-[#1A1A1A]/08">
            {inkProgress.length === 0
              ? <p className="px-6 py-8 text-[10px] text-[#5f5e59] text-center">Sin artículos</p>
              : inkProgress.map(item => (
                <div key={item.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      {item.ink_catalog?.color_code?.startsWith('#') && (
                        <span
                          className="inline-block size-3 rounded-sm mr-1.5 border border-[#1A1A1A]/10 align-middle"
                          style={{ background: item.ink_catalog.color_code }}
                        />
                      )}
                      <span className="font-mono text-[10px] text-[#5f5e59]">{item.ink_catalog?.code}</span>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm">{item.ink_catalog?.name ?? '—'}</p>
                        {item.item_notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <FileText className="size-3 text-[#5f5e59] shrink-0 cursor-default" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-56 text-left">
                                {item.item_notes}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                        {item.units_received ?? 0} / {item.units_ordered} uds
                      </p>
                      <p className="font-mono text-xs text-[#5f5e59]">
                        {(item.total_kg_received ?? 0).toFixed(2)} / {(item.total_kg_ordered ?? 0).toFixed(2)} kg
                      </p>
                    </div>
                  </div>
                  <ProgressBar pct={item.pct} complete={item.is_complete ?? false} />
                </div>
              ))
            }
          </div>
        )}

        {!materialIsInk && (
          <div className="divide-y divide-[#1A1A1A]/08">
            {paperProgress.length === 0
              ? <p className="px-6 py-8 text-[10px] text-[#5f5e59] text-center">Sin artículos</p>
              : paperProgress.map(item => (
                <div key={item.id} className="px-6 py-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-[#5f5e59]">{item.paper_catalog?.code}</span>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm">{item.paper_catalog?.name ?? '—'}</p>
                        {item.item_notes && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <FileText className="size-3 text-[#5f5e59] shrink-0 cursor-default" />
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-56 text-left">
                                {item.item_notes}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {item.paper_catalog?.material && (
                        <p className="text-[10px] text-[#5f5e59]">{item.paper_catalog.material}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                        {item.units_received ?? 0} / {item.units_ordered} bobs
                      </p>
                      <p className="font-mono text-xs text-[#5f5e59]">
                        {(item.total_m2_received ?? 0).toFixed(2)} / {(item.total_m2_ordered ?? 0).toFixed(2)} m²
                      </p>
                    </div>
                  </div>
                  <ProgressBar pct={item.pct} complete={item.is_complete ?? false} />
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressBar({ pct, complete }: { pct: number; complete: boolean }) {
  return (
    <div className="h-1.5 w-full bg-[#E5E1D8] overflow-hidden">
      <div
        className={cn('h-full transition-all duration-300', complete ? 'bg-green-500' : 'bg-[#1A1A1A]')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/70 mb-0.5">{label}</p>
      <p className="text-sm text-[#1A1A1A]">{value}</p>
    </div>
  )
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}
