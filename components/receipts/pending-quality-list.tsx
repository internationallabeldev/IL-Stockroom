'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { getPendingQualityReceipts, type InkReceiptWithContext, type PaperReceiptWithContext } from '@/actions/receipts.actions'
import { QualityBadge } from './quality-badge'
import { QualityUpdateForm } from './quality-update-form'

type PendingItem =
  | { kind: 'ink'; data: InkReceiptWithContext }
  | { kind: 'paper'; data: PaperReceiptWithContext }

type QualityDialog = {
  open: boolean
  receiptId: number
  materialType: 'INK' | 'PAPER'
  batchRef: string
}

function daysSince(dateStr: string) {
  const d   = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - d.getTime()) / 86_400_000)
}

function fmtDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

type Props = {
  initialInk:      InkReceiptWithContext[]
  initialPaper:    PaperReceiptWithContext[]
  defaultMaterial?: 'INK' | 'PAPER'
}

export function PendingQualityList({ initialInk, initialPaper, defaultMaterial }: Props) {
  const [dialog, setDialog] = useState<QualityDialog>({ open: false, receiptId: 0, materialType: 'INK', batchRef: '' })

  const { data } = useQuery({
    queryKey: ['pending-quality'],
    queryFn:  () => getPendingQualityReceipts(),
    initialData: { inkReceipts: initialInk, paperReceipts: initialPaper },
    refetchInterval: 30_000,
  })

  const rows: PendingItem[] = [
    ...data.inkReceipts.map(d => ({ kind: 'ink' as const, data: d })),
    ...data.paperReceipts.map(d => ({ kind: 'paper' as const, data: d })),
  ]
    .filter(row => !defaultMaterial || (defaultMaterial === 'INK' ? row.kind === 'ink' : row.kind === 'paper'))
    .sort((a, b) => a.data.receipt_date.localeCompare(b.data.receipt_date))

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          No hay recepciones pendientes de evaluación de calidad
        </p>
      </div>
    )
  }

  function openDialog(receiptId: number, materialType: 'INK' | 'PAPER', batchRef: string) {
    setDialog({ open: true, receiptId, materialType, batchRef })
  }

  return (
    <>
      <div className="border border-[#1A1A1A]/15 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#E5E1D8]/60 border-b border-[#1A1A1A]/10">
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote interno</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Material</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Orden</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Fecha</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Días</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Cantidad</th>
              <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A]/8">
            {rows.map(row => {
              const d     = row.data
              const days  = daysSince(d.receipt_date)
              const alert = days > 3
              const catalog =
                row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
                  : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
              const order =
                row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
                  : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order
              const qty =
                row.kind === 'ink'
                  ? `${(d as InkReceiptWithContext).kg_received} kg × ${d.units_received} uds`
                  : `${(d as PaperReceiptWithContext).units_received} rollos — ${((d as PaperReceiptWithContext).total_m2_received ?? 0).toFixed(1)} m²`

              return (
                <tr key={`${row.kind}-${d.id}`} className="hover:bg-[#E5E1D8]/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px]">{d.internal_batch}</td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-mono text-[10px] text-[#5f5e59]">{catalog?.code}</p>
                      <p className="font-medium text-[#1A1A1A]">{catalog?.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px]">
                      OC-{String(order?.order_number ?? '').padStart(4, '0')}
                    </p>
                    <p className="text-[10px] text-[#5f5e59]">{order?.providers?.name}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-[11px]">{fmtDate(d.receipt_date)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 font-mono text-[11px] ${alert ? 'text-red-600 font-bold' : 'text-[#5f5e59]'}`}>
                      {alert && <AlertTriangle className="size-3" />}
                      {days}d
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[#5f5e59]">{qty}</td>
                  <td className="px-4 py-3">
                    <QualityBadge value={d.quality_certificate as any} size="xs" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => openDialog(d.id, row.kind === 'ink' ? 'INK' : 'PAPER', d.internal_batch)}
                      className="px-3 py-1.5 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                    >
                      Evaluar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <QualityUpdateForm
        open={dialog.open}
        onClose={() => setDialog(d => ({ ...d, open: false }))}
        receiptId={dialog.receiptId}
        materialType={dialog.materialType}
        currentQuality="PENDING"
        batchRef={dialog.batchRef}
      />
    </>
  )
}
