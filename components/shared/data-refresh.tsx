'use client'

import { useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

type Props = {
  /** `dataUpdatedAt` from React Query (ms epoch of last successful fetch). */
  updatedAt: number
  /** `isFetching` from React Query — drives the spinner. */
  isFetching: boolean
  /** `refetch` from React Query, or any manual refresh handler. */
  onRefresh: () => void
  className?: string
}

function formatAgo(ms: number): string {
  if (!ms) return 'ahora'
  const s = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (s < 5)  return 'ahora'
  if (s < 60) return `hace ${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  return `hace ${h} h`
}

/**
 * Freshness indicator + manual refresh control for list toolbars.
 * Shows a refresh icon (spins while fetching) + the relative time of the last
 * fetch ("hace Xs"). Communicates auto-refresh AND lets the user force one.
 */
export function DataRefresh({ updatedAt, isFetching, onRefresh, className }: Props) {
  // Re-render every 10s so the relative time stays current between fetches.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      title="Actualizar ahora"
      className={cn(
        'flex items-center gap-1.5 h-8 px-2.5 border border-border transition-colors',
        'text-muted-foreground hover:text-foreground hover:border-foreground/40',
        'disabled:cursor-default disabled:hover:text-muted-foreground disabled:hover:border-border',
        className,
      )}
    >
      <RefreshCw className={cn('size-3.5 shrink-0', isFetching && 'animate-spin')} />
      {isFetching ? (
        <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
          Actualizando…
        </span>
      ) : (
        <span className="text-[10px] font-bold tabular-nums whitespace-nowrap">{formatAgo(updatedAt)}</span>
      )}
    </button>
  )
}
