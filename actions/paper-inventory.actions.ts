'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import type { Database }     from '@/types/database.types'

type PaperInventoryRow = Database['public']['Tables']['paper_inventory']['Row']
type PaperCatalogRow   = Database['public']['Tables']['paper_catalog']['Row']
type PaperReceiptRow   = Database['public']['Tables']['paper_receipts']['Row']
type PaperOutputRow    = Database['public']['Tables']['paper_outputs']['Row']
type RequisitionRow    = Database['public']['Tables']['production_requisitions']['Row']

export type PaperLot = PaperInventoryRow & {
  paper_catalog: Pick<
    PaperCatalogRow,
    'id' | 'code' | 'name' | 'weight_gsm' | 'min_stock_m2' | 'current_stock_m2' | 'standard_width_m'
  > | null
  receipt: (PaperReceiptRow & {
    receiver: { first_name: string | null; last_name: string | null } | null
  }) | null
}

export type PaperLotHistory = PaperLot & {
  outputs: Array<PaperOutputRow & {
    requisition:       Pick<RequisitionRow, 'id' | 'requisition_number' | 'production_order' | 'status'> | null
    delivered_by_user: { first_name: string | null; last_name: string | null } | null
  }>
}

const CAN_MANAGE = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS      = ['/dashboard/inventory/paper']

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getPaperInventory(): Promise<PaperLot[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('paper_inventory')
    .select(`
      *,
      paper_catalog:paper_catalog_id ( id, code, name, weight_gsm, min_stock_m2, current_stock_m2, standard_width_m ),
      receipt:receipt_id (
        *,
        receiver:received_by ( first_name, last_name )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) return []
  return (data ?? []) as unknown as PaperLot[]
}

export async function getPaperLotHistory(inventoryId: number): Promise<PaperLotHistory | null> {
  const supabase = createAdminClient()

  const [lotRes, outputsRes] = await Promise.all([
    supabase
      .from('paper_inventory')
      .select(`
        *,
        paper_catalog:paper_catalog_id ( id, code, name, weight_gsm, min_stock_m2, current_stock_m2, standard_width_m ),
        receipt:receipt_id (
          *,
          receiver:received_by ( first_name, last_name )
        )
      `)
      .eq('id', inventoryId)
      .single(),

    supabase
      .from('paper_outputs')
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
    ...(lotRes.data as unknown as PaperLot),
    outputs: (outputsRes.data ?? []) as unknown as PaperLotHistory['outputs'],
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function updatePaperLotLocation(
  inventoryId: number,
  location: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('paper_inventory')
    .update({ location: location.trim() || null, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function disablePaperLot(
  inventoryId: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('paper_inventory')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('id', inventoryId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function createPaperRequisition(values: {
  paper_catalog_id:   number
  length_m_requested: number
  width_m_requested:  number
  production_order:   string
  notes?:             string
}): Promise<{ success?: boolean; requisitionId?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'PRODUCER') return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  const { count } = await supabase
    .from('production_requisitions')
    .select('*', { count: 'exact', head: true })

  const dimNote  = `${values.length_m_requested}m × ${values.width_m_requested}m = ${(values.length_m_requested * values.width_m_requested).toFixed(2)} m²`
  const fullNote = values.notes ? `${dimNote}\n${values.notes}` : dimNote

  const { data, error } = await supabase
    .from('production_requisitions')
    .insert({
      material_type:      'PAPER',
      production_order:   values.production_order,
      requested_by:       user.id,
      request_date:       new Date().toISOString().split('T')[0],
      status:             'PENDING',
      notes:              fullNote,
      requisition_number: (count ?? 0) + 1,
    } as any)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/dashboard/requisitions')
  return { success: true, requisitionId: (data as any).id }
}
