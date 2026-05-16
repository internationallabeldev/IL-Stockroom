'use client'

import { useState } from 'react'
import { RotateCcw, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { InkOutputRecord, PaperOutputRecord } from '@/actions/requisitions.actions'
import { InkReturnForm, PaperReturnForm } from './return-form'

type Props = {
  inkOutputs:   InkOutputRecord[]
  paperOutputs: PaperOutputRecord[]
  canManage:    boolean
  onReturnDone: () => void
}

export function OutputsHistory({ inkOutputs, paperOutputs, canManage, onReturnDone }: Props) {
  const [returnInk,   setReturnInk]   = useState<InkOutputRecord | null>(null)
  const [returnPaper, setReturnPaper] = useState<PaperOutputRecord | null>(null)

  const hasOutputs = inkOutputs.length > 0 || paperOutputs.length > 0

  return (
    <>
      <section className="border border-[#1A1A1A]/15">
        <div className="px-4 py-2.5 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30 flex items-center gap-2">
          <Package className="size-3.5 text-[#5f5e59]" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
            Historial de salidas
          </p>
        </div>

        {!hasOutputs ? (
          <div className="px-4 py-6 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]/60">
              Sin salidas registradas
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#1A1A1A]/08">
            {inkOutputs.map(out => {
              const returned    = out.kg_returned ?? 0
              const hasReturn   = returned > 0
              const canReturn   = canManage && !hasReturn
              const statusColor = hasReturn
                ? returned >= out.kg_delivered ? 'bg-[#5f5e59]/30 text-[#5f5e59]' : 'bg-amber-100 text-amber-800'
                : 'bg-green-100 text-green-800'
              const statusLabel = hasReturn
                ? returned >= out.kg_delivered ? 'Devuelto' : 'Dev. parcial'
                : 'Entregado'

              return (
                <div key={out.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1A1A1A] truncate">
                        {out.ink_inventory?.ink_catalog?.name ?? 'Tinta'}
                      </p>
                      <p className="text-[9px] font-mono text-[#5f5e59]">
                        Lote: {out.ink_inventory?.internal_batch ?? '—'}
                      </p>
                    </div>
                    <span className={cn('shrink-0 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5', statusColor)}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-[#1A1A1A]">{out.kg_delivered.toFixed(2)} kg entregados</p>
                      {hasReturn && (
                        <p className="font-bold text-green-700 flex items-center gap-1">
                          <RotateCcw className="size-2.5" />
                          {returned.toFixed(2)} kg devueltos
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#5f5e59]">{fmtDate(out.output_date)}</p>
                      {out.delivered_by_user && (
                        <p className="text-[#5f5e59]">
                          {out.delivered_by_user.first_name} {out.delivered_by_user.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {canReturn && (
                    <button
                      onClick={() => setReturnInk(out)}
                      className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] flex items-center gap-1 mt-0.5"
                    >
                      <RotateCcw className="size-2.5" />
                      Registrar devolución
                    </button>
                  )}
                </div>
              )
            })}

            {paperOutputs.map(out => {
              const m2Ret     = out.m2_returned ?? 0
              const m2Del     = out.m2_delivered ?? 0
              const hasReturn = m2Ret > 0
              const canReturn = canManage && !hasReturn
              const statusColor = hasReturn
                ? m2Ret >= m2Del ? 'bg-[#5f5e59]/30 text-[#5f5e59]' : 'bg-amber-100 text-amber-800'
                : 'bg-green-100 text-green-800'
              const statusLabel = hasReturn
                ? m2Ret >= m2Del ? 'Devuelto' : 'Dev. parcial'
                : 'Entregado'

              return (
                <div key={out.id} className="px-4 py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-[#1A1A1A] truncate">
                        {out.paper_inventory?.paper_catalog?.name ?? 'Papel'}
                      </p>
                      <p className="text-[9px] font-mono text-[#5f5e59]">
                        Lote: {out.paper_inventory?.internal_batch ?? '—'}
                      </p>
                    </div>
                    <span className={cn('shrink-0 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5', statusColor)}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px]">
                    <div className="space-y-0.5">
                      <p className="font-mono font-bold text-[#1A1A1A]">
                        {m2Del.toFixed(3)} m²
                        <span className="font-normal text-[#5f5e59] ml-1">
                          ({out.length_m_delivered.toFixed(3)} × {out.width_m_delivered.toFixed(3)} m)
                        </span>
                      </p>
                      {hasReturn && (
                        <p className="font-bold text-green-700 flex items-center gap-1">
                          <RotateCcw className="size-2.5" />
                          {m2Ret.toFixed(3)} m² devueltos
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-[#5f5e59]">{fmtDate(out.output_date)}</p>
                      {out.delivered_by_user && (
                        <p className="text-[#5f5e59]">
                          {out.delivered_by_user.first_name} {out.delivered_by_user.last_name}
                        </p>
                      )}
                    </div>
                  </div>

                  {canReturn && (
                    <button
                      onClick={() => setReturnPaper(out)}
                      className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] hover:text-[#1A1A1A] flex items-center gap-1 mt-0.5"
                    >
                      <RotateCcw className="size-2.5" />
                      Registrar devolución
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {returnInk && (
        <InkReturnForm
          output={returnInk}
          open={!!returnInk}
          onClose={() => setReturnInk(null)}
          onSuccess={onReturnDone}
        />
      )}
      {returnPaper && (
        <PaperReturnForm
          output={returnPaper}
          open={!!returnPaper}
          onClose={() => setReturnPaper(null)}
          onSuccess={onReturnDone}
        />
      )}
    </>
  )
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: '2-digit' })
}
