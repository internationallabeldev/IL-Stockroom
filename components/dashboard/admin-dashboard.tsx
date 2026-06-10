'use client'

import { useState } from 'react'
import { subDays } from 'date-fns'
import { DateRangePicker } from './date-range-picker'
import { DashboardGrid, rects, type DefaultWidget } from './grid/dashboard-grid'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 29), end }
}

const DEFAULTS: DefaultWidget[] = [
  { id: 'kpi-ink',         type: 'kpi-metric', params: { metricId: 'ink_total_kg' },   rects: rects([0, 0, 3, 2], [0, 0, 3, 2], [0, 0, 1, 2]) },
  { id: 'kpi-paper',       type: 'kpi-metric', params: { metricId: 'paper_total_m2' },  rects: rects([3, 0, 3, 2], [3, 0, 3, 2], [1, 0, 1, 2]) },
  { id: 'kpi-reqs',        type: 'kpi-metric', params: { metricId: 'pending_reqs' },    rects: rects([6, 0, 3, 2], [0, 2, 3, 2], [0, 2, 1, 2]) },
  { id: 'kpi-orders',      type: 'kpi-metric', params: { metricId: 'active_orders' },   rects: rects([9, 0, 3, 2], [3, 2, 3, 2], [1, 2, 1, 2]) },
  { id: 'chart-ink',       type: 'consumption-chart',     params: { materialType: 'INK' },   rects: rects([0, 2, 6, 5], [0, 4, 6, 5], [0, 4, 2, 5]) },
  { id: 'chart-paper',     type: 'consumption-chart',     params: { materialType: 'PAPER' }, rects: rects([6, 2, 6, 5], [0, 9, 6, 5], [0, 9, 2, 5]) },
  { id: 'pending-reqs',    type: 'pending-requisitions',  rects: rects([0, 7, 5, 6], [0, 14, 6, 6], [0, 14, 2, 6]) },
  { id: 'active-orders',   type: 'active-orders',         rects: rects([5, 7, 4, 6], [0, 20, 3, 6], [0, 20, 2, 6]) },
  { id: 'low-stock',       type: 'low-stock', params: { materialType: 'BOTH' }, rects: rects([9, 7, 3, 6], [3, 20, 3, 6], [0, 26, 2, 6]) },
  { id: 'recent-activity', type: 'recent-activity',       rects: rects([0, 13, 8, 6], [0, 26, 6, 6], [0, 32, 2, 6]) },
  { id: 'supplies-alert',  type: 'supplies-alert',        rects: rects([8, 13, 4, 6], [0, 32, 6, 6], [0, 38, 2, 6]) },
]

export function AdminDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-6 pb-16 space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Panel de Operaciones
          </h1>
          <p className="text-sm text-muted-foreground">
            {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
          </p>
        </div>
      </header>

      <DashboardGrid
        dashboardKey="admin"
        defaults={DEFAULTS}
        renderCtx={{ dateRange }}
        toolbar={<DateRangePicker onRangeChange={setDateRange} />}
      />
    </div>
  )
}
