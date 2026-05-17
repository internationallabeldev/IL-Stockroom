'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PackageSearch } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  getAvailableInkLots,
  getAvailablePaperLots,
  fulfillInkRequisition,
  fulfillPaperRequisition,
  type Requisition,
  type AvailableInkLot,
  type AvailablePaperLot,
} from '@/actions/requisitions.actions'

type Props = {
  open:        boolean
  onClose:     () => void
  requisition: Requisition
}

// ── Ink form ─────────────────────────────────────────────────────────────────

type InkAllocation = {
  inventory_id: number
  kg_delivered: string
}

function InkFulfillBody({ req, onClose }: { req: Requisition; onClose: () => void }) {
  const unfulfilled = req.ink_items.filter(it => !it.is_fulfilled)

  const [allocs, setAllocs] = useState<Record<number, InkAllocation[]>>(
    () => Object.fromEntries(unfulfilled.map(it => [it.id, [{ inventory_id: 0, kg_delivered: '' }]])),
  )
  const [submitting, setSubmitting] = useState(false)

  const catalogIds = [...new Set(unfulfilled.map(it => it.ink_catalog_id))]

  const lotsQuery = useQuery({
    queryKey: ['avail-ink-lots', catalogIds.join(',')],
    queryFn:  async () => {
      const results = await Promise.all(catalogIds.map(id => getAvailableInkLots(id)))
      return Object.fromEntries(catalogIds.map((id, i) => [id, results[i]]))
    },
    enabled: unfulfilled.length > 0,
  })

  const lotsByCatalog: Record<number, AvailableInkLot[]> = lotsQuery.data ?? {}

  function addAlloc(itemId: number) {
    setAllocs(prev => ({
      ...prev,
      [itemId]: [...prev[itemId], { inventory_id: 0, kg_delivered: '' }],
    }))
  }

  function removeAlloc(itemId: number, idx: number) {
    setAllocs(prev => ({
      ...prev,
      [itemId]: prev[itemId].filter((_, i) => i !== idx),
    }))
  }

  function updateAlloc(itemId: number, idx: number, patch: Partial<InkAllocation>) {
    setAllocs(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((a, i) => i === idx ? { ...a, ...patch } : a),
    }))
  }

  async function handleSubmit() {
    const outputs = Object.values(allocs).flat().filter(
      a => a.inventory_id > 0 && parseFloat(a.kg_delivered) > 0,
    ).map(a => ({
      inventory_id: a.inventory_id,
      kg_delivered: parseFloat(a.kg_delivered),
    }))

    if (!outputs.length) { toast.error('Agrega al menos una entrega'); return }

    setSubmitting(true)
    const res = await fulfillInkRequisition(req.id, outputs)
    if (res.error) toast.error(res.error)
    else { toast.success('Surtido registrado'); onClose() }
    setSubmitting(false)
  }

  if (lotsQuery.isLoading) {
    return <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cargando lotes…</div>
  }

  return (
    <>
      <div className="px-6 py-5 space-y-5 max-h-[55vh] overflow-y-auto">
        {unfulfilled.map(item => {
          const lots       = lotsByCatalog[item.ink_catalog_id] ?? []
          const remaining  = item.kg_requested - (item.kg_delivered ?? 0)
          const itemAllocs = allocs[item.id] ?? []
          const allocated  = itemAllocs.reduce((s, a) => s + (parseFloat(a.kg_delivered) || 0), 0)
          const overAlloc  = allocated > remaining

          return (
            <div key={item.id} className="border border-border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{item.ink_catalog?.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{item.ink_catalog?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Por surtir</p>
                  <p className="text-sm font-mono font-bold">{remaining.toFixed(2)} kg</p>
                </div>
              </div>

              {lots.length === 0 ? (
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  <PackageSearch className="size-3.5 shrink-0" />
                  Sin lotes disponibles con calidad APROBADA
                </div>
              ) : (
                <div className="space-y-2">
                  {itemAllocs.map((alloc, idx) => {
                    const selectedLot = lots.find(l => l.id === alloc.inventory_id)
                    return (
                      <div key={idx} className="grid grid-cols-[1fr_120px_auto] gap-2 items-end">
                        <div>
                          {idx === 0 && (
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              Lote
                            </label>
                          )}
                          <select
                            value={alloc.inventory_id}
                            onChange={e => updateAlloc(item.id, idx, { inventory_id: Number(e.target.value) })}
                            className="w-full h-8 px-2 border border-foreground/20 bg-card text-[11px] outline-none focus:border-foreground/50"
                          >
                            <option value={0}>Seleccionar lote…</option>
                            {lots.map(l => (
                              <option key={l.id} value={l.id}>
                                {l.internal_batch} · {l.remaining_kg.toFixed(2)} kg disp.
                                {l.location ? ` · ${l.location}` : ''}
                              </option>
                            ))}
                          </select>
                          {selectedLot && (
                            <p className="text-[9px] text-muted-foreground mt-0.5">
                              Disponible: {selectedLot.remaining_kg.toFixed(2)} kg
                            </p>
                          )}
                        </div>

                        <div>
                          {idx === 0 && (
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                              Kg a entregar
                            </label>
                          )}
                          <input
                            type="number"
                            min={0.01}
                            step={0.01}
                            value={alloc.kg_delivered}
                            onChange={e => updateAlloc(item.id, idx, { kg_delivered: e.target.value })}
                            placeholder="0.00"
                            className="w-full h-8 px-2 border border-foreground/20 bg-card text-[11px] outline-none focus:border-foreground/50 font-mono"
                          />
                        </div>

                        <div className={idx === 0 ? 'pt-5' : ''}>
                          {itemAllocs.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeAlloc(item.id, idx)}
                              className="h-8 px-2 text-muted-foreground hover:text-red-600 transition-colors border border-border"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => addAlloc(item.id)}
                  className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Otro lote
                </button>
                <div className={cn(
                  'text-[10px] font-bold uppercase tracking-widest',
                  overAlloc ? 'text-red-600' : 'text-muted-foreground',
                )}>
                  Asignado: {allocated.toFixed(2)} / {remaining.toFixed(2)} kg
                  {overAlloc && <span className="ml-1">(excede lo solicitado)</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          disabled={submitting}
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
        >
          {submitting ? 'Registrando…' : 'Registrar surtido'}
        </button>
      </div>
    </>
  )
}

// ── Paper form ────────────────────────────────────────────────────────────────

type PaperAllocation = {
  inventory_id: number
  length_m:     string
  width_m:      string
}

function PaperFulfillBody({ req, onClose }: { req: Requisition; onClose: () => void }) {
  const unfulfilled = req.paper_items.filter(it => !it.is_fulfilled)

  const [allocs, setAllocs] = useState<Record<number, PaperAllocation>>(
    () => Object.fromEntries(unfulfilled.map(it => [it.id, {
      inventory_id: 0,
      length_m:     it.length_m_requested.toFixed(3),
      width_m:      it.width_m_requested.toFixed(3),
    }])),
  )
  const [submitting, setSubmitting] = useState(false)

  const catalogIds = [...new Set(unfulfilled.map(it => it.paper_catalog_id))]

  const lotsQuery = useQuery({
    queryKey: ['avail-paper-lots', catalogIds.join(',')],
    queryFn:  async () => {
      const results = await Promise.all(catalogIds.map(id => getAvailablePaperLots(id)))
      return Object.fromEntries(catalogIds.map((id, i) => [id, results[i]]))
    },
    enabled: unfulfilled.length > 0,
  })

  const lotsByCatalog: Record<number, AvailablePaperLot[]> = lotsQuery.data ?? {}

  function updateAlloc(itemId: number, patch: Partial<PaperAllocation>) {
    setAllocs(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  async function handleSubmit() {
    const outputs = unfulfilled.map(item => {
      const alloc = allocs[item.id]
      return {
        inventory_id: alloc.inventory_id,
        length_m:     parseFloat(alloc.length_m),
        width_m:      parseFloat(alloc.width_m),
      }
    }).filter(o => o.inventory_id > 0 && o.length_m > 0 && o.width_m > 0)

    if (!outputs.length) { toast.error('Completa al menos una asignación'); return }

    setSubmitting(true)
    const res = await fulfillPaperRequisition(req.id, outputs)
    if (res.error) toast.error(res.error)
    else { toast.success('Surtido registrado'); onClose() }
    setSubmitting(false)
  }

  if (lotsQuery.isLoading) {
    return <div className="py-12 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cargando bobinas…</div>
  }

  return (
    <>
      <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
        {unfulfilled.map(item => {
          const lots     = lotsByCatalog[item.paper_catalog_id] ?? []
          const alloc    = allocs[item.id]
          const m2Remain = (item.m2_requested ?? 0) - (item.m2_delivered ?? 0)
          const selLot   = lots.find(l => l.id === alloc?.inventory_id)
          const delLen   = parseFloat(alloc?.length_m || '0') || 0
          const delWid   = parseFloat(alloc?.width_m  || '0') || 0
          const delM2    = delLen * delWid
          const widthOk  = !selLot || delWid <= selLot.initial_width_m

          return (
            <div key={item.id} className="border border-border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">{item.paper_catalog?.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">{item.paper_catalog?.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Por surtir</p>
                  <p className="text-sm font-mono font-bold">{m2Remain.toFixed(3)} m²</p>
                  <p className="text-[9px] text-muted-foreground">
                    {item.length_m_requested.toFixed(3)} × {item.width_m_requested.toFixed(3)} m
                  </p>
                </div>
              </div>

              {lots.length === 0 ? (
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  <PackageSearch className="size-3.5 shrink-0" />
                  Sin bobinas disponibles con calidad APROBADA
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                      Bobina
                    </label>
                    <select
                      value={alloc?.inventory_id ?? 0}
                      onChange={e => updateAlloc(item.id, { inventory_id: Number(e.target.value) })}
                      className="w-full h-8 px-2 border border-foreground/20 bg-card text-[11px] outline-none focus:border-foreground/50"
                    >
                      <option value={0}>Seleccionar bobina…</option>
                      {lots.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.internal_batch} · {l.remaining_m2.toFixed(2)} m²
                          · {l.remaining_length_m.toFixed(3)} × {l.initial_width_m.toFixed(3)} m
                          {l.location ? ` · ${l.location}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Largo (m)
                      </label>
                      <input
                        type="number"
                        min={0.001}
                        step={0.001}
                        value={alloc?.length_m ?? ''}
                        onChange={e => updateAlloc(item.id, { length_m: e.target.value })}
                        className="w-full h-8 px-2 border border-foreground/20 bg-card text-[11px] outline-none focus:border-foreground/50 font-mono"
                      />
                      {selLot && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Disp: {selLot.remaining_length_m.toFixed(3)} m
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Ancho (m)
                      </label>
                      <input
                        type="number"
                        min={0.001}
                        step={0.001}
                        value={alloc?.width_m ?? ''}
                        onChange={e => updateAlloc(item.id, { width_m: e.target.value })}
                        className={cn(
                          'w-full h-8 px-2 border bg-card text-[11px] outline-none transition-colors font-mono',
                          !widthOk ? 'border-red-400' : 'border-foreground/20 focus:border-foreground/50',
                        )}
                      />
                      {selLot && (
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          Ancho bobina: {selLot.initial_width_m.toFixed(3)} m
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        M² a entregar
                      </label>
                      <div className="h-8 px-2 border border-border/50 bg-muted/40 flex items-center text-[11px] font-mono font-bold">
                        {delM2 > 0 ? delM2.toFixed(3) : '—'}
                      </div>
                    </div>
                  </div>

                  {!widthOk && (
                    <p className="text-[9px] text-red-600 font-bold">
                      El ancho supera el de la bobina ({selLot?.initial_width_m.toFixed(3)} m)
                    </p>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between">
        <button
          onClick={onClose}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
        <button
          disabled={submitting}
          onClick={handleSubmit}
          className="flex items-center gap-2 px-5 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
        >
          {submitting ? 'Registrando…' : 'Registrar surtido'}
        </button>
      </div>
    </>
  )
}

// ── Main dialog ───────────────────────────────────────────────────────────────

export function FulfillForm({ open, onClose, requisition }: Props) {
  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl bg-background border border-border p-0 gap-0">
        <DialogHeader className="px-6 py-5 border-b border-border/50">
          <DialogTitle className="font-heading text-lg font-bold tracking-tight">
            Surtir requisición #{requisition.requisition_number}
          </DialogTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
            {requisition.production_order}
          </p>
        </DialogHeader>

        {requisition.material_type === 'INK'
          ? <InkFulfillBody  req={requisition} onClose={onClose} />
          : <PaperFulfillBody req={requisition} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}
