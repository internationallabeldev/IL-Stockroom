/** One dashboard variant per role — used as the persistence key. */
export type DashboardKey = 'admin' | 'purchaser' | 'warehouse' | 'producer' | 'user'

export const LAYOUT_BREAKPOINTS = ['lg', 'md', 'xs'] as const
export type LayoutBreakpoint = (typeof LAYOUT_BREAKPOINTS)[number]

/** Serialized position/size of one widget, in react-grid-layout grid units. */
export type WidgetRect = {
  i: string
  x: number
  y: number
  w: number
  h: number
}

/** What gets persisted in dashboard_layouts.layouts — one array per breakpoint. */
export type DashboardLayouts = Partial<Record<LayoutBreakpoint, WidgetRect[]>>

/** Catalog of server-computed KPI metrics the configurable metric card can show. */
export type MetricId =
  | 'ink_total_kg'
  | 'paper_total_m2'
  | 'pending_reqs'
  | 'active_orders'
  | 'overdue_orders'
  | 'low_stock_count'
  | 'pending_quality'
  | 'deliveries_today'

/** A widget the user has placed on the dashboard. `id` links to its rect. */
export type WidgetInstance = {
  id: string
  type: string
  params?: Record<string, string>
}

/** What gets persisted alongside the layout: the user's chosen widget set. */
export type DashboardState = {
  widgets: WidgetInstance[]
  layouts: DashboardLayouts
}
