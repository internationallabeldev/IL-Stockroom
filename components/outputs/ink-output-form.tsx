'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { PackageSearch, Plus, X } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { getAvailableInkLotsForItem, createInkOutput } from '@/actions/outputs.actions'
import type { Requisition, AvailableInkLot } from '@/actions/requisitions.actions'

type Alloc = {
  ink_inventory_id: number
  kg_delivered:     string
}

type Props = {
  open:        boolean
  onClose:     () => void
  requisition: Requisition
}

export function InkOutputForm({ open, onClose, requisition }: Props) {
  const unfulfilled = requisition.ink_items.filter(it => !it.is_fulfilled)

  const [allocs, setAllocs] = useState<Record<number, Alloc[]>>({})
  const [submitting, setSubmitting] = useState(false)

  // Reset allocs when requisition changes or sheet opens
  useEffect(() => {
    if (open) {
      setAllocs(Object.fromEntries(
        unfulfilled.map(it => [it.id, [{ ink_inventory_id: 0, kg_delivered: '' }]])
      ))
    }
  }, [open, requisition.id])

  const catalogIds = [...new Set(unfulfilled.map(it => it.ink_catalog_id))]

  const lotsQuery = useQuery({
    queryKey: ['avail-ink-lots', catalogIds.join(',')],
    queryFn:  async () => {
      const results = await Promise.all(catalogIds.map(id => getAvailableInkLotsForItem(id)))
      return Object.fromEntries(catalogIds.map((id, i) => [id, results[i]])) as Record<number, AvailableInkLot[]>
    },
    enabled: open && unfulfilled.length > 0,
  })

  const lotsByCatalog = lotsQuery.data ?? {}

  function addAlloc(itemId: number) {
    setAllocs(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] ?? []), { ink_inventory_id: 0, kg_delivered: '' }],
    }))
  }

  function removeAlloc(itemId: number, idx: number) {
    setAllocs(prev => ({ ...prev, [itemId]: prev[itemId].filter((_, i) => i !== idx) }))
  }

  function updateAlloc(itemId: number, idx: number, patch: Partial<Alloc>) {
    setAllocs(prev => ({
      ...prev,
      [itemId]: prev[itemId].map((a, i) => i === idx ? { ...a, ...patch } : a),
    }))
  }

  async function handleSubmit() {
    const outputs = Object.values(allocs).flat().filter(
      a => a.ink_inventory_id > 0 && parseFloat(a.kg_delivered) > 0
    )

    if (!outputs.length) { toast.error('Agrega al menos una entrega'); return }

    setSubmitting(true)
    let hasError = false

    for (const o of outputs) {
      const res = await createInkOutput({
        requisition_id:   requisition.id,
        ink_inventory_id: o.ink_inventory_id,
        kg_delivered:     parseFloat(o.kg_delivered),
      })
      if (res.error) { toast.error(res.error); hasError = true; break }
    }

    if (!hasError) {
      const allItems    = requisition.ink_items
      const allDelivered = allItems.every(it => it.is_fulfilled)
      toast.success(
        allDelivered
          ? 'Requisición completada — todo el material fue entregado'
          : 'Surtido registrado'
      )
      onClose()
    }
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
            Surtir tinta — Req. #{requisition.requisition_number}
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
              Cargando lotes…
            </p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {unfulfilled.map(item => {
                const lots      = lotsByCatalog[item.ink_catalog_id] ?? []
                const remaining = item.kg_requested - (item.kg_delivered ?? 0)
                const itemAllocs = allocs[item.id] ?? []
                const allocated  = itemAllocs.reduce((s, a) => s + (parseFloat(a.kg_delivered) || 0), 0)
                const overAlloc  = allocated > remaining

                return (
                  <div key={item.id} className="border border-[#1A1A1A]/15 bg-[#E5E1D8]/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#1A1A1A]">{item.ink_catalog?.name}</p>
                        <p className="text-[10px] font-mono text-[#5f5e59]">{item.ink_catalog?.code}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Por surtir</p>
                        <p className="text-sm font-mono font-bold text-[#1A1A1A]">{remaining.toFixed(2)} kg</p>
                      </div>
                    </div>

                    {lots.length === 0 ? (
                      <div className="flex items-center gap-2 text-amber-700 text-[10px] font-bold bg-amber-50 border border-amber-200 px-3 py-2">
                        <PackageSearch className="size-3.5 shrink-0" />
                        Sin lotes disponibles con calidad APROBADA
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {itemAllocs.map((alloc, idx) => {
                          const selLot = lots.find(l => l.id === alloc.ink_inventory_id)
                          return (
                            <div key={idx} className="grid grid-cols-[1fr_110px_auto] gap-2 items-end">
                              <div>
                                {idx === 0 && (
                                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Lote</label>
                                )}
                                <select
                                  value={alloc.ink_inventory_id}
                                  onChange={e => updateAlloc(item.id, idx, { ink_inventory_id: Number(e.target.value) })}
                                  className="w-full h-8 px-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] text-[11px] outline-none focus:border-[#1A1A1A]/40"
                                >
                                  <option value={0}>Seleccionar lote…</option>
                                  {lots.map(l => (
                                    <option key={l.id} value={l.id}>
                                      {l.internal_batch} · {l.remaining_kg.toFixed(2)} kg{l.location ? ` · ${l.location}` : ''}
                                    </option>
                                  ))}
                                </select>
                                {selLot && (
                                  <p className="text-[9px] text-[#5f5e59] mt-0.5">
                                    Disponible: {selLot.remaining_kg.toFixed(2)} kg
                                  </p>
                                )}
                              </div>

                              <div>
                                {idx === 0 && (
                                  <label className="block text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">Kg a entregar</label>
                                )}
                                <input
                                  type="number" min={0.01} step={0.01}
                                  value={alloc.kg_delivered}
                                  onChange={e => updateAlloc(item.id, idx, { kg_delivered: e.target.value })}
                                  placeholder="0.00"
                                  className={cn(
                                    'w-full h-8 px-2 border bg-[#fdf9f0] text-[11px] outline-none font-mono transition-colors',
                                    selLot && parseFloat(alloc.kg_delivered) > selLot.remaining_kg
                                      ? 'border-red-400'
                                      : 'border-[#1A1A1A]/20 focus:border-[#1A1A1A]/40'
                                  )}
                                />
                              </div>

                              <div className={idx === 0 ? 'pt-5' : ''}>
                                {itemAllocs.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeAlloc(item.id, idx)}
                                    className="h-8 w-8 flex items-center justify-center border border-[#1A1A1A]/20 text-[#5f5e59] hover:text-red-600 hover:border-red-400 transition-colors"
                                  >
                                    <X className="size-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      {lots.length > 0 && (
                        <button
                          type="button"
                          onClick={() => addAlloc(item.id)}
                          className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A]"
                        >
                          <Plus className="size-3" /> Otro lote
                        </button>
                      )}
                      <p className={cn(
                        'text-[10px] font-bold uppercase tracking-widest ml-auto',
                        overAlloc ? 'text-red-600' : 'text-[#5f5e59]',
                      )}>
                        Asignado: {allocated.toFixed(2)} / {remaining.toFixed(2)} kg
                        {overAlloc && ' (excede lo solicitado)'}
                      </p>
                    </div>
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
