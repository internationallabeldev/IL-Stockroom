'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import {
  createInkReceiptSchema,
  createPaperReceiptSchema,
  updateQualitySchema,
} from '@/lib/validations/receipt.schema'
import type { Database } from '@/types/database.types'

type QualityCertificate = Database['public']['Enums']['quality_certificate']

// ─── Types ─────────────────────────────────────────────────────────────────────

export type InkReceiptRow   = Database['public']['Tables']['ink_receipts']['Row']
export type PaperReceiptRow = Database['public']['Tables']['paper_receipts']['Row']

export type InkReceiptWithContext = InkReceiptRow & {
  purchase_order_item: {
    id: number
    purchase_order_id: number
    ink_catalog: { id: number; code: string; name: string } | null
    purchase_order: {
      id: number
      order_number: number
      providers: { name: string } | null
    } | null
  } | null
}

export type PaperReceiptWithContext = PaperReceiptRow & {
  purchase_order_item: {
    id: number
    purchase_order_id: number
    paper_catalog: { id: number; code: string; name: string } | null
    purchase_order: {
      id: number
      order_number: number
      providers: { name: string } | null
    } | null
  } | null
}

export type OrderWithReceipts = {
  id: number
  order_number: number
  material_type: 'INK' | 'PAPER'
  status: string | null
  providers: { id: number; name: string } | null
  ink_items: Array<{
    id: number
    ink_catalog_id: number
    units_ordered: number
    units_received: number | null
    kg_per_unit: number
    total_kg_ordered: number | null
    total_kg_received: number | null
    is_complete: boolean | null
    item_notes: string | null
    ink_catalog: { id: number; code: string; name: string; color_code: string | null } | null
    ink_receipts: InkReceiptRow[]
  }>
  paper_items: Array<{
    id: number
    paper_catalog_id: number
    units_ordered: number
    units_received: number | null
    length_m_per_unit: number
    width_m: number
    total_m2_ordered: number | null
    total_m2_received: number | null
    is_complete: boolean | null
    item_notes: string | null
    paper_catalog: { id: number; code: string; name: string; material: string | null; weight_gsm: number | null } | null
    paper_receipts: PaperReceiptRow[]
  }>
}

export type ReceivableOrder = {
  id: number
  order_number: number
  material_type: 'INK' | 'PAPER'
  status: string | null
  expected_delivery_date: string | null
  providers: { id: number; name: string } | null
  ink_items:   { id: number; units_ordered: number; units_received: number | null; is_complete: boolean | null }[]
  paper_items: { id: number; units_ordered: number; units_received: number | null; is_complete: boolean | null }[]
}

const CAN_RECEIVE  = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS        = ['/dashboard/receipts', '/dashboard/orders/ink', '/dashboard/orders/paper']

// ─── Queries ───────────────────────────────────────────────────────────────────

export async function getPendingQualityReceipts(): Promise<{
  inkReceipts: InkReceiptWithContext[]
  paperReceipts: PaperReceiptWithContext[]
}> {
  const supabase = createAdminClient()

  const [inkRes, paperRes] = await Promise.all([
    supabase
      .from('ink_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_ink_items (
          id, purchase_order_id,
          ink_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),

    supabase
      .from('paper_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_paper_items (
          id, purchase_order_id,
          paper_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),
  ])

  return {
    inkReceipts:   (inkRes.data   ?? []) as unknown as InkReceiptWithContext[],
    paperReceipts: (paperRes.data ?? []) as unknown as PaperReceiptWithContext[],
  }
}

export async function getAllReceipts(): Promise<{
  inkReceipts: InkReceiptWithContext[]
  paperReceipts: PaperReceiptWithContext[]
}> {
  const supabase = createAdminClient()

  const [inkRes, paperRes] = await Promise.all([
    supabase
      .from('ink_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_ink_items (
          id, purchase_order_id,
          ink_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .order('receipt_date', { ascending: false })
      .limit(500),

    supabase
      .from('paper_receipts')
      .select(`
        *,
        purchase_order_item:purchase_order_paper_items (
          id, purchase_order_id,
          paper_catalog ( id, code, name ),
          purchase_order:purchase_orders ( id, order_number, providers:provider_id ( name ) )
        )
      `)
      .order('receipt_date', { ascending: false })
      .limit(500),
  ])

  return {
    inkReceipts:   (inkRes.data   ?? []) as unknown as InkReceiptWithContext[],
    paperReceipts: (paperRes.data ?? []) as unknown as PaperReceiptWithContext[],
  }
}

export async function getOrderWithReceipts(orderId: number): Promise<OrderWithReceipts | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('purchase_orders')
    .select(`
      id, order_number, material_type, status,
      providers:provider_id ( id, name ),
      ink_items:purchase_order_ink_items (
        id, ink_catalog_id, units_ordered, units_received, kg_per_unit,
        total_kg_ordered, total_kg_received, is_complete, item_notes,
        ink_catalog ( id, code, name, color_code ),
        ink_receipts (*)
      ),
      paper_items:purchase_order_paper_items (
        id, paper_catalog_id, units_ordered, units_received, length_m_per_unit, width_m,
        total_m2_ordered, total_m2_received, is_complete, item_notes,
        paper_catalog ( id, code, name, material, weight_gsm ),
        paper_receipts (*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (error) return null
  return data as unknown as OrderWithReceipts
}

export async function getReceivableOrders(): Promise<{
  inkOrders: ReceivableOrder[]
  paperOrders: ReceivableOrder[]
}> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('purchase_orders')
    .select(`
      id, order_number, material_type, status, expected_delivery_date,
      providers:provider_id ( id, name ),
      ink_items:purchase_order_ink_items ( id, units_ordered, units_received, is_complete ),
      paper_items:purchase_order_paper_items ( id, units_ordered, units_received, is_complete )
    `)
    .in('status', ['PENDING', 'PARTIAL'])
    .order('order_number', { ascending: false })

  const orders = (data ?? []) as unknown as ReceivableOrder[]

  return {
    inkOrders:   orders.filter(o => o.material_type === 'INK'),
    paperOrders: orders.filter(o => o.material_type === 'PAPER'),
  }
}

// ─── Mutations ─────────────────────────────────────────────────────────────────

export async function createInkReceipt(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createInkReceiptSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  const d = parsed.data

  // Check internal_batch uniqueness
  const { data: existing } = await supabase
    .from('ink_receipts')
    .select('id')
    .eq('internal_batch', d.internal_batch)
    .maybeSingle()

  if (existing) return { error: `El lote interno "${d.internal_batch}" ya existe` }

  // Fetch current item state
  const { data: item } = await supabase
    .from('purchase_order_ink_items')
    .select('units_ordered, units_received, purchase_order_id')
    .eq('id', d.purchase_order_item_id)
    .single()

  if (!item) return { error: 'Artículo de orden no encontrado' }

  const { error: receiptError } = await supabase
    .from('ink_receipts')
    .insert({
      purchase_order_item_id: d.purchase_order_item_id,
      receipt_date:           d.receipt_date,
      invoice_remission:      d.invoice_remission,
      provider_batch:         d.provider_batch,
      internal_batch:         d.internal_batch,
      units_received:         d.units_received,
      kg_received:            d.kg_received,
      quality_certificate:    d.quality_certificate as QualityCertificate,
      quality_notes:          d.quality_notes ?? null,
      received_by:            user.id,
    })

  if (receiptError) return { error: receiptError.message }

  await _updateOrderItemAndStatus(supabase, item.purchase_order_id, d.purchase_order_item_id, d.units_received, item.units_ordered, item.units_received ?? 0, 'INK')

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/receipts/${item.purchase_order_id}`)
  return { success: true }
}

