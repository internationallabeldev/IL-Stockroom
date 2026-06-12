'use server'

import { getDashboardKPIs } from '@/actions/dashboard.actions'
import type { MetricId } from '@/types/dashboard-layout.types'

export type MetricColor = 'default' | 'warning' | 'danger' | 'success'
export type MetricResult = { value: number; color: MetricColor }

// Configurable metric card (Nivel-2 trait). The card only sends a metricId from
// a closed list — there is NO user-supplied query, so nothing to inject. Each id
// maps to a fixed field of the already role-aware getDashboardKPIs() result.
// To grow: add a MetricId in the types file + a case here + a catalog entry in
// components/dashboard/widgets/metric-card.tsx.
export async function runMetric(metricId: MetricId): Promise<MetricResult> {
  const kpis = await getDashboardKPIs()

  switch (metricId) {
    case 'ink_total_kg': {
      const value = kpis.totalInkKg ?? 0
      return { value, color: value < 50 ? 'danger' : 'default' }
    }
    case 'paper_total_m2':
      return { value: kpis.totalPaperM2 ?? 0, color: 'default' }
    case 'pending_reqs': {
      const value = kpis.pendingReqsCount ?? 0
      return { value, color: value > 0 ? 'warning' : 'success' }
    }
    case 'active_orders':
      return { value: kpis.activeOrdersCount ?? 0, color: 'default' }
    case 'overdue_orders': {
      const value = kpis.overdueOrdersCount ?? 0
      return { value, color: value > 0 ? 'danger' : 'success' }
    }
    case 'low_stock_count': {
      const value = kpis.lowStockCount ?? 0
      return { value, color: value > 0 ? 'warning' : 'success' }
    }
    case 'pending_quality': {
      const value = kpis.pendingQualityCount ?? 0
      return { value, color: value > 0 ? 'warning' : 'success' }
    }
    case 'deliveries_today':
      return { value: kpis.deliveriesToday ?? 0, color: 'success' }
    default:
      return { value: 0, color: 'default' }
  }
}
