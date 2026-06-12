'use client'

import type { ComponentType } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Package, Layers, ClipboardList, ShoppingCart,
  TrendingDown, AlertTriangle, PackageCheck,
} from 'lucide-react'
import { KpiCard } from './kpi-card'
import { runMetric } from '@/actions/dashboard-metrics.actions'
import type { MetricId } from '@/types/dashboard-layout.types'

type IconType = ComponentType<{ className?: string }>

/** Static presentation per metric (icons/links can't be serialized from the
 *  server). The dynamic value+color come from runMetric. Keys MUST match the
 *  MetricId union and the runMetric switch. */
export const METRIC_CATALOG: Record<MetricId, { label: string; unit?: string; icon: IconType; href: string }> = {
  ink_total_kg:    { label: 'Stock de tinta',           unit: 'kg', icon: Package,       href: '/dashboard/inventory/inks' },
  paper_total_m2:  { label: 'Stock de papel',           unit: 'm²', icon: Layers,        href: '/dashboard/inventory/paper' },
  pending_reqs:    { label: 'Requisiciones pendientes',             icon: ClipboardList, href: '/dashboard/requisitions' },
  active_orders:   { label: 'Órdenes activas',                      icon: ShoppingCart,  href: '/dashboard/orders/ink' },
  overdue_orders:  { label: 'Órdenes atrasadas',                    icon: TrendingDown,  href: '/dashboard/orders/ink' },
  low_stock_count: { label: 'Materiales bajo mínimo',               icon: AlertTriangle, href: '/dashboard/inventory/inks' },
  pending_quality: { label: 'Por recibir (calidad)',                icon: PackageCheck,  href: '/dashboard/receipts' },
  deliveries_today:{ label: 'Entregas hoy',                         icon: PackageCheck,  href: '/dashboard/outputs/history' },
}

export const METRIC_IDS = Object.keys(METRIC_CATALOG) as MetricId[]

export function MetricCard({ metricId }: { metricId: MetricId }) {
  const meta = METRIC_CATALOG[metricId] ?? METRIC_CATALOG.pending_reqs
  const Icon = meta.icon

  const { data, isLoading } = useQuery({
    queryKey: ['metric', metricId],
    queryFn:  () => runMetric(metricId),
    refetchInterval: 30_000,
  })

  return (
    <KpiCard
      title={meta.label}
      value={data?.value ?? 0}
      unit={meta.unit}
      icon={<Icon className="size-4" />}
      color={isLoading ? 'default' : (data?.color ?? 'default')}
      loading={isLoading}
      href={meta.href}
    />
  )
}
