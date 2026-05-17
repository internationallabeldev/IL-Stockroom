'use client'

import { useState } from 'react'
import { History, PowerOff, FlaskConical } from 'lucide-react'
import { toast } from 'sonner'
import { disableLot, type InkLot } from '@/actions/ink-inventory.actions'
import { DisponibleCellInk } from './disponible-cell-ink'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type Props = {
  lots:         InkLot[]
  canManage:    boolean
  canRequest:   boolean
  onHistory:    (id: number) => void
  onRequest:    (lot: InkLot) => void
  onLotDisabled:() => void
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

export function InkLotsTableView({ lots, canManage, canRequest, onHistory, onRequest, onLotDisabled }: Props) {
  const [confirming, setConfirming] = useState<number | null>(null)
  const [disabling,  setDisabling]  = useState<number | null>(null)

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
      <div className="border border-border overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/60 border-b border-border/50">
              {[
                'Lote interno', 'Lote prov.', 'Tinta', 'Disponible',
                'Recepción', 'Estado', '',
              ].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {lots.map(lot => (
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

                {/* Fecha recepción */}
                <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                  {fmtDate(lot.receipt?.receipt_date)}
                </td>

                {/* Estado */}
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 border',
                    lot.enabled
                      ? 'border-green-200 text-green-700 bg-green-50'
                      : 'border-border text-muted-foreground bg-muted/40'
                  )}>
                    {lot.enabled ? 'Activo' : 'Deshabilitado'}
                  </span>
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
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
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
