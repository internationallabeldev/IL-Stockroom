'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, FileCheck, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getAllReceipts, type InkReceiptWithContext, type PaperReceiptWithContext } from '@/actions/receipts.actions'
import { QualityBadge } from './quality-badge'
import { QualityUpdateForm } from './quality-update-form'

type AnyReceipt =
  | { kind: 'ink';   data: InkReceiptWithContext }
  | { kind: 'paper'; data: PaperReceiptWithContext }


function fmtDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

type Props = {
  initialInk:      InkReceiptWithContext[]
  initialPaper:    PaperReceiptWithContext[]
  canEdit:         boolean
  defaultMaterial?: 'INK' | 'PAPER'
  search:          string
  pageSize:        number
  qualityFilter:   string
  typeFilter:      string
}

type SortKey = 'batch' | 'type' | 'material' | 'order' | 'date' | 'qty' | 'quality'

export function ReceiptsHistory({ initialInk, initialPaper, canEdit, defaultMaterial, search, pageSize, qualityFilter, typeFilter }: Props) {
  const [page, setPage] = useState(1)
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [dialog, setDialog] = useState({ open: false, receiptId: 0, materialType: 'INK' as 'INK' | 'PAPER', batchRef: '', currentQuality: 'PENDING' as any })

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const { data } = useQuery({
    queryKey:        ['receipts-history'],
    queryFn:         () => getAllReceipts(),
    initialData:     { inkReceipts: initialInk, paperReceipts: initialPaper },
    refetchInterval: 30_000,
  })

  const allRows: AnyReceipt[] = [
    ...data.inkReceipts.map(d  => ({ kind: 'ink'   as const, data: d })),
    ...data.paperReceipts.map(d => ({ kind: 'paper' as const, data: d })),
  ]

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

  const dir = sortDir === 'asc' ? 1 : -1
  const sorted = [...filtered].sort((a, b) => {
    const ad = a.data, bd = b.data
    switch (sortKey) {
      case 'batch':    return ad.internal_batch.localeCompare(bd.internal_batch) * dir
      case 'type':     return a.kind.localeCompare(b.kind) * dir
      case 'material': {
        const an = a.kind === 'ink' ? (ad as InkReceiptWithContext).purchase_order_item?.ink_catalog?.name   : (ad as PaperReceiptWithContext).purchase_order_item?.paper_catalog?.name
        const bn = b.kind === 'ink' ? (bd as InkReceiptWithContext).purchase_order_item?.ink_catalog?.name   : (bd as PaperReceiptWithContext).purchase_order_item?.paper_catalog?.name
        return (an ?? '').localeCompare(bn ?? '') * dir
      }
      case 'order': {
        const ao = a.kind === 'ink' ? (ad as InkReceiptWithContext).purchase_order_item?.purchase_order?.order_number   : (ad as PaperReceiptWithContext).purchase_order_item?.purchase_order?.order_number
        const bo = b.kind === 'ink' ? (bd as InkReceiptWithContext).purchase_order_item?.purchase_order?.order_number   : (bd as PaperReceiptWithContext).purchase_order_item?.purchase_order?.order_number
        return ((ao ?? 0) - (bo ?? 0)) * dir
      }
      case 'date':     return ad.receipt_date.localeCompare(bd.receipt_date) * dir
      case 'qty': {
        const aq = a.kind === 'ink' ? (ad as InkReceiptWithContext).kg_received                            : ((ad as PaperReceiptWithContext).total_m2_received ?? 0)
        const bq = b.kind === 'ink' ? (bd as InkReceiptWithContext).kg_received                            : ((bd as PaperReceiptWithContext).total_m2_received ?? 0)
        return (aq - bq) * dir
      }
      case 'quality':  return ad.quality_certificate.localeCompare(bd.quality_certificate) * dir
      default:         return 0
    }
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  useEffect(() => { setPage(1) }, [search, qualityFilter, typeFilter, pageSize])

  return (
    <>
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
                {([
                  { label: 'Lote int.',  key: 'batch'    },
                  { label: 'Tipo',       key: 'type'     },
                  { label: 'Material',   key: 'material' },
                  { label: 'Orden',      key: 'order'    },
                  { label: 'Fecha',      key: 'date'     },
                  { label: 'Cantidad',   key: 'qty'      },
                  { label: 'Calidad',    key: 'quality'  },
                ] as { label: string; key: SortKey }[]).map(col => (
                  <th
                    key={col.label}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none"
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        : <ArrowUpDown className="size-3 opacity-30" />}
                    </span>
                  </th>
                ))}
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

      {/* Count + pagination — bottom */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {sorted.length} recepci{sorted.length !== 1 ? 'ones' : 'ón'}
          {sorted.length > pageSize && (
            <span className="ml-1 font-normal normal-case tracking-normal">
              — mostrando {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)}
            </span>
          )}
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
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push('…')
                acc.push(n)
                return acc
              }, [])
              .map((n, i) =>
                n === '…' ? (
                  <span key={`e${i}`} className="w-7 text-center text-[10px] text-muted-foreground">…</span>
                ) : (
                  <button
                    key={n}
                    onClick={() => setPage(n as number)}
                    className={cn(
                      'size-7 text-[10px] font-bold border transition-colors',
                      safePage === n
                        ? 'bg-foreground text-background border-foreground'
                        : 'border-border hover:bg-muted',
                    )}
                  >
                    {n}
                  </button>
                )
              )}
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
