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
  { id: 'stock-ink',     type: 'stock-overview', params: { materialType: 'INK' },   rects: rects([0, 0, 4, 6], [0, 0, 3, 6], [0, 0, 2, 6]) },
  { id: 'stock-paper',   type: 'stock-overview', params: { materialType: 'PAPER' }, rects: rects([4, 0, 4, 6], [3, 0, 3, 6], [0, 6, 2, 6]) },
  { id: 'active-orders', type: 'active-orders',  rects: rects([8, 0, 4, 6], [0, 6, 6, 6], [0, 12, 2, 6]) },
]

export function UserDashboard({ userName }: { userName: string }) {
  const renderCtx = useMemo(() => ({ dateRange: defaultRange() }), [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-6 pb-16 space-y-6">
      <header className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Panel</h1>
        <p className="text-sm text-muted-foreground">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <DashboardGrid dashboardKey="user" defaults={DEFAULTS} renderCtx={renderCtx} />
    </div>
  )
}
