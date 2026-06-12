'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckCircle } from 'lucide-react'
import { KpiCard } from '@/components/dashboard/widgets/kpi-card'
import { MetricCard, METRIC_CATALOG, METRIC_IDS } from '@/components/dashboard/widgets/metric-card'
import { LowStockWidget } from '@/components/dashboard/widgets/low-stock-widget'
import { ConsumptionChart } from '@/components/dashboard/widgets/consumption-chart'
import { StockOverviewWidget } from '@/components/dashboard/widgets/stock-overview-widget'
import { ActiveOrdersWidget } from '@/components/dashboard/widgets/active-orders-widget'
import { PendingRequisitionsWidget } from '@/components/dashboard/widgets/pending-requisitions-widget'
import { PendingQualityWidget } from '@/components/dashboard/widgets/pending-quality-widget'
import { RecentActivityWidget } from '@/components/dashboard/widgets/recent-activity-widget'
import { SuppliesAlertWidget } from '@/components/dashboard/widgets/supplies-alert-widget'
import { MyRequisitionsWidget } from '@/components/dashboard/widgets/my-requisitions-widget'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { DashboardKey, MetricId } from '@/types/dashboard-layout.types'
import type { DateRange } from '@/types/dashboard.types'

export type RenderCtx = { dateRange: DateRange }

export type WidgetParamField = {
  key: string
  label: string
  options: { value: string; label: string }[]
}

export type WidgetDef = {
  type: string
  label: string
  description: string
  category: string
  defaultSize: { w: number; h: number; minW: number; minH: number }
  /** If set, only these dashboards may add the widget from the picker. */
  dashboards?: DashboardKey[]
  params?: WidgetParamField[]
  render: (params: Record<string, string>, ctx: RenderCtx) => ReactNode
}

// ── Personal KPI cards (current user's own requisitions) ─────────────────────
// Not exposed as generic metrics yet — they read per-user fields of the KPIs.

function MyActiveReqsCard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-kpis'], queryFn: getDashboardKPIs, refetchInterval: 30_000 })
  const value = data?.myActiveReqs ?? 0
  return (
    <KpiCard
      title="Mis req. activas"
      value={value}
      icon={<ClipboardList className="size-4" />}
      color={value > 0 ? 'warning' : 'default'}
      loading={isLoading}
      href="/dashboard/requisitions"
    />
  )
}

function MyCompletedCard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-kpis'], queryFn: getDashboardKPIs, refetchInterval: 30_000 })
  return (
    <KpiCard
      title="Completadas este mes"
      value={data?.myCompletedThisMonth ?? 0}
      icon={<CheckCircle className="size-4" />}
      color="success"
      loading={isLoading}
      href="/dashboard/requisitions"
    />
  )
}

const MATERIAL_OPTIONS = [
  { value: 'INK',   label: 'Tinta' },
  { value: 'PAPER', label: 'Papel' },
]
const MATERIAL_OPTIONS_BOTH = [...MATERIAL_OPTIONS, { value: 'BOTH', label: 'Ambos' }]

const METRIC_OPTIONS = METRIC_IDS.map(id => ({ value: id, label: METRIC_CATALOG[id].label }))

