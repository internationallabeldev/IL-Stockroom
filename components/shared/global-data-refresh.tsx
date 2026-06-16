'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { RefreshCw } from 'lucide-react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

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
 * Global freshness + manual refresh control for the top nav. Reflects ALL
 * active queries on the current page: spins while any is fetching, refetches
 * them on click, and shows the OLDEST active query's last-fetch time — the most
 * honest read ("everything on screen is at least this old"). Renders nothing
 * until some active query has loaded (e.g. on static pages with no queries).
 */
export function GlobalDataRefresh({ className }: { className?: string }) {
  const queryClient = useQueryClient()
  const isFetching = useIsFetching() > 0

  // Subscribe to the query cache via useSyncExternalStore. The cache emits
  // synchronously while other components render (as their queries mount); a raw
  // cache.subscribe(setState) would fire "setState during render" — this hook
  // is built to absorb exactly that and schedule the update safely.
  const subscribe = useCallback(
    (onChange: () => void) => queryClient.getQueryCache().subscribe(onChange),
    [queryClient],
  )
  // Oldest successful fetch among the queries currently mounted on the page.
  const getOldest = useCallback(
    () => queryClient.getQueryCache()
      .findAll({ type: 'active' })
      .reduce((min, q) => (q.state.dataUpdatedAt > 0 ? Math.min(min, q.state.dataUpdatedAt) : min), Infinity),
    [queryClient],
  )
  const oldest = useSyncExternalStore(subscribe, getOldest, () => Infinity)

  // Keep the "hace Xs" label current even when no cache events fire.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 5_000)
    return () => clearInterval(id)
  }, [])

  const hasData = oldest !== Infinity
  if (!hasData && !isFetching) return null

  return (
    <button
      type="button"
      onClick={() => queryClient.refetchQueries({ type: 'active' })}
      disabled={isFetching}
      title="Actualizar ahora"
      className={cn(
        'flex items-center gap-1.5 h-8 px-2 text-muted-foreground transition-colors',
        'hover:text-foreground disabled:cursor-default disabled:hover:text-muted-foreground',
        className,
      )}
    >
      <RefreshCw className={cn('size-3.5 shrink-0', isFetching && 'animate-spin')} />
      {!isFetching && hasData && (
        <span className="text-[10px] font-bold tabular-nums whitespace-nowrap">{formatAgo(oldest)}</span>
      )}
    </button>
  )
}
