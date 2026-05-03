'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PaperLot } from '@/actions/paper-inventory.actions'

export function DisponibleCell({ lot }: { lot: PaperLot }) {
  const initial    = lot.initial_m2      ?? 0
  const remaining  = lot.remaining_m2    ?? 0
  const lengthRem  = lot.remaining_length_m ?? 0
  const width      = lot.initial_width_m
  const lengthInit = lot.initial_length_m
  const pct        = initial > 0 ? remaining / initial : 0

  const barColor = pct > 0.7
    ? 'bg-green-500'
    : pct > 0.3
      ? 'bg-yellow-500'
      : 'bg-red-500'

  const pctColor = pct > 0.7
    ? 'text-green-700'
    : pct > 0.3
      ? 'text-yellow-700'
      : 'text-red-600'

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="space-y-1.5 min-w-36 cursor-default">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono font-bold text-[12px]">{lengthRem.toFixed(1)} m</span>
              <span className="font-mono text-[10px] text-[#5f5e59]">{remaining.toFixed(1)} m²</span>
            </div>
            <p className="font-mono text-[9px] text-[#5f5e59]">{width.toFixed(2)} m ancho</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-[#E5E1D8]">
                <div className={cn('h-full transition-all', barColor)} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
              </div>
              <span className={cn('font-mono text-[9px] font-bold tabular-nums w-8 text-right', pctColor)}>
                {(pct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[10px] space-y-0.5">
          <p>Inicial: {lengthInit.toFixed(2)} m × {width.toFixed(2)} m</p>
          <p>Inicial m²: {initial.toFixed(2)} m²</p>
          <p>Consumido: {(lot.used_m2 ?? 0).toFixed(2)} m²</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
