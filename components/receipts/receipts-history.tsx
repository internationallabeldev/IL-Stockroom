'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, FileCheck } from 'lucide-react'
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
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar lote, factura, material..."
            className="h-9 w-72 border border-foreground/20 bg-card pl-8 pr-3 text-xs outline-none focus:border-foreground/50 transition-colors"
          />
        </div>

        {!defaultMaterial && (
          <div className="flex border border-border">
            {TYPE_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  typeFilter === f.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex border border-border">
          {QUALITY_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setQualityFilter(f.value)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                qualityFilter === f.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count + pagination */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {filtered.length} recepci{filtered.length !== 1 ? 'ones' : 'ón'}
        </p>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="text-[10px] font-mono px-2">{safePage}/{totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {paginated.length === 0 ? (
        <div className="border border-dashed border-border p-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Sin recepciones
          </p>
        </div>
      ) : (
        <div className="border border-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/60 border-b border-border/50">
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lote int.</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Material</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Orden</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fecha</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Cantidad</th>
                <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Calidad</th>
                {canEdit && <th className="px-4 py-2.5" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map(row => {
                const d = row.data
                const catalog = row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
                  : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
                const order = row.kind === 'ink'
                  ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
                  : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order
                return (
                  <tr key={`${row.kind}-${d.id}`} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px]">{d.internal_batch}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border ${
                        row.kind === 'ink'
                          ? 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                          : 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                      }`}>
                        {row.kind === 'ink' ? 'Tinta' : 'Papel'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-mono text-[10px] text-muted-foreground">{catalog?.code}</p>
                      <p>{catalog?.name}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      OC-{String(order?.order_number ?? '').padStart(4, '0')}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">{fmtDate(d.receipt_date)}</td>
                    <td className="px-4 py-3">
                      {row.kind === 'ink' ? (
                        <>
                          <p className="font-mono text-[11px]">{(d as InkReceiptWithContext).units_received} uds · {(d as InkReceiptWithContext).kg_received} kg</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {((d as InkReceiptWithContext).kg_received / (d as InkReceiptWithContext).units_received).toFixed(3)} kg/ud
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-mono text-[11px]">{(d as PaperReceiptWithContext).units_received} rollos · {(d as PaperReceiptWithContext).length_m} m × {(d as PaperReceiptWithContext).width_m} m</p>
                          <p className="font-mono text-[10px] text-muted-foreground">
                            {((d as PaperReceiptWithContext).total_m2_received ?? 0).toFixed(2)} m² total
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <QualityBadge value={d.quality_certificate as any} size="xs" />
                        {(d as any).certificate_url && (
                          <a
                            href={(d as any).certificate_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Ver certificado"
                            className="text-muted-foreground hover:text-green-700 transition-colors"
                          >
                            <FileCheck className="size-3.5" />
                          </a>
                        )}
                      </div>
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
                            className="px-2 py-1 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
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
