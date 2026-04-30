'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getAllReceipts, type InkReceiptWithContext, type PaperReceiptWithContext } from '@/actions/receipts.actions'
import { QualityBadge } from './quality-badge'
import { QualityUpdateForm } from './quality-update-form'

type AnyReceipt =
  | { kind: 'ink';   data: InkReceiptWithContext }
  | { kind: 'paper'; data: PaperReceiptWithContext }

const QUALITY_FILTERS = [
  { value: '',            label: 'Todos' },
  { value: 'PENDING',     label: 'Pendiente' },
  { value: 'APPROVED',    label: 'Aprobado' },
  { value: 'REJECTED',    label: 'Rechazado' },
  { value: 'CONDITIONAL', label: 'Condicional' },
]

const TYPE_FILTERS = [
  { value: '',      label: 'Todos' },
  { value: 'INK',   label: 'Tinta' },
  { value: 'PAPER', label: 'Papel' },
]

const DEFAULT_PAGE_SIZE = 15

function fmtDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

type Props = {
  initialInk:      InkReceiptWithContext[]
  initialPaper:    PaperReceiptWithContext[]
  canEdit:         boolean
  defaultMaterial?: 'INK' | 'PAPER'
}

export function ReceiptsHistory({ initialInk, initialPaper, canEdit, defaultMaterial }: Props) {
  const [search,       setSearch]       = useState('')
  const [qualityFilter, setQualityFilter] = useState('')
  const [typeFilter,   setTypeFilter]   = useState(defaultMaterial ?? '')
  const [page,         setPage]         = useState(1)
  const [dialog, setDialog] = useState({ open: false, receiptId: 0, materialType: 'INK' as 'INK' | 'PAPER', batchRef: '', currentQuality: 'PENDING' as any })

  const { data } = useQuery({
    queryKey:        ['receipts-history'],
    queryFn:         () => getAllReceipts(),
    initialData:     { inkReceipts: initialInk, paperReceipts: initialPaper },
    refetchInterval: 30_000,
  })

  const allRows: AnyReceipt[] = [
    ...data.inkReceipts.map(d  => ({ kind: 'ink'   as const, data: d })),
    ...data.paperReceipts.map(d => ({ kind: 'paper' as const, data: d })),
  ].sort((a, b) => b.data.receipt_date.localeCompare(a.data.receipt_date))

  const filtered = allRows.filter(row => {
    const d = row.data
    const catalog = row.kind === 'ink'
      ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
      : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
    const order = row.kind === 'ink'
      ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
      : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order

    const q = search.toLowerCase()
    const matchSearch = !q ||
      d.internal_batch.toLowerCase().includes(q) ||
      d.invoice_remission.toLowerCase().includes(q) ||
      d.provider_batch.toLowerCase().includes(q) ||
      (catalog?.name ?? '').toLowerCase().includes(q) ||
      (catalog?.code ?? '').toLowerCase().includes(q) ||
      (order?.providers?.name ?? '').toLowerCase().includes(q)

    const matchQuality = !qualityFilter || d.quality_certificate === qualityFilter
    const matchType    = !typeFilter || (typeFilter === 'INK' ? row.kind === 'ink' : row.kind === 'paper')

    return matchSearch && matchQuality && matchType
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / DEFAULT_PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * DEFAULT_PAGE_SIZE, safePage * DEFAULT_PAGE_SIZE)

  useEffect(() => { setPage(1) }, [search, qualityFilter, typeFilter])

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lote, factura, material..."
            className="h-9 w-72 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-3 text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
        </div>

        {!defaultMaterial && (
          <div className="flex border border-[#1A1A1A]/20">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  typeFilter === f.value ? 'bg-[#1A1A1A] text-[#F5F2EA]' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex border border-[#1A1A1A]/20">
          {QUALITY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setQualityFilter(f.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                qualityFilter === f.value ? 'bg-[#1A1A1A] text-[#F5F2EA]' : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count + pagination */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          {filtered.length} recepci{filtered.length !== 1 ? 'ones' : 'ón'}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] font-mono px-2">{safePage}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="size-7 flex items-center justify-center border border-[#1A1A1A]/20 hover:bg-[#E5E1D8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {paginated.length === 0 ? (
        <div className="border border-dashed border-[#1A1A1A]/20 p-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            Sin recepciones
          </p>
        </div>
      ) : (
        <div className="border border-[#1A1A1A]/15 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#E5E1D8]/60 border-b border-[#1A1A1A]/10">
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote int.</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Tipo</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Material</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Orden</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Fecha</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Cantidad</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Calidad</th>
                {canEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A1A1A]/8">
              {paginated.map(row => {
                const d = row.data
                const catalog = row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
                  : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
                const order = row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
                  : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order
                const qty = row.kind === 'ink'
                  ? `${(d as InkReceiptWithContext).kg_received} kg`
                  : `${((d as PaperReceiptWithContext).total_m2_received ?? 0).toFixed(1)} m²`

                return (
                  <tr key={`${row.kind}-${d.id}`} className="hover:bg-[#E5E1D8]/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px]">{d.internal_batch}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                        row.kind === 'ink' ? 'border-blue-200 text-blue-700 bg-blue-50' : 'border-amber-200 text-amber-700 bg-amber-50'
                      }`}>
                        {row.kind === 'ink' ? 'Tinta' : 'Papel'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-[#5f5e59]">{catalog?.code}</p>
                      <p className="text-[#1A1A1A]">{catalog?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      OC-{String(order?.order_number ?? '').padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{fmtDate(d.receipt_date)}</td>
                    <td className="px-4 py-3 font-mono text-[11px]">{qty}</td>
                    <td className="px-4 py-3">
                      <QualityBadge value={d.quality_certificate as any} size="xs" />
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        {d.quality_certificate === 'PENDING' && (
                          <button
                            onClick={() => setDialog({
                              open: true,
                              receiptId: d.id,
                              materialType: row.kind === 'ink' ? 'INK' : 'PAPER',
                              batchRef: d.internal_batch,
                              currentQuality: d.quality_certificate as any,
                            })}
                            className="px-2 py-1 bg-[#1A1A1A] text-[#F5F2EA] text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                          >
                            Evaluar
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <QualityUpdateForm
        open={dialog.open}
        onClose={() => setDialog(d => ({ ...d, open: false }))}
        receiptId={dialog.receiptId}
        materialType={dialog.materialType}
        currentQuality={dialog.currentQuality}
        batchRef={dialog.batchRef}
      />
    </>
  )
}
