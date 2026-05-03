'use client'

import { useState } from 'react'
import { ChevronRight, History, PowerOff, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { disablePaperLot, type PaperLot } from '@/actions/paper-inventory.actions'
import { LotProgressBar }  from '../shared/lot-progress-bar'
import { LotLocationEdit } from './lot-location-edit'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

type Props = {
  lots:          PaperLot[]
  canManage:     boolean
  canRequest:    boolean
  onHistory:     (id: number) => void
  onRequest:     (lot: PaperLot) => void
  onLotDisabled: () => void
}

type CatalogGroup = {
  catalogId:    number
  code:         string
  name:         string
  weightGsm:    number | null
  minStockM2:   number
  totalM2:      number
  activeCount:  number
  lots:         PaperLot[]
}

function stockBadge(totalM2: number, minM2: number) {
  if (totalM2 <= 0)       return { label: 'Sin stock', cls: 'border-red-200    text-red-700    bg-red-50'    }
  if (totalM2 < minM2)    return { label: 'Bajo',      cls: 'border-yellow-200 text-yellow-700 bg-yellow-50' }
  return                         { label: 'OK',         cls: 'border-green-200  text-green-700  bg-green-50'  }
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function buildGroups(lots: PaperLot[]): CatalogGroup[] {
  const map = new Map<number, CatalogGroup>()

  for (const lot of lots) {
    if (!lot.paper_catalog) continue
    const c = lot.paper_catalog
    let g = map.get(c.id)
    if (!g) {
      g = {
        catalogId:   c.id,
        code:        c.code,
        name:        c.name,
        weightGsm:   c.weight_gsm,
        minStockM2:  c.min_stock_m2 ?? 0,
        totalM2:     0,
        activeCount: 0,
        lots:        [],
      }
      map.set(c.id, g)
    }
    g.lots.push(lot)
    if (lot.enabled && (lot.remaining_m2 ?? 0) > 0) {
      g.totalM2     += lot.remaining_m2 ?? 0
      g.activeCount += 1
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

export function PaperCatalogGroupView({ lots, canManage, canRequest, onHistory, onRequest, onLotDisabled }: Props) {
  const [expanded,   setExpanded]   = useState<Set<number>>(new Set())
  const [confirming, setConfirming] = useState<number | null>(null)
  const [disabling,  setDisabling]  = useState<number | null>(null)

  const groups = buildGroups(lots)

  async function handleDisable(id: number) {
    setDisabling(id)
    const res = await disablePaperLot(id)
    setDisabling(null)
    setConfirming(null)
    if (res.error) { toast.error(res.error); return }
    toast.success('Bobina deshabilitada')
    onLotDisabled()
  }

  function toggle(id: number) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (groups.length === 0) {
    return (
      <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          No hay bobinas para mostrar
        </p>
      </div>
    )
  }

  return (
    <div className="border border-[#1A1A1A]/15 divide-y divide-[#1A1A1A]/10">
      {groups.map(g => {
        const open  = expanded.has(g.catalogId)
        const badge = stockBadge(g.totalM2, g.minStockM2)

        return (
          <div key={g.catalogId}>
            {/* ── Catalog header ─────────────────────────────────────────────── */}
            <button
              onClick={() => toggle(g.catalogId)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#E5E1D8]/40 transition-colors"
            >
              <ChevronRight className={cn('size-3.5 text-[#5f5e59] transition-transform shrink-0', open && 'rotate-90')} />

              <span className="flex-1 flex items-baseline gap-2 min-w-0">
                <span className="font-mono text-[10px] text-[#5f5e59] shrink-0">{g.code}</span>
                <span className="font-medium text-sm truncate">{g.name}</span>
                {g.weightGsm && (
                  <span className="font-mono text-[9px] text-[#5f5e59] shrink-0">{g.weightGsm} g/m²</span>
                )}
              </span>

              <span className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] font-mono text-[#5f5e59]">
                  {g.totalM2.toFixed(1)} m²
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  {g.activeCount} {g.activeCount === 1 ? 'bobina' : 'bobinas'}
                </span>
                <span className={cn('text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border', badge.cls)}>
                  {badge.label}
                </span>
              </span>
            </button>

            {/* ── Expanded sub-table ─────────────────────────────────────────── */}
            {open && (
              <div className="border-t border-[#1A1A1A]/8 bg-[#E5E1D8]/15 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1A1A1A]/10">
                      {['Lote interno', 'Lote prov.', 'Inicial', 'Restante m²', 'Ubicación', 'Recepción', 'Estado', ''].map(h => (
                        <th key={h} className="pl-8 pr-4 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] whitespace-nowrap first:pl-12">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A1A1A]/8">
                    {g.lots.map(lot => (
                      <tr
                        key={lot.id}
                        className={cn(
                          'transition-colors',
                          lot.enabled ? 'hover:bg-[#E5E1D8]/30' : 'opacity-50 bg-[#E5E1D8]/10'
                        )}
                      >
                        <td className="pl-12 pr-4 py-2.5 font-mono font-bold text-[11px]">
                          {lot.internal_batch}
                        </td>

                        <td className="px-4 py-2.5 font-mono text-[11px] text-[#5f5e59]">
                          {(lot.receipt as any)?.provider_batch ?? '—'}
                        </td>

                        <td className="px-4 py-2.5 font-mono text-[11px] text-[#5f5e59] whitespace-nowrap">
                          {lot.initial_length_m.toFixed(2)}m × {lot.initial_width_m.toFixed(2)}m
                        </td>

                        <td className="px-4 py-2.5">
                          <LotProgressBar
                            initial={lot.initial_m2 ?? 0}
                            used={lot.used_m2 ?? 0}
                            unit="m²"
                          />
                        </td>

                        <td className="px-4 py-2.5">
                          <LotLocationEdit
                            inventoryId={lot.id}
                            value={lot.location}
                            canEdit={canManage}
                          />
                        </td>

                        <td className="px-4 py-2.5 font-mono text-[11px] text-[#5f5e59] whitespace-nowrap">
                          {fmtDate((lot.receipt as any)?.receipt_date)}
                        </td>

                        <td className="px-4 py-2.5">
                          <span className={cn(
                            'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border',
                            lot.enabled
                              ? 'border-green-200 text-green-700 bg-green-50'
                              : 'border-[#1A1A1A]/20 text-[#5f5e59] bg-[#E5E1D8]/40'
                          )}>
                            {lot.enabled ? 'Activa' : 'Deshabilitada'}
                          </span>
                        </td>

                        <td className="px-4 py-2.5">
                          <TooltipProvider>
                            <div className="flex items-center gap-0.5">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button onClick={() => onHistory(lot.id)} className="p-1.5 text-[#5f5e59] hover:text-[#1A1A1A] transition-colors rounded">
                                    <History className="size-3.5" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Historial</TooltipContent>
                              </Tooltip>

                              {canRequest && lot.enabled && (lot.remaining_m2 ?? 0) > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button onClick={() => onRequest(lot)} className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors rounded">
                                      <Layers className="size-3.5" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>Solicitar material</TooltipContent>
                                </Tooltip>
                              )}

                              {canManage && lot.enabled && (
                                confirming === lot.id ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">¿Confirmar?</span>
                                    <button onClick={() => handleDisable(lot.id)} disabled={disabling === lot.id} className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 disabled:opacity-50">Sí</button>
                                    <button onClick={() => setConfirming(null)} className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A]">No</button>
                                  </div>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button onClick={() => setConfirming(lot.id)} className="p-1.5 text-[#5f5e59] hover:text-red-600 transition-colors rounded">
                                        <PowerOff className="size-3.5" />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>Deshabilitar bobina</TooltipContent>
                                  </Tooltip>
                                )
                              )}
                            </div>
                          </TooltipProvider>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
