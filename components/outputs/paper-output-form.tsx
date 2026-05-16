'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PackageSearch, ChevronDown, ChevronUp } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getAvailablePaperLotsForItem, createPaperOutput } from '@/actions/outputs.actions'
import type { Requisition, AvailablePaperLot, RequisitionPaperItem } from '@/actions/requisitions.actions'

type Alloc = {
  paper_inventory_id: number
  length_m_delivered: string
  width_m_delivered:  string
  generates_split:    boolean
  split_a_batch:      string
  split_a_location:   string
  split_b_batch:      string
  split_b_location:   string
}

type Props = {
  open:        boolean
  onClose:     () => void
  requisition: Requisition
}

export function PaperOutputForm({ open, onClose, requisition }: Props) {
  const unfulfilled = requisition.paper_items.filter(it => !it.is_fulfilled)

  const [allocs, setAllocs] = useState<Record<number, Alloc>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setAllocs(Object.fromEntries(
        unfulfilled.map(it => [it.id, mkAlloc(it)])
      ))
    }
  }, [open, requisition.id])

  function mkAlloc(it: RequisitionPaperItem): Alloc {
    return {
      paper_inventory_id: 0,
      length_m_delivered: it.length_m_requested.toFixed(3),
      width_m_delivered:  it.width_m_requested.toFixed(3),
      generates_split:    false,
      split_a_batch:      '',
      split_a_location:   '',
      split_b_batch:      '',
      split_b_location:   '',
    }
  }

  const catalogIds = [...new Set(unfulfilled.map(it => it.paper_catalog_id))]

  const lotsQuery = useQuery({
    queryKey: ['avail-paper-lots', catalogIds.join(',')],
    queryFn:  async () => {
      const results = await Promise.all(catalogIds.map(id => getAvailablePaperLotsForItem(id)))
      return Object.fromEntries(catalogIds.map((id, i) => [id, results[i]])) as Record<number, AvailablePaperLot[]>
    },
    enabled: open && unfulfilled.length > 0,
  })

  const lotsByCatalog = lotsQuery.data ?? {}

  function update(itemId: number, patch: Partial<Alloc>) {
    setAllocs(prev => ({ ...prev, [itemId]: { ...prev[itemId], ...patch } }))
  }

  function handleLotChange(itemId: number, lotId: number, lots: AvailablePaperLot[]) {
    const lot = lots.find(l => l.id === lotId)
    const batch = lot?.internal_batch ?? ''
    update(itemId, {
      paper_inventory_id: lotId,
      split_a_batch:      batch ? `${batch}-A` : '',
      split_b_batch:      batch ? `${batch}-B` : '',
    })
  }

  async function handleSubmit() {
    const entries = unfulfilled.map(item => ({ item, alloc: allocs[item.id] }))
      .filter(({ alloc }) => alloc?.paper_inventory_id > 0)

    if (!entries.length) { toast.error('Selecciona al menos una bobina'); return }

    setSubmitting(true)
    let allFulfilled = true

    for (const { item, alloc } of entries) {
      const len = parseFloat(alloc.length_m_delivered)
      const wid = parseFloat(alloc.width_m_delivered)

      if (!len || !wid) { toast.error(`Dimensiones inválidas para ${item.paper_catalog?.name}`); setSubmitting(false); return }

      const res = await createPaperOutput({
        requisition_id:     requisition.id,
        paper_inventory_id: alloc.paper_inventory_id,
        length_m_delivered: len,
        width_m_delivered:  wid,
        generates_split:    alloc.generates_split,
        split_lot_a:        alloc.generates_split ? { internal_batch: alloc.split_a_batch, location: alloc.split_a_location || undefined } : undefined,
        split_lot_b:        alloc.generates_split ? { internal_batch: alloc.split_b_batch, location: alloc.split_b_location || undefined } : undefined,
        notes:              undefined,
      })

      if (res.error) { toast.error(res.error); setSubmitting(false); return }

      const newM2 = (item.m2_delivered ?? 0) + len * wid
      if (item.m2_requested && newM2 < item.m2_requested) allFulfilled = false
    }

    toast.success(
      allFulfilled
        ? 'Requisición completada — todo el material fue entregado'
        : 'Surtido registrado'
    )
    onClose()
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl bg-[#F5F2EA] border-l border-[#1A1A1A]/15 p-0 flex flex-col gap-0"
      >
        <SheetHeader className="px-6 py-5 border-b border-[#1A1A1A]/10 shrink-0">
          <SheetTitle className="font-heading text-lg font-bold tracking-tight text-[#1A1A1A]">
            Surtir papel — Req. #{requisition.requisition_number}
          </SheetTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            {requisition.production_order}
          </p>
        </SheetHeader>

        {unfulfilled.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
              Todos los ítems ya fueron entregados
            </p>
          </div>
        ) : lotsQuery.isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] animate-pulse">
              Cargando bobinas…
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {unfulfilled.map(item => {
                const lots  = lotsByCatalog[item.paper_catalog_id] ?? []
                const alloc = allocs[item.id]
                if (!alloc) return null

                const selLot   = lots.find(l => l.id === alloc.paper_inventory_id)
                const len      = parseFloat(alloc.length_m_delivered) || 0
                const wid      = parseFloat(alloc.width_m_delivered) || 0
                const m2       = len * wid
                const widthOk  = !selLot || wid <= selLot.initial_width_m
                const m2Remain = (item.m2_requested ?? 0) - (item.m2_delivered ?? 0)

                const remWidth = selLot
                  ? selLot.initial_width_m - wid
                  : 0

                return (
                  <div key={item.id} className="border border-[#1A1A1A]/15 bg-[#E5E1D8]/10 p-4 space-y-3">
                    {/* Item header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{item.paper_catalog?.name}</p>
                        <p className="text-[10px] font-mono text-[#5f5e59]">{item.paper_catalog?.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Por surtir</p>
                        <p className="text-sm font-mono font-bold text-[#1A1A1A]">{m2Remain.toFixed(3)} m²</p>
                        <p className="text-[9px] text-[#5f5e59]">
                          {item.length_m_requested.toFixed(3)} × {item.width_m_requested.toFixed(3)} m
                        </p>
                      </div>
                    </div>

                    {lots.length === 0 ? (
                      <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold bg-amber-50 border border-amber-200 px-3 py-2">
                        <PackageSearch className="size-3.5 shrink-0" />
                        Sin bobinas disponibles con calidad APROBADA
                      </div>
                    ) : (
                      <>
                        {/* Lot select */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Bobina</label>
                          <select
                            value={alloc.paper_inventory_id}
                            onChange={e => handleLotChange(item.id, Number(e.target.value), lots)}
                            className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-[11px] outline-none focus:border-[#1A1A1A]/40"
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

                        {/* Dimensions */}
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Largo (m)</label>
                            <input
                              type="number" min={0.001} step={0.001}
                              value={alloc.length_m_delivered}
                              onChange={e => update(item.id, { length_m_delivered: e.target.value })}
                              className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-[11px] outline-none focus:border-[#1A1A1A]/40 font-mono"
                            />
                            {selLot && (
                              <p className="text-[9px] text-[#5f5e59] mt-0.5">
                                Disp: {selLot.remaining_length_m.toFixed(3)} m
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Ancho (m)</label>
                            <input
                              type="number" min={0.001} step={0.001}
                              value={alloc.width_m_delivered}
                              onChange={e => update(item.id, { width_m_delivered: e.target.value })}
                              className={cn(
                                'w-full h-8 px-2 border bg-[#fdf9f0] text-[11px] outline-none transition-colors font-mono',
                                !widthOk ? 'border-red-400' : 'border-[#1A1A1A]/20 focus:border-[#1A1A1A]/40'
                              )}
                            />
                            {selLot && (
                              <p className={cn('text-[9px] mt-0.5', !widthOk ? 'text-red-600 font-bold' : 'text-[#5f5e59]')}>
                                Bobina: {selLot.initial_width_m.toFixed(3)} m
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">M² a entregar</label>
                            <div className="h-8 px-2 border border-[#1A1A1A]/10 bg-[#E5E1D8]/40 flex items-center text-[11px] font-mono font-bold text-[#1A1A1A]">
                              {m2 > 0 ? m2.toFixed(3) : '—'}
                            </div>
                          </div>
                        </div>

                        {!widthOk && (
                          <p className="text-[9px] text-red-600 font-bold">
                            El ancho supera el de la bobina ({selLot?.initial_width_m.toFixed(3)} m)
                          </p>
                        )}

                        {/* Split toggle — only when width < lot width */}
                        {selLot && wid > 0 && wid < selLot.initial_width_m && (
                          <div className="border border-[#1A1A1A]/10 bg-[#fdf9f0]">
                            <button
                              type="button"
                              onClick={() => update(item.id, { generates_split: !alloc.generates_split })}
                              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]"
                            >
                              <span>¿Hay corte de ancho?</span>
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'text-[9px] px-2 py-0.5 font-bold',
                                  alloc.generates_split ? 'bg-[#1A1A1A] text-[#F5F2EA]' : 'bg-[#1A1A1A]/10 text-[#5f5e59]'
                                )}>
                                  {alloc.generates_split ? 'Sí' : 'No'}
                                </span>
                                {alloc.generates_split ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                              </div>
                            </button>

                            {alloc.generates_split && (
                              <div className="px-3 pb-3 pt-1 space-y-3 border-t border-[#1A1A1A]/10">
                                <p className="text-[9px] text-[#5f5e59]">
                                  Ancho restante de la bobina: <span className="font-mono font-bold text-[#1A1A1A]">{remWidth.toFixed(3)} m</span>
                                </p>

                                {/* Lot A */}
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                                    Lote A — Resto de bobina ({selLot.remaining_length_m.toFixed(3)} × {remWidth.toFixed(3)} m)
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[9px] text-[#5f5e59] mb-0.5">Código de lote *</label>
                                      <input
                                        type="text"
                                        value={alloc.split_a_batch}
                                        onChange={e => update(item.id, { split_a_batch: e.target.value })}
                                        placeholder="ej. L001-A"
                                        className="w-full h-7 px-2 border border-[#1A1A1A]/20 bg-white text-[11px] font-mono outline-none focus:border-[#1A1A1A]/40"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] text-[#5f5e59] mb-0.5">Ubicación</label>
                                      <input
                                        type="text"
                                        value={alloc.split_a_location}
                                        onChange={e => update(item.id, { split_a_location: e.target.value })}
                                        placeholder="Rack, estante…"
                                        className="w-full h-7 px-2 border border-[#1A1A1A]/20 bg-white text-[11px] outline-none focus:border-[#1A1A1A]/40"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Lot B */}
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                                    Lote B — Entregado a producción ({len.toFixed(3)} × {wid.toFixed(3)} m)
                                  </p>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[9px] text-[#5f5e59] mb-0.5">Código de lote *</label>
                                      <input
                                        type="text"
                                        value={alloc.split_b_batch}
                                        onChange={e => update(item.id, { split_b_batch: e.target.value })}
                                        placeholder="ej. L001-B"
                                        className="w-full h-7 px-2 border border-[#1A1A1A]/20 bg-white text-[11px] font-mono outline-none focus:border-[#1A1A1A]/40"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[9px] text-[#5f5e59] mb-0.5">Ubicación</label>
                                      <input
                                        type="text"
                                        value={alloc.split_b_location}
                                        onChange={e => update(item.id, { split_b_location: e.target.value })}
                                        placeholder="Rack, estante…"
                                        className="w-full h-7 px-2 border border-[#1A1A1A]/20 bg-white text-[11px] outline-none focus:border-[#1A1A1A]/40"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="shrink-0 px-6 py-4 border-t border-[#1A1A1A]/10 flex items-center justify-between">
              <button
                onClick={onClose}
                className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A]"
              >
                Cancelar
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 px-5 py-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
              >
                {submitting ? 'Registrando…' : 'Confirmar entrega'}
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
