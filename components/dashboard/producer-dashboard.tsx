'use client'

import { useMemo } from 'react'
import { subDays } from 'date-fns'
import { DashboardGrid, rects, type DefaultWidget } from './grid/dashboard-grid'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 29), end }
}

const DEFAULTS: DefaultWidget[] = [
  { id: 'kpi-my-reqs',     type: 'kpi-my-active-reqs', rects: rects([0, 0, 3, 2], [0, 0, 3, 2], [0, 0, 1, 2]) },
  { id: 'kpi-completed',   type: 'kpi-my-completed',   rects: rects([3, 0, 3, 2], [3, 0, 3, 2], [1, 0, 1, 2]) },
  { id: 'my-requisitions', type: 'my-requisitions',    rects: rects([0, 2, 6, 7], [0, 2, 6, 6], [0, 2, 2, 6]) },
  { id: 'stock-ink',       type: 'stock-overview', params: { materialType: 'INK' },   rects: rects([6, 2, 3, 7], [0, 8, 3, 6], [0, 8, 2, 6]) },
  { id: 'stock-paper',     type: 'stock-overview', params: { materialType: 'PAPER' }, rects: rects([9, 2, 3, 7], [3, 8, 3, 6], [0, 14, 2, 6]) },
]

export function ProducerDashboard({ userName }: { userName: string }) {
  const renderCtx = useMemo(() => ({ dateRange: defaultRange() }), [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-6 pb-16 space-y-6">
      <header className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Producción</h1>
        <p className="text-sm text-muted-foreground">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <DashboardGrid dashboardKey="producer" defaults={DEFAULTS} renderCtx={renderCtx} />
    </div>
  )
}
