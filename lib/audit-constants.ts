export type AuditOperation = 'INSERT' | 'UPDATE' | 'DELETE'

export type AuditLogEntry = {
  id:                number
  table_name:        string
  operation:         AuditOperation
  record_id:         number | null
  old_data:          Record<string, unknown> | null
  new_data:          Record<string, unknown> | null
  changed_fields:    string[] | null
  performed_by:      string | null
  performed_by_name: string | null
  ip_address:        string | null
  created_at:        string
}

export type AuditFilters = {
  table_name?:   string
  operation?:    AuditOperation
  performed_by?: string
  date_from?:    string
  date_to?:      string
  search?:       string
  page?:         number
  pageSize?:     number
}

export const AUDITED_TABLES = [
  'providers',
  'ink_catalog',
  'paper_catalog',
  'purchase_orders',
  'purchase_order_ink_items',
  'purchase_order_paper_items',
  'ink_receipts',
  'paper_receipts',
  'ink_inventory',
  'paper_inventory',
  'ink_outputs',
  'paper_outputs',
  'production_requisitions',
  'requisition_ink_items',
  'requisition_paper_items',
  'users',
] as const
