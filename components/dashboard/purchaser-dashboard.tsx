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
  { id: 'kpi-active',  type: 'kpi-metric', params: { metricId: 'active_orders' },   rects: rects([0, 0, 3, 2], [0, 0, 3, 2], [0, 0, 1, 2]) },
  { id: 'kpi-overdue', type: 'kpi-metric', params: { metricId: 'overdue_orders' },  rects: rects([3, 0, 3, 2], [3, 0, 3, 2], [1, 0, 1, 2]) },
  { id: 'kpi-low',     type: 'kpi-metric', params: { metricId: 'low_stock_count' }, rects: rects([6, 0, 3, 2], [0, 2, 3, 2], [0, 2, 1, 2]) },
  { id: 'kpi-quality', type: 'kpi-metric', params: { metricId: 'pending_quality' }, rects: rects([9, 0, 3, 2], [3, 2, 3, 2], [1, 2, 1, 2]) },
  { id: 'active-orders',  type: 'active-orders',  rects: rects([0, 2, 6, 6], [0, 4, 6, 6], [0, 4, 2, 6]) },
  { id: 'low-stock',      type: 'low-stock', params: { materialType: 'BOTH' }, rects: rects([6, 2, 3, 6], [0, 10, 3, 6], [0, 10, 2, 6]) },
  { id: 'supplies-alert', type: 'supplies-alert', rects: rects([9, 2, 3, 6], [3, 10, 3, 6], [0, 16, 2, 6]) },
  { id: 'chart-ink',      type: 'consumption-chart', params: { materialType: 'INK' },   rects: rects([0, 8, 6, 5], [0, 16, 6, 5], [0, 22, 2, 5]) },
  { id: 'chart-paper',    type: 'consumption-chart', params: { materialType: 'PAPER' }, rects: rects([6, 8, 6, 5], [0, 21, 6, 5], [0, 27, 2, 5]) },
]

export function PurchaserDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-6 pb-16 space-y-6">
      <header className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Compras</h1>
        <p className="text-sm text-muted-foreground">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <DashboardGrid
        dashboardKey="purchaser"
        defaults={DEFAULTS}
        renderCtx={{ dateRange }}
        toolbar={<DateRangePicker onRangeChange={setDateRange} />}
      />
    </div>
  )
}
