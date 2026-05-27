export type SupplyCategory = {
  id: number
  name: string
  description: string | null
  color: string | null
  enabled: boolean
  created_at: string | null
  updated_at: string | null
}

export type SupplyItem = {
  id: number
  category_id: number
  name: string
  description: string | null
  image_url: string | null
  unit: string
  quantity_current: number
  quantity_minimum: number
  quantity_warning: number | null
  provider_id: number | null
  alert_email: string | null
  last_alert_sent_at: string | null
  enabled: boolean
  created_at: string | null
  updated_at: string | null
}

export type SupplyMovement = {
  id: number
  item_id: number
  movement_type: 'IN' | 'OUT' | 'ADJUSTMENT'
  quantity: number
  quantity_before: number
  quantity_after: number
  notes: string | null
  performed_by: string
  created_at: string | null
  performed_by_user?: { first_name: string | null; last_name: string | null } | null
}

export type SupplyStatus = 'ok' | 'warning' | 'critical' | 'empty'

export function getSupplyStatus(
  item: Pick<SupplyItem, 'quantity_current' | 'quantity_minimum' | 'quantity_warning'>
): SupplyStatus {
  const warning = item.quantity_warning ?? Math.ceil(item.quantity_minimum * 1.5)
  if (item.quantity_current === 0) return 'empty'
  if (item.quantity_current < item.quantity_minimum) return 'critical'
  if (item.quantity_current < warning) return 'warning'
  return 'ok'
}

export type SupplyItemWithStatus = SupplyItem & {
  status: SupplyStatus
  provider: { id: number; name: string } | null
}

export type SupplyCategoryWithItems = SupplyCategory & {
  items: SupplyItemWithStatus[]
  counts: { ok: number; warning: number; critical: number; empty: number }
}

export type SupplyItemWithDetails = SupplyItem & {
  status: SupplyStatus
  category: SupplyCategory | null
  provider: { id: number; name: string } | null
  last_movement: SupplyMovement | null
}