export const WIDGET_REGISTRY: Record<string, WidgetDef> = {
  'kpi-metric': {
    type: 'kpi-metric',
    label: 'Indicador (KPI)',
    description: 'Tarjeta de métrica configurable.',
    category: 'Indicadores',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    params: [{ key: 'metricId', label: 'Métrica', options: METRIC_OPTIONS }],
    render: p => <MetricCard metricId={(p.metricId as MetricId) || 'pending_reqs'} />,
  },
  'kpi-my-active-reqs': {
    type: 'kpi-my-active-reqs',
    label: 'Mis requisiciones activas',
    description: 'Conteo de tus requisiciones en curso.',
    category: 'Indicadores',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    dashboards: ['producer', 'admin', 'user'],
    render: () => <MyActiveReqsCard />,
  },
  'kpi-my-completed': {
    type: 'kpi-my-completed',
    label: 'Completadas este mes',
    description: 'Tus requisiciones cumplidas este mes.',
    category: 'Indicadores',
    defaultSize: { w: 3, h: 2, minW: 2, minH: 2 },
    dashboards: ['producer', 'admin', 'user'],
    render: () => <MyCompletedCard />,
  },
  'low-stock': {
    type: 'low-stock',
    label: 'Stock bajo',
    description: 'Materiales por debajo del mínimo.',
    category: 'Inventario',
    defaultSize: { w: 3, h: 6, minW: 2, minH: 3 },
    params: [{ key: 'materialType', label: 'Material', options: MATERIAL_OPTIONS_BOTH }],
    render: p => <LowStockWidget materialType={(p.materialType as 'INK' | 'PAPER' | 'BOTH') || 'BOTH'} />,
  },
  'stock-overview': {
    type: 'stock-overview',
    label: 'Resumen de stock',
    description: 'Existencias actuales por material.',
    category: 'Inventario',
    defaultSize: { w: 4, h: 6, minW: 2, minH: 3 },
    params: [{ key: 'materialType', label: 'Material', options: MATERIAL_OPTIONS }],
    render: p => <StockOverviewWidget materialType={(p.materialType as 'INK' | 'PAPER') || 'INK'} />,
  },
  'consumption-chart': {
    type: 'consumption-chart',
    label: 'Consumo',
    description: 'Gráfica de consumo en el período.',
    category: 'Consumo',
    defaultSize: { w: 6, h: 5, minW: 3, minH: 4 },
    params: [{ key: 'materialType', label: 'Material', options: MATERIAL_OPTIONS }],
    render: (p, ctx) => <ConsumptionChart materialType={(p.materialType as 'INK' | 'PAPER') || 'INK'} dateRange={ctx.dateRange} />,
  },
  'active-orders': {
    type: 'active-orders',
    label: 'Órdenes activas',
    description: 'Órdenes de compra en curso.',
    category: 'Órdenes',
    defaultSize: { w: 4, h: 6, minW: 2, minH: 3 },
    render: () => <ActiveOrdersWidget />,
  },
  'pending-requisitions': {
    type: 'pending-requisitions',
    label: 'Requisiciones pendientes',
    description: 'Requisiciones por atender.',
    category: 'Requisiciones',
    defaultSize: { w: 5, h: 6, minW: 2, minH: 3 },
    render: () => <PendingRequisitionsWidget />,
  },
  'my-requisitions': {
    type: 'my-requisitions',
    label: 'Mis requisiciones',
    description: 'Tus requisiciones activas.',
    category: 'Requisiciones',
    defaultSize: { w: 6, h: 7, minW: 2, minH: 3 },
    dashboards: ['producer', 'admin', 'user'],
    render: () => <MyRequisitionsWidget />,
  },
  'pending-quality': {
    type: 'pending-quality',
    label: 'Recepciones por aprobar',
    description: 'Recepciones pendientes de calidad.',
    category: 'Calidad',
    defaultSize: { w: 3, h: 6, minW: 2, minH: 3 },
    render: () => <PendingQualityWidget />,
  },
  'recent-activity': {
    type: 'recent-activity',
    label: 'Actividad reciente',
    description: 'Últimos movimientos del sistema.',
    category: 'Actividad',
    defaultSize: { w: 8, h: 6, minW: 2, minH: 3 },
    dashboards: ['admin'],
    render: () => <RecentActivityWidget />,
  },
  'supplies-alert': {
    type: 'supplies-alert',
    label: 'Alertas de insumos',
    description: 'Insumos bajo mínimo.',
    category: 'Insumos',
    defaultSize: { w: 4, h: 6, minW: 2, minH: 3 },
    render: () => <SuppliesAlertWidget />,
  },
}

export function widgetsForDashboard(key: DashboardKey): WidgetDef[] {
  return Object.values(WIDGET_REGISTRY).filter(w => !w.dashboards || w.dashboards.includes(key))
}

export function defaultParams(def: WidgetDef): Record<string, string> {
  const out: Record<string, string> = {}
  for (const f of def.params ?? []) out[f.key] = f.options[0]?.value ?? ''
  return out
}
