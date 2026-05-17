'use client'

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { InkLot } from '@/actions/ink-inventory.actions'

export function DisponibleCellInk({ lot }: { lot: InkLot }) {
  const initial   = lot.initial_kg   ?? 0
  const used      = lot.used_kg      ?? 0
  const remaining = lot.remaining_kg ?? 0
  const pct       = initial > 0 ? remaining / initial : 0

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
          <div className="space-y-1.5 min-w-32 cursor-default">
            <span className="font-mono font-bold text-[12px]">{remaining.toFixed(2)} kg</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted">
                <div className={cn('h-full transition-all', barColor)} style={{ width: `${Math.min(pct * 100, 100)}%` }} />
              </div>
              <span className={cn('font-mono text-[9px] font-bold tabular-nums w-8 text-right', pctColor)}>
                {(pct * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-[10px] space-y-0.5">
          <p>Inicial: {initial.toFixed(2)} kg</p>
          <p>Consumido: {used.toFixed(2)} kg</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
