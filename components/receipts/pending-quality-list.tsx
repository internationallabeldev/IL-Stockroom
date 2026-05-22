'use client'

import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertTriangle, ChevronLeft, ChevronRight, Loader2,
  Search, Paperclip, CheckCircle2, XCircle,
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
  initialInk:       InkReceiptWithContext[]
  initialPaper:     PaperReceiptWithContext[]
  defaultMaterial?: 'INK' | 'PAPER'
}

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

export function PendingQualityList({ initialInk, initialPaper, defaultMaterial }: Props) {
  const [search,        setSearch]        = useState('')
  const [pageSizeInput, setPageSizeInput] = useState('20')
  const [pageSize,      setPageSize]      = useState(20)
  const [page,          setPage]          = useState(1)
  const [selected,      setSelected]      = useState<Set<string>>(new Set())
  const [bulkQuality,   setBulkQuality]   = useState<QualityValue | null>(null)
  const [bulkSaving,    setBulkSaving]    = useState(false)

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
      .filter(row => !defaultMaterial || (defaultMaterial === 'INK' ? row.kind === 'ink' : row.kind === 'paper'))
      .sort((a, b) => a.data.receipt_date.localeCompare(b.data.receipt_date)),
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

  const totalPages  = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged       = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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

  function commitPageSize() {
    const n = parseInt(pageSizeInput, 10)
    if (n > 0) { setPageSize(n); setPage(1) }
    else setPageSizeInput(String(pageSize))
  }

  function handleDone() {
    setSelected(new Set())
    refetch()
  }

  // Quick bulk action (no cert/notes — for speed)
  async function applyBulk() {
    if (!bulkQuality || filtered.length === 0) return
    const label = Q_OPTIONS.find(o => o.value === bulkQuality)!.label
    const ok = window.confirm(
      `¿Aplicar "${label}" a ${filtered.length} recepción${filtered.length !== 1 ? 'es' : ''}?`
    )
    if (!ok) return
    setBulkSaving(true)
    let errs = 0
    for (const row of filtered) {
      const action = row.kind === 'ink' ? updateInkReceiptQuality : updatePaperReceiptQuality
      const res = await action(row.data.id, { quality_certificate: bulkQuality })
      if (res.error) errs++
    }
    setBulkSaving(false)
    if (errs > 0) toast.error(`${errs} error${errs !== 1 ? 'es' : ''} al actualizar`)
    else toast.success(`${filtered.length} recepcion${filtered.length !== 1 ? 'es' : ''} actualizadas`)
    setSelected(new Set())
    refetch()
    setBulkQuality(null)
  }

  return (
    <div className="space-y-4">

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar lote, material, OC, proveedor…"
            className="w-full h-9 border border-foreground/20 bg-card pl-9 pr-3 text-xs outline-none focus:border-foreground/40 transition-colors"
          />
        </div>

        {/* Quick bulk action — no cert, no notes */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Todos ({filtered.length}):
          </span>
          <div className="flex border border-foreground/20">
            {Q_OPTIONS.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => setBulkQuality(prev => prev === o.value ? null : o.value)}
                className={cn(
                  'px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap',
                  bulkQuality === o.value ? o.activeCls : 'text-foreground/50 hover:bg-muted hover:text-foreground'
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            onClick={applyBulk}
            disabled={!bulkQuality || bulkSaving || filtered.length === 0}
            className="h-9 px-3 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-30 flex items-center gap-1.5 shrink-0"
          >
            {bulkSaving && <Loader2 className="size-3 animate-spin" />}
            Aplicar
          </button>
        </div>
      </div>

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
          <div className="border border-border overflow-x-auto">
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
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lote interno</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Material</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Orden</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Fecha</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Días</th>
                  <th className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Cantidad</th>
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
                      <td className="px-4 py-3">
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

          {/* ── Pagination bar ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span className="text-[9px] font-bold uppercase tracking-widest">Mostrar</span>
              <input
                type="text"
                value={pageSizeInput}
                onChange={e => setPageSizeInput(e.target.value)}
                onBlur={commitPageSize}
                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                className="w-14 h-7 border border-foreground/20 bg-card px-2 text-center text-xs outline-none focus:border-foreground/40 transition-colors"
              />
              <span className="text-[9px] font-bold uppercase tracking-widest">
                filas · {filtered.length} total
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <div className="flex border border-border">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="size-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="size-7 flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30 border-l border-border"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
