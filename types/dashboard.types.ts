export type DateRange = {
  start: Date
  end: Date
}

export type LowStockItem = {
  id: number
  code: string
  name: string
  current_stock: number
  min_stock: number
  stock_percentage: number
  unit: 'kg' | 'm²'
  provider_name: string | null
  color_code?: string | null
}

export type ConsumptionDataPoint = {
  date: string
  [materialName: string]: number | string
}

export type ConsumptionMaterial = {
  name: string
  color: string
}

export type ConsumptionResult = {
  points: ConsumptionDataPoint[]
  materials: ConsumptionMaterial[]
}

export type PendingRequisition = {
  id: number
  requisition_number: number
  material_type: 'INK' | 'PAPER'
  status: string
  request_date: string
  production_order: string
  requested_by_name: string
  hours_waiting: number
}

export type ActiveOrder = {
  id: number
  order_number: number
  material_type: 'INK' | 'PAPER'
  status: string
  request_date: string
  expected_delivery_date: string | null
  provider_name: string
  days_overdue: number | null
}

export type PendingQualityReceipt = {
  id: number
  internal_batch: string
  receipt_date: string
  material_name: string
  material_type: 'INK' | 'PAPER'
  quantity: number
  days_pending: number
}

export type StockOverviewItem = {
  id: number
  code: string
  name: string
  current_stock: number
  min_stock: number
  unit: 'kg' | 'm²'
  color_code?: string | null
}

export type RecentActivityEvent = {
  id: string
  type: 'ink_output' | 'paper_output' | 'ink_receipt' | 'paper_receipt' | 'order' | 'requisition'
  description: string
  date: string
  user_name?: string
}

export type DashboardKPIs = {
  totalInkKg?: number
  totalPaperM2?: number
  pendingReqsCount?: number
  activeOrdersCount?: number
  overdueOrdersCount?: number
  lowStockCount?: number
  pendingQualityCount?: number
  deliveriesToday?: number
  myActiveReqs?: number
  myCompletedThisMonth?: number
}
