'use client'

import { useState, useMemo } from 'react'
import { History, PowerOff, FlaskConical, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { toast } from 'sonner'
import { disableLot, type InkLot } from '@/actions/ink-inventory.actions'
import { DisponibleCellInk } from './disponible-cell-ink'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { getLotStatusInfo } from './lot-utils'

type SortKey = 'batch' | 'ink' | 'remaining' | 'date' | 'status'

type Props = {
  lots:          InkLot[]
  canManage:     boolean
  canRequest:    boolean
  onHistory:     (id: number) => void
  onRequest:     (lot: InkLot) => void
  onLotDisabled: () => void
  sortKey:       SortKey
  sortDir:       'asc' | 'desc'
  onSort:        (key: SortKey) => void
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

export function InkLotsTableView({ lots, canManage, canRequest, onHistory, onRequest, onLotDisabled, sortKey, sortDir, onSort }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)
  const [disabling,  setDisabling]  = useState<number | null>(null)

  // oldest active lot per catalog → FIFO priority marker
  const fifoIds = useMemo(() => {
    const oldest = new Map<number, { id: number; date: string }>()
    for (const lot of lots) {
      if (!lot.enabled || !(lot.remaining_kg ?? 0) || !lot.receipt?.receipt_date || !lot.ink_catalog) continue
      const cur = oldest.get(lot.ink_catalog.id)
      if (!cur || lot.receipt.receipt_date < cur.date) {
        oldest.set(lot.ink_catalog.id, { id: lot.id, date: lot.receipt.receipt_date })
      }
    }
    return new Set(Array.from(oldest.values()).map(v => v.id))
  }, [lots])

  async function handleDisable(id: number) {
    setDisabling(id)
    const res = await disableLot(id)
    setDisabling(null)
    setConfirming(null)
    if (res.error) { toast.error(res.error); return }
    toast.success('Lote deshabilitado')
    onLotDisabled()
  }

  if (lots.length === 0) {
    return (
      <div className="border border-dashed border-border p-16 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          No hay lotes para mostrar
        </p>
      </div>
    )
  }

  return (
    <>
      <div id="ink-inv-table" className="border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-border/50">
              {([
                { label: 'Lote interno', key: 'batch'     },
                { label: 'Lote prov.',   key: null         },
                { label: 'Tinta',        key: 'ink'        },
                { label: 'Disponible',   key: 'remaining'  },
                { label: 'Recepción',    key: 'date'       },
                { label: 'Estado',       key: 'status'     },
                { label: '',             key: null         },
              ] as { label: string; key: SortKey | null }[]).map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && onSort(col.key)}
                  className={cn(
                    'px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap select-none',
                    col.key && 'cursor-pointer hover:text-foreground transition-colors'
                  )}
                >
                  {col.key ? (
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />
                        : <ArrowUpDown className="size-3 opacity-30" />}
                    </span>
                  ) : col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {lots.map(lot => {
              const statusInfo = getLotStatusInfo(lot)
              const isFifo     = fifoIds.has(lot.id)

              return (
                <tr
                  key={lot.id}
                  className={cn(
                    'transition-colors',
                    lot.enabled ? 'hover:bg-muted/30' : 'opacity-50 bg-muted/10'
                  )}
                >
                  {/* Lote interno */}
                  <td className="px-4 py-3 font-mono font-bold text-[11px]">
                    {lot.internal_batch}
                  </td>

                  {/* Lote proveedor */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-[11px]">{lot.receipt?.purchase_order_item?.purchase_order?.provider?.name ?? '—'}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{lot.receipt?.provider_batch ?? '—'}</p>
                  </td>

                  {/* Tinta */}
                  <td className="px-4 py-3">
                    <p className="font-mono text-[10px] text-muted-foreground">{lot.ink_catalog?.code}</p>
                    <p className="font-medium">{lot.ink_catalog?.name}</p>
                  </td>

                  {/* Disponible */}
                  <td className="px-4 py-3">
                    <DisponibleCellInk lot={lot} />
                  </td>

                  {/* Fecha recepción + FIFO marker */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {fmtDate(lot.receipt?.receipt_date)}
                    </p>
                    {isFifo && (
                      <span className="mt-0.5 inline-block text-[8px] font-bold uppercase tracking-widest px-1 py-px border border-orange-200 text-orange-600 bg-orange-50">
                        FIFO
                      </span>
                    )}
                  </td>

                  {/* Estado */}
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border',
                      statusInfo.cls
                    )}>
                      {statusInfo.label}
                    </span>
                  </td>

                  {/* Acciones */}
                  <td id={lots.indexOf(lot) === 0 ? 'ink-inv-row-actions' : undefined} className="px-4 py-3">
                    <TooltipProvider>
                      <div className="flex items-center gap-0.5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button onClick={() => onHistory(lot.id)} className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded">
                              <History className="size-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Historial</TooltipContent>
                        </Tooltip>

                        {canRequest && lot.enabled && (lot.remaining_kg ?? 0) > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button onClick={() => onRequest(lot)} className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors rounded">
                                <FlaskConical className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Solicitar material</TooltipContent>
                          </Tooltip>
                        )}

                        {canManage && lot.enabled && (
                          confirming === lot.id ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">¿Confirmar?</span>
                              <button onClick={() => handleDisable(lot.id)} disabled={disabling === lot.id} className="text-[9px] font-bold uppercase tracking-widest text-red-600 hover:text-red-800 disabled:opacity-50">Sí</button>
                              <button onClick={() => setConfirming(null)} className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground">No</button>
                            </div>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button onClick={() => setConfirming(lot.id)} className="p-1.5 text-muted-foreground hover:text-red-600 transition-colors rounded">
                                  <PowerOff className="size-3.5" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Deshabilitar lote</TooltipContent>
                            </Tooltip>
                          )
                        )}
                      </div>
                    </TooltipProvider>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}
