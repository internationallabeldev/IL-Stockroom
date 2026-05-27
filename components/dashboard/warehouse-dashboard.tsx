'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, ClipboardCheck, AlertTriangle, PackageCheck } from 'lucide-react'
import { subDays } from 'date-fns'
import { KpiCard } from './widgets/kpi-card'
import { LowStockWidget } from './widgets/low-stock-widget'
import { SuppliesAlertWidget } from './widgets/supplies-alert-widget'
import { ConsumptionChart } from './widgets/consumption-chart'
import { PendingRequisitionsWidget } from './widgets/pending-requisitions-widget'
import { PendingQualityWidget } from './widgets/pending-quality-widget'
import { DateRangePicker } from './date-range-picker'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { DateRange } from '@/types/dashboard.types'

function defaultRange(): DateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  return { start: subDays(end, 6), end }
}

export function WarehouseDashboard({ userName }: { userName: string }) {
  const [dateRange, setDateRange] = useState<DateRange>(defaultRange)

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn:  getDashboardKPIs,
    refetchInterval: 30_000,
  })

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const urgent   = (kpis?.pendingReqsCount ?? 0) > 0

  return (
    <div className="px-8 pt-8 pb-16 space-y-8">
      {!kpisLoading && urgent && (
        <div className="bg-destructive text-white px-6 py-3 -mx-8 flex items-center gap-3">
          <ClipboardList className="size-4 shrink-0" />
          <p className="text-[10px] font-bold uppercase tracking-widest">
            {kpis!.pendingReqsCount} requisición{kpis!.pendingReqsCount !== 1 ? 'es' : ''} pendiente{kpis!.pendingReqsCount !== 1 ? 's' : ''} de atender
          </p>
        </div>
      )}

      <header>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">Almacén</h1>
        <p className="text-lg text-muted-foreground mt-1">
          {greeting}, <span className="text-[#008dc2] font-bold capitalize">{userName}</span>
        </p>
      </header>

      <div className="grid grid-cols-4 gap-3">
        <KpiCard
          title="Requisiciones pendientes"
          value={kpis?.pendingReqsCount ?? 0}
          icon={<ClipboardList className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.pendingReqsCount ?? 0) > 0 ? 'danger' : 'success'}
          loading={kpisLoading}
        />
        <KpiCard
          title="Recepciones por aprobar"
          value={kpis?.pendingQualityCount ?? 0}
          icon={<ClipboardCheck className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.pendingQualityCount ?? 0) > 0 ? 'warning' : 'success'}
          loading={kpisLoading}
        />
        <KpiCard
          title="Stock bajo mínimo"
          value={kpis?.lowStockCount ?? 0}
          icon={<AlertTriangle className="size-4" />}
          color={kpisLoading ? 'default' : (kpis?.lowStockCount ?? 0) > 0 ? 'warning' : 'success'}
          loading={kpisLoading}
        />
        <KpiCard
          title="Entregas hoy"
          value={kpis?.deliveriesToday ?? 0}
          icon={<PackageCheck className="size-4" />}
          color="success"
          loading={kpisLoading}
        />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <PendingRequisitionsWidget />
        </div>
        <div className="col-span-3">
          <PendingQualityWidget />
        </div>
        <div className="col-span-2">
          <LowStockWidget materialType="BOTH" />
        </div>
        <div className="col-span-2">
          <SuppliesAlertWidget />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Consumo del período</p>
          <DateRangePicker onRangeChange={setDateRange} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <ConsumptionChart materialType="INK"   dateRange={dateRange} />
          <ConsumptionChart materialType="PAPER" dateRange={dateRange} />
        </div>
      </div>
    </div>
  )
}
