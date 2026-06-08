'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import { setAuditUser }      from '@/lib/supabase/audit'
import { notifyRoles }       from './notifications.actions'
import type { Database }     from '@/types/database.types'

type InkInventoryRow = Database['public']['Tables']['ink_inventory']['Row']
type InkCatalogRow   = Database['public']['Tables']['ink_catalog']['Row']
type InkReceiptRow   = Database['public']['Tables']['ink_receipts']['Row']
type InkOutputRow    = Database['public']['Tables']['ink_outputs']['Row']
type RequisitionRow  = Database['public']['Tables']['production_requisitions']['Row']

export type InkLot = InkInventoryRow & {
  ink_catalog: Pick<InkCatalogRow, 'id' | 'code' | 'name' | 'color_code' | 'min_stock_kg' | 'current_stock_kg' | 'density' | 'viscosity'> | null
  receipt: (InkReceiptRow & {
    receiver:            { first_name: string | null; last_name: string | null } | null
    purchase_order_item: { purchase_order: { provider: { id: number; name: string } | null } | null } | null
  }) | null
}

export type InkLotHistory = InkLot & {
  outputs: Array<InkOutputRow & {
    requisition: Pick<RequisitionRow, 'id' | 'requisition_number' | 'production_order' | 'status'> | null
    delivered_by_user: { first_name: string | null; last_name: string | null } | null
  }>
}

export type InventoryFilters = {
  enabled?: boolean | null
  search?: string
  lowStock?: boolean
}

const CAN_MANAGE = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS      = ['/dashboard/inventory/inks']

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getInkInventory(_filters?: InventoryFilters): Promise<InkLot[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ink_inventory')
    .select(`
      *,
      ink_catalog:ink_catalog_id ( id, code, name, color_code, min_stock_kg, current_stock_kg, density, viscosity ),
      receipt:receipt_id (
        *,
        receiver:received_by ( first_name, last_name ),
        purchase_order_item:purchase_order_item_id (
          purchase_order:purchase_order_id (
            provider:provider_id ( id, name )
          )
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as InkLot[]
}

export async function getInkLotHistory(inventoryId: number): Promise<InkLotHistory | null> {
  const supabase = createAdminClient()

  const [lotRes, outputsRes] = await Promise.all([
    supabase
      .from('ink_inventory')
      .select(`
        *,
        ink_catalog:ink_catalog_id ( id, code, name, color_code, min_stock_kg, current_stock_kg, density, viscosity ),
        receipt:receipt_id (
          *,
          receiver:received_by ( first_name, last_name )
        )
      `)
      .eq('id', inventoryId)
      .single(),

    supabase
      .from('ink_outputs')
      .select(`
        *,
        requisition:requisition_id ( id, requisition_number, production_order, status ),
        delivered_by_user:delivered_by ( first_name, last_name )
      `)
      .eq('inventory_id', inventoryId)
      .order('output_date', { ascending: true }),
  ])

  if (lotRes.error) return null
  return {
    ...(lotRes.data as unknown as InkLot),
    outputs: (outputsRes.data ?? []) as unknown as InkLotHistory['outputs'],
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function updateLotLocation(
  inventoryId: number,
  location: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_inventory')
    .update({ location: location.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function disableLot(
  inventoryId: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_inventory')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function createRequisition(values: {
  ink_catalog_id: number
  kg_requested: number
  production_order: string
  notes?: string
}): Promise<{ success?: boolean; requisitionId?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'PRODUCER') return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('production_requisitions')
    .select('*', { count: 'exact', head: true })

  const { data, error } = await supabase
    .from('production_requisitions')
    .insert({
      material_type:      'INK',
      production_order:   values.production_order,
      requested_by:       user.id,
      request_date:       new Date().toISOString().split('T')[0],
      status:             'PENDING',
      notes:              values.notes ?? null,
      requisition_number: (count ?? 0) + 1,
    } as any)
    .select('id')
    .single()

  if (error) return { error: error.message }

  await notifyRoles(['ADMIN', 'WAREHOUSE_MANAGER'], {
    type:  'pending_requisitions',
    title: `Nueva requisición de tinta — OP ${values.production_order}`,
    body:  'Una requisición de producción espera aprobación.',
    link:  `/dashboard/requisitions/${(data as any).id}`,
    metadata: { requisition_id: (data as any).id, material: 'INK' },
    email: { badge: '📋 Requisición pendiente', subtitle: `Solicitada por ${user.first_name} ${user.last_name}` },
  })

  revalidatePath('/dashboard/requisitions')
  return { success: true, requisitionId: (data as any).id }
}
