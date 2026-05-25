'use client'

import { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Loader2,
  Paperclip, CheckCircle2, XCircle, ArrowUp, ArrowDown, ArrowUpDown,
} from 'lucide-react'
import {
  getPendingQualityReceipts,
  updateInkReceiptQuality,
  updatePaperReceiptQuality,
  uploadCertificate,
  type InkReceiptWithContext,
  type PaperReceiptWithContext,
} from '@/actions/receipts.actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

type PendingItem =
  | { kind: 'ink';   data: InkReceiptWithContext }
  | { kind: 'paper'; data: PaperReceiptWithContext }

type QualityValue = 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
type Target       = { receiptId: number; kind: 'ink' | 'paper' }

type Props = {
  initialInk:           InkReceiptWithContext[]
  initialPaper:         PaperReceiptWithContext[]
  defaultMaterial?:     'INK' | 'PAPER'
  search:               string
  pageSize:             number
  bulkQuality:          QualityValue | null
  onBulkSavingChange:   (v: boolean) => void
  onBulkDone:           () => void
}

type Handle = { applyBulk: () => Promise<void> }

// ─── Constants ─────────────────────────────────────────────────────────────────

const Q_OPTIONS: { value: QualityValue; label: string; activeCls: string }[] = [
  { value: 'APPROVED',    label: 'Aprobado',    activeCls: 'bg-green-600  text-white' },
  { value: 'REJECTED',    label: 'Rechazado',   activeCls: 'bg-red-600    text-white' },
  { value: 'CONDITIONAL', label: 'Condicional', activeCls: 'bg-orange-500 text-white' },
]

// ─── Helpers ───────────────────────────────────────────────────────────────────

function daysSince(dateStr: string) {
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 86_400_000)
}

function fmtDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function rowKey(kind: 'ink' | 'paper', id: number) {
  return `${kind}-${id}`
}

// ─── Per-row inline evaluator ─────────────────────────────────────────────────

