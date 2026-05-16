'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  X, Plus, Trash2, Droplet, FileText,
  AlertTriangle, Search, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createInkRequisition, createPaperRequisition } from '@/actions/requisitions.actions'
import type { InkCatalogForRequisition, PaperCatalogForRequisition } from '@/actions/requisitions.actions'

// ── Types ────────────────────────────────────────────────────────────────────

type MaterialType = 'INK' | 'PAPER'

type InkItem = {
  ink_catalog_id: number
  name:           string
  code:           string
  color_code:     string | null
  kg_requested:   string
  stock:          number
}

type PaperItem = {
  paper_catalog_id:   number
  name:               string
  code:               string
  length_m_requested: string
  width_m_requested:  string
  stock_m2:           number
}

export type RequisitionPreselected = {
  materialType: MaterialType
  catalogId:    number
  name:         string
  code:         string
  colorCode?:   string | null
  stock?:       number
}

type Props = {
  open:                boolean
  onClose:             () => void
  inkCatalog:          InkCatalogForRequisition[]
  paperCatalog:        PaperCatalogForRequisition[]
  preselected?:        RequisitionPreselected
  defaultMaterialType?: MaterialType
}

// ── Catalog selectors ─────────────────────────────────────────────────────────

function InkSelector({ items, disabledIds, onSelect }: {
  items:       InkCatalogForRequisition[]
  disabledIds: number[]
  onSelect:    (item: InkCatalogForRequisition) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = items.filter(c =>
    !disabledIds.includes(c.id) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-dashed border-[#1A1A1A]/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
      >
        <Plus className="size-3.5" />
        Agregar tinta
        <ChevronDown className={cn('size-3 ml-auto transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#F5F2EA] border border-[#1A1A1A]/20 max-h-56 overflow-y-auto shadow-md">
          <div className="p-2 border-b border-[#1A1A1A]/10 sticky top-0 bg-[#F5F2EA]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#1A1A1A]/40" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar tinta…"
                className="w-full h-7 bg-[#fdf9f0] border border-[#1A1A1A]/20 pl-7 pr-2 text-xs outline-none focus:border-[#1A1A1A]/40"
              />
            </div>
          </div>
          {filtered.length === 0
            ? <p className="px-3 py-4 text-[10px] text-[#5f5e59] text-center">Sin resultados</p>
            : filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#E5E1D8]/60 transition-colors text-sm"
              >
                {c.color_code?.startsWith('#') && (
                  <span className="inline-block size-3 rounded-sm shrink-0 border border-[#1A1A1A]/10" style={{ background: c.color_code }} />
                )}
                <div className="min-w-0">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-[#5f5e59]">
                    {c.code} · {(c.current_stock_kg ?? 0).toFixed(1)} kg disp.
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

function PaperSelector({ items, disabledIds, onSelect }: {
  items:       PaperCatalogForRequisition[]
  disabledIds: number[]
  onSelect:    (item: PaperCatalogForRequisition) => void
}) {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const filtered = items.filter(c =>
    !disabledIds.includes(c.id) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-dashed border-[#1A1A1A]/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
      >
        <Plus className="size-3.5" />
        Agregar papel
        <ChevronDown className={cn('size-3 ml-auto transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-[#F5F2EA] border border-[#1A1A1A]/20 max-h-56 overflow-y-auto shadow-md">
          <div className="p-2 border-b border-[#1A1A1A]/10 sticky top-0 bg-[#F5F2EA]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#1A1A1A]/40" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar papel…"
                className="w-full h-7 bg-[#fdf9f0] border border-[#1A1A1A]/20 pl-7 pr-2 text-xs outline-none focus:border-[#1A1A1A]/40"
              />
            </div>
          </div>
          {filtered.length === 0
            ? <p className="px-3 py-4 text-[10px] text-[#5f5e59] text-center">Sin resultados</p>
            : filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#E5E1D8]/60 transition-colors text-sm"
              >
                <div className="min-w-0">
                  <p className="font-bold truncate">{c.name}</p>
                  <p className="text-[10px] font-mono text-[#5f5e59]">
                    {c.code} · {(c.current_stock_m2 ?? 0).toFixed(2)} m² disp.
                    {c.weight_gsm ? ` · ${c.weight_gsm} g/m²` : ''}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  )
}

// ── Main form ─────────────────────────────────────────────────────────────────

export function RequisitionForm({ open, onClose, inkCatalog, paperCatalog, preselected, defaultMaterialType }: Props) {
  const router = useRouter()

  // When a type comes from preselected or defaultMaterialType it's locked — no toggle shown
  const lockedType: MaterialType | null = preselected?.materialType ?? defaultMaterialType ?? null

  const [materialType,    setMaterialType]    = useState<MaterialType>(lockedType ?? 'INK')
  const [productionOrder, setProductionOrder] = useState('')
  const [notes,           setNotes]           = useState('')
  const [inkItems,        setInkItems]        = useState<InkItem[]>(() =>
    preselected?.materialType === 'INK'
      ? [{ ink_catalog_id: preselected.catalogId, name: preselected.name, code: preselected.code, color_code: preselected.colorCode ?? null, kg_requested: '', stock: preselected.stock ?? 0 }]
      : [],
  )
  const [paperItems, setPaperItems] = useState<PaperItem[]>(() =>
    preselected?.materialType === 'PAPER'
      ? [{ paper_catalog_id: preselected.catalogId, name: preselected.name, code: preselected.code, length_m_requested: '', width_m_requested: '', stock_m2: preselected.stock ?? 0 }]
      : [],
  )
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const locked = preselected?.materialType ?? defaultMaterialType ?? null
    setMaterialType(locked ?? 'INK')
    if (preselected) {
      if (preselected.materialType === 'INK') {
        setInkItems([{ ink_catalog_id: preselected.catalogId, name: preselected.name, code: preselected.code, color_code: preselected.colorCode ?? null, kg_requested: '', stock: preselected.stock ?? 0 }])
        setPaperItems([])
      } else {
        setPaperItems([{ paper_catalog_id: preselected.catalogId, name: preselected.name, code: preselected.code, length_m_requested: '', width_m_requested: '', stock_m2: preselected.stock ?? 0 }])
        setInkItems([])
      }
    } else {
      setInkItems([])
      setPaperItems([])
    }
    setProductionOrder('')
    setNotes('')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ── Ink helpers ──────────────────────────────────────────────────────────

  function addInkItem(c: InkCatalogForRequisition) {
    setInkItems(prev => [...prev, { ink_catalog_id: c.id, name: c.name, code: c.code, color_code: c.color_code ?? null, kg_requested: '', stock: c.current_stock_kg ?? 0 }])
  }

  function removeInkItem(idx: number) {
    if (preselected && idx === 0) return
    setInkItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updateInkKg(idx: number, val: string) {
    setInkItems(prev => prev.map((it, i) => i === idx ? { ...it, kg_requested: val } : it))
  }

  // ── Paper helpers ────────────────────────────────────────────────────────

  function addPaperItem(c: PaperCatalogForRequisition) {
    setPaperItems(prev => [...prev, { paper_catalog_id: c.id, name: c.name, code: c.code, length_m_requested: '', width_m_requested: '', stock_m2: c.current_stock_m2 ?? 0 }])
  }

  function removePaperItem(idx: number) {
    if (preselected && idx === 0) return
    setPaperItems(prev => prev.filter((_, i) => i !== idx))
  }

  function updatePaperItem(idx: number, patch: Partial<PaperItem>) {
    setPaperItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    setSubmitting(true)
    if (materialType === 'INK') {
      const res = await createInkRequisition({
        production_order: productionOrder,
        notes,
        items: inkItems.map(it => ({ ink_catalog_id: it.ink_catalog_id, kg_requested: parseFloat(it.kg_requested) })),
      })
      if (res.error) { toast.error(res.error); setSubmitting(false); return }
      toast.success('Requisición creada')
      onClose()
      if (res.requisitionId) router.push(`/dashboard/requisitions/${res.requisitionId}`)
    } else {
      const res = await createPaperRequisition({
        production_order: productionOrder,
        notes,
        items: paperItems.map(it => ({
          paper_catalog_id:   it.paper_catalog_id,
          length_m_requested: parseFloat(it.length_m_requested),
          width_m_requested:  parseFloat(it.width_m_requested),
        })),
      })
      if (res.error) { toast.error(res.error); setSubmitting(false); return }
      toast.success('Requisición creada')
      onClose()
      if (res.requisitionId) router.push(`/dashboard/requisitions/${res.requisitionId}`)
    }
    setSubmitting(false)
  }

  // ── Derived ──────────────────────────────────────────────────────────────

  const itemsValid = materialType === 'INK'
    ? inkItems.length > 0 && inkItems.every(it => parseFloat(it.kg_requested) > 0)
    : paperItems.length > 0 && paperItems.every(it => parseFloat(it.length_m_requested) > 0 && parseFloat(it.width_m_requested) > 0)

  const canSubmit = productionOrder.trim().length > 0 && itemsValid && !submitting

  const inkIds   = inkItems.map(it => it.ink_catalog_id)
  const paperIds = paperItems.map(it => it.paper_catalog_id)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative ml-auto h-full w-full max-w-xl bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="shrink-0 px-6 py-5 border-b border-[#1A1A1A]/15 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight text-[#1A1A1A]">
              Nueva requisición
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              {preselected
                ? `${materialType === 'INK' ? 'Tinta' : 'Papel'} · ${preselected.name}`
                : lockedType
                  ? (lockedType === 'INK' ? 'Tintas' : 'Papel')
                  : 'Tintas y papel'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Material type toggle — only when not locked */}
          {!lockedType && (
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">
                Tipo de material
              </label>
              <div className="flex border border-[#1A1A1A]/20 w-fit">
                {(['INK', 'PAPER'] as MaterialType[]).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMaterialType(type)}
                    className={cn(
                      'flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors',
                      materialType === type
                        ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                        : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] border-l border-[#1A1A1A]/20 first:border-l-0',
                    )}
                  >
                    {type === 'INK' ? <Droplet className="size-3.5" /> : <FileText className="size-3.5" />}
                    {type === 'INK' ? 'Tinta' : 'Papel'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Orden de producción */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
              Orden de producción *
            </label>
            <input
              value={productionOrder}
              onChange={e => setProductionOrder(e.target.value)}
              placeholder="Ej. OP-2024-0142"
              className="w-full h-9 px-3 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors font-mono"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
              Notas
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Instrucciones adicionales…"
              className="w-full px-3 py-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors resize-none"
            />
          </div>

          {/* ── Ink items ──────────────────────────────────────────────── */}
          {materialType === 'INK' && (
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Tintas solicitadas
              </p>

              {inkItems.map((item, idx) => {
                const kg      = parseFloat(item.kg_requested) || 0
                const warning = kg > item.stock && item.stock > 0

                return (
                  <div key={idx} className="border border-[#1A1A1A]/15 bg-[#E5E1D8]/20 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      {item.color_code?.startsWith('#') && (
                        <span className="size-3 rounded-sm shrink-0 border border-[#1A1A1A]/10" style={{ background: item.color_code }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-[#5f5e59]">
                          {item.code} · Stock: {item.stock.toFixed(1)} kg
                        </p>
                      </div>
                      {!(preselected && idx === 0) && (
                        <button type="button" onClick={() => removeInkItem(idx)} className="text-[#5f5e59] hover:text-red-600 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">
                        Kg solicitados *
                      </label>
                      <input
                        type="number"
                        min={0.01}
                        step={0.01}
                        value={item.kg_requested}
                        onChange={e => updateInkKg(idx, e.target.value)}
                        placeholder="0.00"
                        className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-sm outline-none focus:border-[#1A1A1A]/40 font-mono"
                      />
                    </div>
                    {warning && (
                      <p className="flex items-center gap-1 text-[9px] text-amber-700 font-bold">
                        <AlertTriangle className="size-3" />
                        Stock insuficiente — disponible: {item.stock.toFixed(1)} kg
                      </p>
                    )}
                  </div>
                )
              })}

              {inkCatalog.length > inkIds.length && (
                <InkSelector items={inkCatalog} disabledIds={inkIds} onSelect={addInkItem} />
              )}
            </div>
          )}

          {/* ── Paper items ────────────────────────────────────────────── */}
          {materialType === 'PAPER' && (
            <div className="space-y-3">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Papeles solicitados
              </p>

              {paperItems.map((item, idx) => {
                const len     = parseFloat(item.length_m_requested) || 0
                const wid     = parseFloat(item.width_m_requested) || 0
                const m2      = len * wid
                const warning = m2 > item.stock_m2 && item.stock_m2 > 0

                return (
                  <div key={idx} className="border border-[#1A1A1A]/15 bg-[#E5E1D8]/20 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-[#5f5e59]">
                          {item.code} · Stock: {item.stock_m2.toFixed(2)} m²
                        </p>
                      </div>
                      {!(preselected && idx === 0) && (
                        <button type="button" onClick={() => removePaperItem(idx)} className="text-[#5f5e59] hover:text-red-600 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Largo (m) *</label>
                        <input
                          type="number" min={0.001} step={0.001}
                          value={item.length_m_requested}
                          onChange={e => updatePaperItem(idx, { length_m_requested: e.target.value })}
                          placeholder="0.000"
                          className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-[11px] outline-none focus:border-[#1A1A1A]/40 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Ancho (m) *</label>
                        <input
                          type="number" min={0.001} step={0.001}
                          value={item.width_m_requested}
                          onChange={e => updatePaperItem(idx, { width_m_requested: e.target.value })}
                          placeholder="0.000"
                          className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-[11px] outline-none focus:border-[#1A1A1A]/40 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">M²</label>
                        <div className="h-8 px-2 border border-[#1A1A1A]/10 bg-[#E5E1D8]/40 flex items-center text-[11px] font-mono font-bold">
                          {m2 > 0 ? m2.toFixed(3) : '—'}
                        </div>
                      </div>
                    </div>
                    {warning && (
                      <p className="flex items-center gap-1 text-[9px] text-amber-700 font-bold">
                        <AlertTriangle className="size-3" />
                        Stock insuficiente — disponible: {item.stock_m2.toFixed(2)} m²
                      </p>
                    )}
                  </div>
                )
              })}

              {paperCatalog.length > paperIds.length && (
                <PaperSelector items={paperCatalog} disabledIds={paperIds} onSelect={addPaperItem} />
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-[#1A1A1A]/15 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Creando…' : 'Crear requisición'}
          </button>
        </div>
      </div>
    </div>
  )
}
