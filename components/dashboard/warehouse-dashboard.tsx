'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { subDays } from 'date-fns'
import { DateRangePicker } from './date-range-picker'
import { DashboardGrid, rects, type DefaultWidget } from './grid/dashboard-grid'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 29), end }
}

const DEFAULTS: DefaultWidget[] = [
  { id: 'kpi-reqs',    type: 'kpi-metric', params: { metricId: 'pending_reqs' },    rects: rects([0, 0, 3, 2], [0, 0, 3, 2], [0, 0, 1, 2]) },
  { id: 'kpi-quality', type: 'kpi-metric', params: { metricId: 'pending_quality' }, rects: rects([3, 0, 3, 2], [3, 0, 3, 2], [1, 0, 1, 2]) },
  { id: 'kpi-low',     type: 'kpi-metric', params: { metricId: 'low_stock_count' }, rects: rects([6, 0, 3, 2], [0, 2, 3, 2], [0, 2, 1, 2]) },
  { id: 'kpi-deliv',   type: 'kpi-metric', params: { metricId: 'deliveries_today' }, rects: rects([9, 0, 3, 2], [3, 2, 3, 2], [1, 2, 1, 2]) },
  { id: 'pending-reqs',    type: 'pending-requisitions', rects: rects([0, 2, 5, 6], [0, 4, 6, 6], [0, 4, 2, 6]) },
  { id: 'pending-quality', type: 'pending-quality',      rects: rects([5, 2, 3, 6], [0, 10, 3, 6], [0, 10, 2, 6]) },
  { id: 'low-stock',       type: 'low-stock', params: { materialType: 'BOTH' }, rects: rects([8, 2, 2, 6], [3, 10, 3, 6], [0, 16, 2, 6]) },
  { id: 'supplies-alert',  type: 'supplies-alert',       rects: rects([10, 2, 2, 6], [0, 16, 6, 6], [0, 22, 2, 6]) },
  { id: 'chart-ink',       type: 'consumption-chart', params: { materialType: 'INK' },   rects: rects([0, 8, 6, 5], [0, 22, 6, 5], [0, 28, 2, 5]) },
  { id: 'chart-paper',     type: 'consumption-chart', params: { materialType: 'PAPER' }, rects: rects([6, 8, 6, 5], [0, 27, 6, 5], [0, 33, 2, 5]) },
]

export function WarehouseDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  // The urgent banner stays fixed outside the grid, so it still needs the count.
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn:  getDashboardKPIs,
    refetchInterval: 30_000,
  })

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const urgent   = (kpis?.pendingReqsCount ?? 0) > 0

  return (
    <div className="px-8 pt-6 pb-16 space-y-6">
      {!kpisLoading && urgent && (
        <div className="bg-destructive text-white px-6 py-3 -mx-8 flex items-center gap-3">
          <ClipboardList className="size-4 shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            {kpis!.pendingReqsCount} requisición{kpis!.pendingReqsCount !== 1 ? 'es' : ''} pendiente{kpis!.pendingReqsCount !== 1 ? 's' : ''} de atender
          </p>
        </div>
      )}

      <header className="flex items-baseline gap-3">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">Almacén</h1>
        <p className="text-sm text-muted-foreground">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <DashboardGrid
        dashboardKey="warehouse"
        defaults={DEFAULTS}
        renderCtx={{ dateRange }}
        toolbar={<DateRangePicker onRangeChange={setDateRange} />}
      />
    </div>
  )
}
