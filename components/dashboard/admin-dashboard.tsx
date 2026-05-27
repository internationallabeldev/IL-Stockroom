'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Package, Layers, ClipboardList, ShoppingCart } from 'lucide-react'
import { subDays } from 'date-fns'
import { KpiCard } from './widgets/kpi-card'
import { LowStockWidget } from './widgets/low-stock-widget'
import { ConsumptionChart } from './widgets/consumption-chart'
import { PendingRequisitionsWidget } from './widgets/pending-requisitions-widget'
import { ActiveOrdersWidget } from './widgets/active-orders-widget'
import { RecentActivityWidget } from './widgets/recent-activity-widget'
import { SuppliesAlertWidget } from './widgets/supplies-alert-widget'
import { DateRangePicker } from './date-range-picker'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 6), end }
}

export function AdminDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn:  getDashboardKPIs,
    refetchInterval: 30_000,
  })

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="px-8 pt-8 pb-16 space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
            Panel de Operaciones
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
          </p>
        </div>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          title="Stock de tinta"
          value={kpis?.totalInkKg ?? 0}
          unit="kg"
          icon={<Package className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.totalInkKg ?? 0) < 50 ? 'danger' : 'default'}
          loading={kpisLoading}
        />
        <KpiCard
          title="Stock de papel"
          value={kpis?.totalPaperM2 ?? 0}
          unit="m²"
          icon={<Layers className="size-4" />}
          loading={kpisLoading}
        />
        <KpiCard
          title="Requisiciones pendientes"
          value={kpis?.pendingReqsCount ?? 0}
          icon={<ClipboardList className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.pendingReqsCount ?? 0) > 0 ? 'warning' : 'success'}
          loading={kpisLoading}
        />
        <KpiCard
          title="Órdenes activas"
          value={kpis?.activeOrdersCount ?? 0}
          icon={<ShoppingCart className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.overdueOrdersCount ?? 0) > 0 ? 'danger' : 'default'}
          loading={kpisLoading}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Consumo</p>
          <DateRangePicker onRangeChange={setDateRange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ConsumptionChart materialType="INK"   dateRange={dateRange} />
          <ConsumptionChart materialType="PAPER" dateRange={dateRange} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <PendingRequisitionsWidget />
        </div>
        <div className="col-span-4">
          <ActiveOrdersWidget />
        </div>
        <div className="col-span-3">
          <LowStockWidget materialType="BOTH" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <RecentActivityWidget />
        </div>
        <SuppliesAlertWidget />
      </div>
    </div>
  )
}
