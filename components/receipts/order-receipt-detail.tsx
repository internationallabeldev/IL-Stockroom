'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, Plus, CheckCircle2, ListPlus } from 'lucide-react'
import Link from 'next/link'
import { getOrderWithReceipts, type OrderWithReceipts, type InkReceiptRow, type PaperReceiptRow } from '@/actions/receipts.actions'
import { Pencil } from 'lucide-react'
import { QualityBadge } from './quality-badge'
import { QualityUpdateForm } from './quality-update-form'
import { EditReceiptForm } from './edit-receipt-form'
import { ReceiptForm, type ReceiptItemContext } from './receipt-form'
import { BatchReceiptForm } from './batch-receipt-form'
import type { UpdateReceiptAdminValues } from '@/lib/validations/receipt.schema'

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

type Props = {
  initialOrder: OrderWithReceipts
  canReceive: boolean
  canEdit: boolean
}

type QualityDialog = {
  open: boolean
  receiptId: number
  materialType: 'INK' | 'PAPER'
  batchRef: string
  currentQuality: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
}

type EditDialog = {
  open:          boolean
  receiptId:     number
  materialType:  'INK' | 'PAPER'
  batchRef:      string
  initialValues: UpdateReceiptAdminValues
}

export function OrderReceiptDetail({ initialOrder, canReceive, canEdit }: Props) {
  const [receiptForm, setReceiptForm]   = useState<{ open: boolean; item: ReceiptItemContext | null }>({ open: false, item: null })
  const [batchFormOpen, setBatchFormOpen] = useState(false)
  const [qualityDialog, setQualityDialog] = useState<QualityDialog>({
    open: false, receiptId: 0, materialType: 'INK', batchRef: '', currentQuality: 'PENDING',
  })
  const [editDialog, setEditDialog] = useState<EditDialog>({
    open: false, receiptId: 0, materialType: 'INK', batchRef: '',
    initialValues: { receipt_date: '', invoice_remission: '', provider_batch: '', quality_certificate: 'PENDING' },
  })

  const { data: order, refetch } = useQuery({
    queryKey: ['order-with-receipts', initialOrder.id],
    queryFn:  () => getOrderWithReceipts(initialOrder.id),
    initialData: initialOrder,
    refetchInterval: 30_000,
  })

  if (!order) return null

  const isInk          = order.material_type === 'INK'
  const items          = isInk ? order.ink_items : order.paper_items
  const incompleteItems = items.filter(i => !i.is_complete)

  function openReceiptForm(item: typeof items[0]) {
    if (isInk) {
      const i = item as OrderWithReceipts['ink_items'][0]
      setReceiptForm({
        open: true,
        item: {
          id:            i.id,
          materialType:  'INK',
          catalogCode:   i.ink_catalog?.code ?? '',
          catalogName:   i.ink_catalog?.name ?? '',
          unitsOrdered:  i.units_ordered,
          unitsReceived: i.units_received ?? 0,
          kgPerUnit:     i.kg_per_unit,
        },
      })
    } else {
      const i = item as OrderWithReceipts['paper_items'][0]
      setReceiptForm({
        open: true,
        item: {
          id:              i.id,
          materialType:    'PAPER',
          catalogCode:     i.paper_catalog?.code ?? '',
          catalogName:     i.paper_catalog?.name ?? '',
          unitsOrdered:    i.units_ordered,
          unitsReceived:   i.units_received ?? 0,
          lengthMPerUnit:  i.length_m_per_unit,
          widthM:          i.width_m,
        },
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-start gap-4">
        <Link
          href={`/dashboard/receipts/${order.material_type === 'INK' ? 'ink' : 'paper'}`}
          className="shrink-0 size-8 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] transition-colors mt-0.5"
        >
          <ChevronLeft className="size-4" />
        </Link>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            OC-{String(order.order_number).padStart(4, '0')}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
            {order.providers?.name ?? '—'} · {order.material_type === 'INK' ? 'Tintas' : 'Papel'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          {canReceive && order.status !== 'CANCELLED' && incompleteItems.length >= 2 && (
            <button
              onClick={() => setBatchFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/25 text-[9px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
            >
              <ListPlus className="size-3.5" />
              Registrar todos ({incompleteItems.length})
            </button>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        {items.map(item => {
          const catalog = isInk
            ? (item as OrderWithReceipts['ink_items'][0]).ink_catalog
            : (item as OrderWithReceipts['paper_items'][0]).paper_catalog
          const receipts = isInk
            ? (item as OrderWithReceipts['ink_items'][0]).ink_receipts
            : (item as OrderWithReceipts['paper_items'][0]).paper_receipts
          const unitsReceived = item.units_received ?? 0
          const pct           = Math.min(100, (unitsReceived / item.units_ordered) * 100)
          const isComplete    = item.is_complete ?? unitsReceived >= item.units_ordered

          return (
            <div key={item.id} className="border border-[#1A1A1A]/15 overflow-hidden">
              {/* Item header */}
              <div className="flex items-center justify-between px-5 py-4 bg-[#E5E1D8]/30 border-b border-[#1A1A1A]/10">
                <div>
                  <p className="font-mono text-[10px] text-[#5f5e59]">{catalog?.code}</p>
                  <p className="font-bold text-sm text-[#1A1A1A] mt-0.5">{catalog?.name}</p>
                  {item.item_notes && (
                    <p className="text-[11px] text-[#5f5e59] mt-1 italic">{item.item_notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-600">
                      <CheckCircle2 className="size-3.5" />
                      Completo
                    </span>
                  ) : (
                    canReceive && order.status !== 'CANCELLED' && (
                      <button
                        onClick={() => openReceiptForm(item)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                      >
                        <Plus className="size-3" />
                        Registrar
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="px-5 py-3 border-b border-[#1A1A1A]/10">
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-[#5f5e59]">{unitsReceived} / {item.units_ordered} unidades</span>
                  <span className="text-[#1A1A1A]">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[#E5E1D8] overflow-hidden">
                  <div
                    className={`h-full transition-all ${isComplete ? 'bg-green-500' : 'bg-[#1A1A1A]'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {isInk && (
                  <p className="text-[10px] text-[#5f5e59] mt-1">
                    {(item as OrderWithReceipts['ink_items'][0]).total_kg_received ?? 0} / {(item as OrderWithReceipts['ink_items'][0]).total_kg_ordered ?? '—'} kg
                  </p>
                )}
                {!isInk && (
                  <p className="text-[10px] text-[#5f5e59] mt-1">
                    {((item as OrderWithReceipts['paper_items'][0]).total_m2_received ?? 0).toFixed(1)} / {((item as OrderWithReceipts['paper_items'][0]).total_m2_ordered ?? 0).toFixed(1)} m²
                  </p>
                )}
              </div>

              {/* Receipts list */}
              {receipts.length > 0 ? (
                <div className="divide-y divide-[#1A1A1A]/8">
                  {receipts.map(r => (
                    <ReceiptRow
                      key={r.id}
                      receipt={r}
                      materialType={order.material_type}
                      canEdit={canEdit}
                      onEvalQuality={({ receiptId, batchRef, currentQuality }) =>
                        setQualityDialog({ open: true, receiptId, materialType: order.material_type, batchRef, currentQuality })
                      }
                      onEdit={rec => setEditDialog({
                        open: true,
                        receiptId: rec.id,
                        materialType: order.material_type,
                        batchRef: (rec as any).internal_batch,
                        initialValues: {
                          receipt_date:        (rec as any).receipt_date?.split('T')[0] ?? '',
                          invoice_remission:   (rec as any).invoice_remission ?? '',
                          provider_batch:      (rec as any).provider_batch ?? '',
                          quality_certificate: (rec as any).quality_certificate ?? 'PENDING',
                          quality_notes:       (rec as any).quality_notes ?? '',
                          certificate_url:     (rec as any).certificate_url ?? '',
                        },
                      })}
                    />
                  ))}
                </div>
              ) : (
                <p className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]/60">
                  Sin recepciones registradas
                </p>
              )}
            </div>
          )
        })}
      </div>

      <ReceiptForm
        open={receiptForm.open}
        onClose={() => { setReceiptForm({ open: false, item: null }); refetch() }}
        item={receiptForm.item}
      />

      <BatchReceiptForm
        open={batchFormOpen}
        onClose={() => { setBatchFormOpen(false); refetch() }}
        order={order}
      />

      <QualityUpdateForm
        open={qualityDialog.open}
        onClose={() => setQualityDialog(d => ({ ...d, open: false }))}
        receiptId={qualityDialog.receiptId}
        materialType={qualityDialog.materialType}
        currentQuality={qualityDialog.currentQuality}
        batchRef={qualityDialog.batchRef}
      />

      <EditReceiptForm
        open={editDialog.open}
        onClose={() => { setEditDialog(d => ({ ...d, open: false })); refetch() }}
        receiptId={editDialog.receiptId}
        materialType={editDialog.materialType}
        batchRef={editDialog.batchRef}
        initialValues={editDialog.initialValues}
      />
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ReceiptRow({
  receipt,
  materialType,
  canEdit,
  onEvalQuality,
  onEdit,
}: {
  receipt:       InkReceiptRow | PaperReceiptRow
  materialType:  'INK' | 'PAPER'
  canEdit:       boolean
  onEvalQuality: (p: { receiptId: number; batchRef: string; currentQuality: any }) => void
  onEdit:        (receipt: InkReceiptRow | PaperReceiptRow) => void
}) {
  const r = receipt as any
  const qty = materialType === 'INK'
    ? `${r.kg_received} kg · ${r.units_received} uds`
    : `${r.units_received} rollos · ${(r.total_m2_received ?? 0).toFixed(1)} m² (${r.length_m}m × ${r.width_m}m)`

  return (
    <div className="flex items-center gap-4 px-5 py-3 hover:bg-[#E5E1D8]/20 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <p className="font-mono text-[11px] font-bold">{r.internal_batch}</p>
          <p className="text-[10px] text-[#5f5e59]">{fmtDate(r.receipt_date)}</p>
          <p className="text-[10px] text-[#5f5e59]">{qty}</p>
        </div>
        <p className="text-[10px] text-[#5f5e59] mt-0.5">
          Remisión: {r.invoice_remission} · Lote prov.: {r.provider_batch}
        </p>
        {r.quality_notes && (
          <p className="text-[10px] text-[#5f5e59] italic mt-0.5">{r.quality_notes}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <QualityBadge value={r.quality_certificate} size="xs" />
        {canEdit && r.quality_certificate === 'PENDING' && (
          <button
            onClick={() => onEvalQuality({ receiptId: r.id, batchRef: r.internal_batch, currentQuality: r.quality_certificate })}
            className="px-2 py-1 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            Evaluar
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => onEdit(receipt)}
            className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] transition-colors"
            title="Editar datos administrativos"
          >
            <Pencil className="size-3" />

          </button>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    PENDING:   'bg-yellow-50 text-yellow-700 border-yellow-200',
    PARTIAL:   'bg-blue-50   text-blue-700   border-blue-200',
    COMPLETED: 'bg-green-50  text-green-700  border-green-200',
    CANCELLED: 'bg-red-50    text-red-700    border-red-200',
  }
  const labels: Record<string, string> = {
    PENDING: 'Pendiente', PARTIAL: 'Parcial', COMPLETED: 'Completada', CANCELLED: 'Cancelada',
  }
  const cls = map[status ?? ''] ?? 'bg-gray-50 text-gray-500 border-gray-200'
  return (
    <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest border ${cls}`}>
      {labels[status ?? ''] ?? status}
    </span>
  )
}