function InlineEvaluator({
  receiptId,
  kind,
  batchRef,
  targets,
  onDone,
}: {
  receiptId: number
  kind:      'ink' | 'paper'
  batchRef:  string
  targets:   Target[]   // all selected rows; if length > 1, Guardar applies to all
  onDone:    () => void
}) {
  const [quality,   setQuality]   = useState<QualityValue | null>(null)
  const [certUrl,   setCertUrl]   = useState<string | null>(null)
  const [notes,     setNotes]     = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadCertificate(fd)
    setUploading(false)
    if (res.error) { toast.error(res.error); return }
    setCertUrl(res.url ?? null)
    toast.success('Certificado subido')
  }

  function selectQuality(v: QualityValue) {
    setQuality(prev => {
      if (prev === v) return null
      if (v !== 'APPROVED') { setCertUrl(null); if (fileRef.current) fileRef.current.value = '' }
      return v
    })
  }

  async function save() {
    if (!quality) return
    setSaving(true)
    const applyTo = targets.length > 1 ? targets : [{ receiptId, kind }]
    let errs = 0
    for (const t of applyTo) {
      const action = t.kind === 'ink' ? updateInkReceiptQuality : updatePaperReceiptQuality
      const res = await action(t.receiptId, {
        quality_certificate: quality,
        quality_notes:       notes.trim() || null,
        certificate_url:     certUrl,
      })
      if (res.error) errs++
    }
    setSaving(false)
    if (errs > 0) toast.error(`${errs} error${errs !== 1 ? 'es' : ''} al guardar`)
    else if (applyTo.length > 1) toast.success(`${applyTo.length} lotes actualizados`)
    else toast.success(`${batchRef} → ${Q_OPTIONS.find(o => o.value === quality)!.label}`)
    onDone()
  }

  const applyCount = targets.length > 1 ? targets.length : 1

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Quality toggle */}
      <div className="flex border border-foreground/20">
        {Q_OPTIONS.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => selectQuality(o.value)}
            className={cn(
              'px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap',
              quality === o.value ? o.activeCls : 'text-foreground/50 hover:bg-muted hover:text-foreground'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Certificate upload — only when APPROVED */}
      {quality === 'APPROVED' && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="h-7 px-2.5 flex items-center gap-1 border border-foreground/20 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? <Loader2 className="size-2.5 animate-spin" /> : <Paperclip className="size-2.5" />}
            {uploading ? 'Subiendo…' : certUrl ? 'Reemplazar' : 'Certificado'}
          </button>
          {certUrl && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="size-3 text-green-600 shrink-0" />
              <a
                href={certUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] font-bold text-green-700 underline underline-offset-2 max-w-24 truncate"
              >
                Ver
              </a>
              <button
                type="button"
                onClick={() => { setCertUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                className="text-muted-foreground hover:text-red-600 transition-colors"
              >
                <XCircle className="size-3" />
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            className="hidden"
            onChange={handleFile}
          />
        </div>
      )}

      {/* Notes — visible when quality selected */}
      {quality && (
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notas (opcional)"
          className="h-7 border border-foreground/20 bg-card px-2 text-[10px] outline-none focus:border-foreground/40 transition-colors w-36"
        />
      )}

      {/* Save */}
      <button
        onClick={save}
        disabled={!quality || saving}
        className="h-7 px-3 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-25 flex items-center gap-1 shrink-0"
      >
        {saving && <Loader2 className="size-2.5 animate-spin" />}
        {applyCount > 1 ? `Guardar (${applyCount})` : 'Guardar'}
      </button>

      {/* Grouping indicator */}
      {applyCount > 1 && (
        <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600 whitespace-nowrap">
          → {applyCount} seleccionados
        </span>
      )}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

type SortKey = 'batch' | 'material' | 'order' | 'date' | 'days' | 'qty'

export const PendingQualityList = forwardRef<Handle, Props>(
function PendingQualityList({ initialInk, initialPaper, defaultMaterial, search, pageSize, bulkQuality, onBulkSavingChange, onBulkDone }, ref) {
  const [page,     setPage]     = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sortKey,  setSortKey]  = useState<SortKey>('date')
  const [sortDir,  setSortDir]  = useState<'asc' | 'desc'>('asc')

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  useEffect(() => { setPage(1) }, [search, pageSize])

  const { data, refetch } = useQuery({
    queryKey:    ['pending-quality'],
    queryFn:     () => getPendingQualityReceipts(),
    initialData: { inkReceipts: initialInk, paperReceipts: initialPaper },
    refetchInterval: 30_000,
  })

  const allRows = useMemo((): PendingItem[] =>
    [
      ...data.inkReceipts.map(d => ({ kind: 'ink'   as const, data: d })),
      ...data.paperReceipts.map(d => ({ kind: 'paper' as const, data: d })),
    ]
      .filter(row => !defaultMaterial || (defaultMaterial === 'INK' ? row.kind === 'ink' : row.kind === 'paper')),
  [data, defaultMaterial])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allRows
    return allRows.filter(row => {
      const d       = row.data
      const catalog = row.kind === 'ink'
        ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
        : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
      const order   = row.kind === 'ink'
        ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
        : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order
      return (
        d.internal_batch.toLowerCase().includes(q)          ||
        (d.provider_batch ?? '').toLowerCase().includes(q)  ||
        (catalog?.name    ?? '').toLowerCase().includes(q)  ||
        (catalog?.code    ?? '').toLowerCase().includes(q)  ||
        String(order?.order_number ?? '').includes(q)       ||
        (order?.providers?.name ?? '').toLowerCase().includes(q)
      )
    })
  }, [allRows, search])

  const sorted = useMemo(() => {
    const dir = sortDir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const ad = a.data, bd = b.data
      switch (sortKey) {
        case 'batch':    return ad.internal_batch.localeCompare(bd.internal_batch) * dir
        case 'material': {
          const ac = a.kind === 'ink' ? (ad as InkReceiptWithContext).purchase_order_item?.ink_catalog   : (ad as PaperReceiptWithContext).purchase_order_item?.paper_catalog
          const bc = b.kind === 'ink' ? (bd as InkReceiptWithContext).purchase_order_item?.ink_catalog   : (bd as PaperReceiptWithContext).purchase_order_item?.paper_catalog
          return (ac?.name ?? '').localeCompare(bc?.name ?? '') * dir
        }
        case 'order': {
          const ao = a.kind === 'ink' ? (ad as InkReceiptWithContext).purchase_order_item?.purchase_order?.order_number   : (ad as PaperReceiptWithContext).purchase_order_item?.purchase_order?.order_number
          const bo = b.kind === 'ink' ? (bd as InkReceiptWithContext).purchase_order_item?.purchase_order?.order_number   : (bd as PaperReceiptWithContext).purchase_order_item?.purchase_order?.order_number
          return ((ao ?? 0) - (bo ?? 0)) * dir
        }
        case 'date':    return ad.receipt_date.localeCompare(bd.receipt_date) * dir
        case 'days':    return ad.receipt_date.localeCompare(bd.receipt_date) * dir
        case 'qty': {
          const aq = a.kind === 'ink' ? (ad as InkReceiptWithContext).kg_received                          : ((ad as PaperReceiptWithContext).total_m2_received ?? 0)
          const bq = b.kind === 'ink' ? (bd as InkReceiptWithContext).kg_received                          : ((bd as PaperReceiptWithContext).total_m2_received ?? 0)
          return (aq - bq) * dir
        }
        default:        return 0
      }
    })
  }, [filtered, sortKey, sortDir])

  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged       = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Selected targets (from allRows so selection persists across pages)
  const selectedTargets: Target[] = useMemo(
    () => allRows
      .filter(row => selected.has(rowKey(row.kind, row.data.id)))
      .map(row => ({ receiptId: row.data.id, kind: row.kind })),
    [allRows, selected]
  )

  function toggleRow(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const allPagedSelected = paged.length > 0 && paged.every(row => selected.has(rowKey(row.kind, row.data.id)))

  function togglePageAll(checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      paged.forEach(row => {
        const k = rowKey(row.kind, row.data.id)
        checked ? next.add(k) : next.delete(k)
      })
      return next
    })
  }

  function handleDone() {
    setSelected(new Set())
    refetch()
  }

  useImperativeHandle(ref, () => ({
    applyBulk: async () => {
      if (!bulkQuality || filtered.length === 0) return
      const label = Q_OPTIONS.find(o => o.value === bulkQuality)!.label
      const ok = window.confirm(
        `¿Aplicar "${label}" a ${filtered.length} recepción${filtered.length !== 1 ? 'es' : ''}?`
      )
      if (!ok) return
      onBulkSavingChange(true)
      let errs = 0
      for (const row of filtered) {
        const action = row.kind === 'ink' ? updateInkReceiptQuality : updatePaperReceiptQuality
        const res = await action(row.data.id, { quality_certificate: bulkQuality })
        if (res.error) errs++
      }
      onBulkSavingChange(false)
      if (errs > 0) toast.error(`${errs} error${errs !== 1 ? 'es' : ''} al actualizar`)
      else toast.success(`${filtered.length} recepcion${filtered.length !== 1 ? 'es' : ''} actualizadas`)
      setSelected(new Set())
      refetch()
      onBulkDone()
    },
  }), [bulkQuality, filtered, onBulkSavingChange, onBulkDone, refetch])

  return (
    <div className="space-y-4">

      {/* ── Selection bar ────────────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
          <span className="text-[9px] font-bold uppercase tracking-widest">
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''} — al guardar en cualquiera de ellos se aplicará a todos
          </span>
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-[9px] font-bold uppercase tracking-widest underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
          >
            Limpiar selección
          </button>
        </div>
      )}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="border border-dashed border-foreground/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {search.trim()
              ? 'Sin resultados para la búsqueda'
              : 'No hay recepciones pendientes de evaluación de calidad'}
          </p>
        </div>
      ) : (
        <>
          {/* ── Table ─────────────────────────────────────────────────────── */}
          <div id="receipts-pending-table" className="border border-border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/60 border-b border-foreground/10">
                  <th className="px-3 py-2.5 w-8">
                    <input
                      type="checkbox"
                      checked={allPagedSelected}
                      onChange={e => togglePageAll(e.target.checked)}
                      title="Seleccionar página"
                      className="size-3.5 cursor-pointer accent-blue-600"
                    />
                  </th>
                  {([
                    { label: 'Lote interno', key: 'batch'    },
                    { label: 'Material',     key: 'material' },
                    { label: 'Orden',        key: 'order'    },
                    { label: 'Fecha',        key: 'date'     },
                    { label: 'Días',         key: 'days'     },
                    { label: 'Cantidad',     key: 'qty'      },
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
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Evaluar calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/8">
                {paged.map(row => {
                  const d       = row.data
                  const key     = rowKey(row.kind, d.id)
                  const isSelected = selected.has(key)
                  const days    = daysSince(d.receipt_date)
                  const alert   = days > 3
                  const catalog = row.kind === 'ink'
                    ? (d as InkReceiptWithContext).purchase_order_item?.ink_catalog
                    : (d as PaperReceiptWithContext).purchase_order_item?.paper_catalog
                  const order   = row.kind === 'ink'
                    ? (d as InkReceiptWithContext).purchase_order_item?.purchase_order
                    : (d as PaperReceiptWithContext).purchase_order_item?.purchase_order
                  const inkD   = d as InkReceiptWithContext
                  const paperD = d as PaperReceiptWithContext

                  return (
                    <tr
                      key={key}
                      className={cn(
                        'transition-colors',
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'hover:bg-muted/30'
                      )}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRow(key)}
                          className="size-3.5 cursor-pointer accent-blue-600"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">{d.internal_batch}</td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px] text-muted-foreground">{catalog?.code}</p>
                        <p className="font-medium text-foreground">{catalog?.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[10px]">OC-{String(order?.order_number ?? '').padStart(4, '0')}</p>
                        <p className="text-[10px] text-muted-foreground">{order?.providers?.name}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px]">{fmtDate(d.receipt_date)}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center gap-1 font-mono text-[11px]',
                          alert ? 'text-red-600 font-bold' : 'text-muted-foreground'
                        )}>
                          {alert && <AlertTriangle className="size-3" />}
                          {days}d
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {row.kind === 'ink' ? (
                          <>
                            <p className="font-mono text-[11px]">{inkD.units_received} uds · {inkD.kg_received} kg</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{(inkD.kg_received / inkD.units_received).toFixed(3)} kg/ud</p>
                          </>
                        ) : (
                          <>
                            <p className="font-mono text-[11px]">{paperD.units_received} rollos · {paperD.length_m} m × {paperD.width_m} m</p>
                            <p className="font-mono text-[10px] text-muted-foreground">{(paperD.total_m2_received ?? 0).toFixed(2)} m² total</p>
                          </>
                        )}
                      </td>
                      <td id={paged.indexOf(row) === 0 ? 'receipts-inline-evaluator' : undefined} className="px-4 py-3">
                        <InlineEvaluator
                          receiptId={d.id}
                          kind={row.kind}
                          batchRef={d.internal_batch}
                          targets={isSelected && selectedTargets.length > 1 ? selectedTargets : [{ receiptId: d.id, kind: row.kind }]}
                          onDone={handleDone}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ── Count + pagination ────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {sorted.length} recepción{sorted.length !== 1 ? 'es' : ''}
              {sorted.length > pageSize && (
                <span className="ml-1 font-normal normal-case tracking-normal">
                  — mostrando {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)}
                </span>
              )}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
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
                          currentPage === n
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
                  disabled={currentPage === totalPages}
                  className="size-7 flex items-center justify-center border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
})
