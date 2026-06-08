'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShoppingCart, AlertTriangle, TrendingDown, Package } from 'lucide-react'
import { subDays } from 'date-fns'
import { KpiCard } from './widgets/kpi-card'
import { LowStockWidget } from './widgets/low-stock-widget'
import { SuppliesAlertWidget } from './widgets/supplies-alert-widget'
import { ConsumptionChart } from './widgets/consumption-chart'
import { ActiveOrdersWidget } from './widgets/active-orders-widget'
import { DateRangePicker } from './date-range-picker'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 29), end }
}

export function PurchaserDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn:  getDashboardKPIs,
    refetchInterval: 30_000,
  })

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Órdenes activas"
          value={kpis?.activeOrdersCount ?? 0}
          icon={<ShoppingCart className="size-4" />}
          loading={kpisLoading}
          href="/dashboard/orders/ink"
        />
        <KpiCard
          title="Órdenes atrasadas"
          value={kpis?.overdueOrdersCount ?? 0}
          icon={<TrendingDown className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.overdueOrdersCount ?? 0) > 0 ? 'danger' : 'success'}
          loading={kpisLoading}
          href="/dashboard/orders/ink"
        />
        <KpiCard
          title="Materiales bajo mínimo"
          value={kpis?.lowStockCount ?? 0}
          icon={<AlertTriangle className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'}
          loading={kpisLoading}
          href="/dashboard/inventory/inks"
        />
        <KpiCard
          title="Por recibir (calidad)"
          value={kpis?.pendingQualityCount ?? 0}
          icon={<Package className="size-4" />}
          loading={kpisLoading}
          href="/dashboard/receipts"
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <ActiveOrdersWidget />
        </div>
        <div className="col-span-3">
          <LowStockWidget materialType="BOTH" />
        </div>
        <div className="col-span-3">
          <SuppliesAlertWidget />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Consumo — referencia para compras</p>
          <DateRangePicker onRangeChange={setDateRange} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ConsumptionChart materialType="INK"   dateRange={dateRange} />
          <ConsumptionChart materialType="PAPER" dateRange={dateRange} />
        </div>
      </div>
    </div>
  )
}
