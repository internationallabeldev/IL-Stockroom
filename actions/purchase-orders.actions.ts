'use server'

import { createAdminClient }  from '@/lib/supabase/admin'
import { getSessionUser }     from './auth.actions'
import { revalidatePath }     from 'next/cache'
import { setAuditUser }       from '@/lib/supabase/audit'
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
} from '@/lib/validations/purchase-order.schema'
import type { Database } from '@/types/database.types'

type PurchaseOrderRow = Database['public']['Tables']['purchase_orders']['Row']
type InkItemRow       = Database['public']['Tables']['purchase_order_ink_items']['Row']
type PaperItemRow     = Database['public']['Tables']['purchase_order_paper_items']['Row']

export type OrderStatus   = Database['public']['Enums']['purchase_order_status']
export type MaterialType  = Database['public']['Enums']['material_type']

export type PurchaseOrderSummary = PurchaseOrderRow & {
  providers: { id: number; name: string; provider_type: string } | null
  ink_items:   Pick<InkItemRow,  'id' | 'units_ordered' | 'units_received' | 'is_complete' | 'total_kg_ordered'  | 'total_kg_received'>[]
  paper_items: Pick<PaperItemRow,'id' | 'units_ordered' | 'units_received' | 'is_complete' | 'total_m2_ordered'  | 'total_m2_received'>[]
}

export type PurchaseOrderDetail = PurchaseOrderRow & {
  providers: { id: number; name: string; provider_type: string; email: string | null; phone: string; address: string; contact_person: string | null; rfc: string | null; legal_name: string | null; customer_number: string | null } | null
  ink_items: (InkItemRow   & { ink_catalog:   { id: number; code: string; name: string; color_code: string | null; current_stock_kg: number | null } | null })[]
  paper_items: (PaperItemRow & { paper_catalog: { id: number; code: string; name: string; material:   string | null; weight_gsm:       number | null } | null })[]
}

export type OrderFilters = {
  material_type?: MaterialType
  status?: OrderStatus
  provider_id?: number
}

const CAN_CREATE  = ['ADMIN', 'PURCHASER']
const CAN_RECEIVE = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS = ['/dashboard/orders/ink', '/dashboard/orders/paper']

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getPurchaseOrders(filters?: OrderFilters): Promise<PurchaseOrderSummary[]> {
  const supabase = createAdminClient()

  let query = supabase
    .from('purchase_orders')
    .select(`
      id, order_number, material_type, status, request_date, expected_delivery_date,
      actual_delivery_date, created_at, provider_id, requested_by,
      payment_method, shipment_method, delivery_place, notes,
      providers:provider_id ( id, name, provider_type ),
      ink_items:purchase_order_ink_items ( id, units_ordered, units_received, is_complete, total_kg_ordered, total_kg_received ),
      paper_items:purchase_order_paper_items ( id, units_ordered, units_received, is_complete, total_m2_ordered, total_m2_received )
    `)
    .order('order_number', { ascending: false })

  if (filters?.material_type) query = query.eq('material_type', filters.material_type)
  if (filters?.status)        query = query.eq('status', filters.status)
  if (filters?.provider_id)   query = query.eq('provider_id', filters.provider_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as PurchaseOrderSummary[]
}

export async function getPurchaseOrderById(id: number): Promise<PurchaseOrderDetail | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      *,
      providers:provider_id ( id, name, provider_type, email, phone, address, contact_person, rfc, legal_name, customer_number ),
      ink_items:purchase_order_ink_items (
        *, ink_catalog ( id, code, name, color_code, current_stock_kg )
      ),
      paper_items:purchase_order_paper_items (
        *, paper_catalog ( id, code, name, material, weight_gsm )
      )
    `)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as PurchaseOrderDetail
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function createPurchaseOrder(
  values: unknown
): Promise<{ success?: boolean; id?: number; orderNumber?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_CREATE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createPurchaseOrderSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { ink_items, paper_items, ...header } = parsed.data
  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)

  // Derive next order_number from current max
  const { data: last } = await supabase
    .from('purchase_orders')
    .select('order_number')
    .order('order_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const order_number = (last?.order_number ?? 0) + 1

  const { data: order, error: orderError } = await supabase
    .from('purchase_orders')
    .insert({
      ...header,
      order_number,
      requested_by: user.id,
      status: 'PENDING',
    } as any)
    .select('id, order_number')
    .single()

  if (orderError || !order) return { error: orderError?.message ?? 'Error al crear la orden' }

  // Insert items
  if (header.material_type === 'INK' && ink_items?.length) {
    const { error: itemsError } = await supabase
      .from('purchase_order_ink_items')
      .insert(ink_items.map(i => ({ ...i, purchase_order_id: order.id })))

    if (itemsError) {
      await supabase.from('purchase_orders').delete().eq('id', order.id)
      return { error: itemsError.message }
    }
  }

  if (header.material_type === 'PAPER' && paper_items?.length) {
    const { error: itemsError } = await supabase
      .from('purchase_order_paper_items')
      .insert(paper_items.map(i => ({ ...i, purchase_order_id: order.id })))

    if (itemsError) {
      await supabase.from('purchase_orders').delete().eq('id', order.id)
      return { error: itemsError.message }
    }
  }

  PATHS.forEach(p => revalidatePath(p))
  return { success: true, id: order.id, orderNumber: order.order_number }
}

export async function updatePurchaseOrder(
  id: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_CREATE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (!current) return { error: 'Orden no encontrada' }
  if (current.status !== 'PENDING') return { error: 'Solo se pueden editar órdenes en estado PENDIENTE' }

  const parsed = updatePurchaseOrderSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { ink_items, paper_items, ...headerFields } = parsed.data

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('purchase_orders')
    .update({ ...headerFields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  // Replace items when provided (order is PENDING so nothing received yet)
  if (ink_items !== undefined) {
    await supabase.from('purchase_order_ink_items').delete().eq('purchase_order_id', id)
    if (ink_items.length > 0) {
      const { error: itemsError } = await supabase
        .from('purchase_order_ink_items')
        .insert(ink_items.map(i => ({ ...i, purchase_order_id: id })))
      if (itemsError) return { error: itemsError.message }
    }
  }

  if (paper_items !== undefined) {
    await supabase.from('purchase_order_paper_items').delete().eq('purchase_order_id', id)
    if (paper_items.length > 0) {
      const { error: itemsError } = await supabase
        .from('purchase_order_paper_items')
        .insert(paper_items.map(i => ({ ...i, purchase_order_id: id })))
      if (itemsError) return { error: itemsError.message }
    }
  }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/orders/${id}`)
  return { success: true }
}

export async function cancelPurchaseOrder(
  id: number
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_CREATE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { data: current } = await supabase
    .from('purchase_orders')
    .select('status')
    .eq('id', id)
    .single()

  if (!current) return { error: 'Orden no encontrada' }
  if (current.status !== 'PENDING') return { error: 'Solo se pueden cancelar órdenes en estado PENDIENTE' }

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('purchase_orders')
    .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/orders/${id}`)
  return { success: true }
}