export async function createPaperReceipt(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createPaperReceiptSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  const d = parsed.data

  // Check internal_batch uniqueness
  const { data: existing } = await supabase
    .from('paper_receipts')
    .select('id')
    .eq('internal_batch', d.internal_batch)
    .maybeSingle()

  if (existing) return { error: `El lote interno "${d.internal_batch}" ya existe` }

  const { data: item } = await supabase
    .from('purchase_order_paper_items')
    .select('units_ordered, units_received, purchase_order_id')
    .eq('id', d.purchase_order_item_id)
    .single()

  if (!item) return { error: 'Artículo de orden no encontrado' }

  const { error: receiptError } = await supabase
    .from('paper_receipts')
    .insert({
      purchase_order_item_id: d.purchase_order_item_id,
      receipt_date:           d.receipt_date,
      invoice_remission:      d.invoice_remission,
      provider_batch:         d.provider_batch,
      internal_batch:         d.internal_batch,
      units_received:         d.units_received,
      length_m:               d.length_m,
      width_m:                d.width_m,
      total_m2_received:      d.units_received * d.length_m * d.width_m,
      quality_certificate:    d.quality_certificate as QualityCertificate,
      quality_notes:          d.quality_notes ?? null,
      received_by:            user.id,
    })

  if (receiptError) return { error: receiptError.message }

  await _updateOrderItemAndStatus(supabase, item.purchase_order_id, d.purchase_order_item_id, d.units_received, item.units_ordered, item.units_received ?? 0, 'PAPER')

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/receipts/${item.purchase_order_id}`)
  return { success: true }
}

export async function updateInkReceiptQuality(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updateQualitySchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('ink_receipts')
    .update({
      quality_certificate: parsed.data.quality_certificate as QualityCertificate,
      quality_notes:       parsed.data.quality_notes ?? null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', receiptId)

  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function updatePaperReceiptQuality(
  receiptId: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_RECEIVE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = updateQualitySchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('paper_receipts')
    .update({
      quality_certificate: parsed.data.quality_certificate as QualityCertificate,
      quality_notes:       parsed.data.quality_notes ?? null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', receiptId)

  if (error) return { error: error.message }

  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _updateOrderItemAndStatus(
  supabase: ReturnType<typeof createAdminClient>,
  orderId: number,
  itemId: number,
  newUnitsInReceipt: number,
  unitsOrdered: number,
  prevUnitsReceived: number,
  materialType: 'INK' | 'PAPER'
) {
  const newUnitsReceived = prevUnitsReceived + newUnitsInReceipt
  const isComplete       = newUnitsReceived >= unitsOrdered

  const itemTable = materialType === 'INK'
    ? 'purchase_order_ink_items'
    : 'purchase_order_paper_items'

  await supabase
    .from(itemTable as 'purchase_order_ink_items')
    .update({ units_received: newUnitsReceived, is_complete: isComplete } as any)
    .eq('id', itemId)

  // Re-read all items to determine order status
  const { data: allItems } = await supabase
    .from(itemTable as 'purchase_order_ink_items')
    .select('is_complete, units_received')
    .eq('purchase_order_id', orderId) as any

  const items = (allItems ?? []) as Array<{ is_complete: boolean | null; units_received: number | null }>

  const allComplete  = items.every(i => i.is_complete || (i.units_received ?? 0) >= unitsOrdered)
  const anyReceived  = items.some(i => (i.units_received ?? 0) > 0)

  const newStatus = allComplete ? 'COMPLETED' : anyReceived ? 'PARTIAL' : 'PENDING'

  await supabase
    .from('purchase_orders')
    .update({
      status: newStatus,
      actual_delivery_date: newStatus === 'COMPLETED' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
}
