'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import {
  createInkOutputSchema,
  createPaperOutputSchema,
  type CreateInkOutputValues,
  type CreatePaperOutputValues,
} from '@/lib/validations/output.schema'
import type { AvailableInkLot, AvailablePaperLot, RequisitionStatus } from './requisitions.actions'

const CAN_MANAGE = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS      = ['/dashboard/requisitions', '/dashboard/outputs/history']

function invalidate(requisitionId: number) {
  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/requisitions/${requisitionId}`)
}

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getAvailableInkLotsForItem(
  inkCatalogId: number,
): Promise<AvailableInkLot[]> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ink_inventory')
    .select(`
      id, internal_batch, remaining_kg, location,
      ink_catalog:ink_catalog_id ( id, name, code, color_code ),
      receipt:receipt_id ( quality_certificate )
    `)
    .eq('ink_catalog_id', inkCatalogId)
    .eq('enabled', true)
    .gt('remaining_kg', 0)
    .order('remaining_kg', { ascending: false })

  if (error) return []

  return ((data ?? []) as unknown as Array<AvailableInkLot & { receipt: { quality_certificate: string } | null }>)
    .filter(l => l.receipt?.quality_certificate === 'APPROVED')
    .map(l => ({
      id:             l.id,
      internal_batch: l.internal_batch,
      remaining_kg:   l.remaining_kg,
      location:       l.location,
      ink_catalog:    l.ink_catalog,
    }))
}

export async function getAvailablePaperLotsForItem(
  paperCatalogId: number,
): Promise<AvailablePaperLot[]> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('paper_inventory')
    .select(`
      id, internal_batch, remaining_m2, remaining_length_m, initial_width_m, remaining_width_m,
      location,
      paper_catalog:paper_catalog_id ( id, name, code ),
      receipt:receipt_id ( quality_certificate )
    `)
    .eq('paper_catalog_id', paperCatalogId)
    .eq('enabled', true)
    .gt('remaining_m2', 0)
    .order('remaining_m2', { ascending: false })

  if (error) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ((data ?? []) as any[])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((l: any) => l.receipt?.quality_certificate === 'APPROVED')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((l: any) => ({
      id:                 l.id,
      internal_batch:     l.internal_batch,
      remaining_m2:       l.remaining_m2 ?? 0,
      remaining_length_m: l.remaining_length_m ?? 0,
      initial_width_m:    l.initial_width_m,
      remaining_width_m:  l.remaining_width_m ?? null,
      location:           l.location ?? null,
      paper_catalog:      l.paper_catalog ?? null,
    }))
}

// ── Mutations ────────────────────────────────────────────────────────────────

export async function createInkOutput(
  values: CreateInkOutputValues,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createInkOutputSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  // Validate requisition status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, ink_items:requisition_ink_items ( id, ink_catalog_id, kg_requested, kg_delivered )')
    .eq('id', parsed.data.requisition_id)
    .single()

  if (!req) return { error: 'Requisición no encontrada' }
  if (!['APPROVED', 'PARTIAL'].includes(req.status)) return { error: 'La requisición debe estar aprobada' }

  // Validate lot is available and has enough stock
  const { data: lot } = await supabase
    .from('ink_inventory')
    .select('ink_catalog_id, remaining_kg, enabled')
    .eq('id', parsed.data.ink_inventory_id)
    .single()

  if (!lot) return { error: 'Lote no encontrado' }
  if (!lot.enabled) return { error: 'El lote está deshabilitado' }
  if ((lot.remaining_kg ?? 0) < parsed.data.kg_delivered) {
    return { error: `Stock insuficiente. Disponible: ${(lot.remaining_kg ?? 0).toFixed(2)} kg` }
  }

  // Insert output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: outErr } = await (supabase as any)
    .from('ink_outputs')
    .insert({
      requisition_id:   parsed.data.requisition_id,
      ink_inventory_id: parsed.data.ink_inventory_id,
      kg_delivered:     parsed.data.kg_delivered,
      kg_requested:     parsed.data.kg_delivered,
      kg_returned:      0,
      notes:            parsed.data.notes ?? null,
      delivered_by:     user.id,
      received_by:      req.requested_by,
    })

  if (outErr) return { error: outErr.message }

  // Update requisition_ink_items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type InkItem = { id: number; ink_catalog_id: number; kg_requested: number; kg_delivered: number | null }
  const matchingItem = (req.ink_items as InkItem[]).find(i => i.ink_catalog_id === lot.ink_catalog_id)

  if (matchingItem) {
    const newKg       = (matchingItem.kg_delivered ?? 0) + parsed.data.kg_delivered
    const isFulfilled = newKg >= matchingItem.kg_requested

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('requisition_ink_items')
      .update({ kg_delivered: newKg, is_fulfilled: isFulfilled })
      .eq('id', matchingItem.id)
  }

  // Refresh items and update requisition status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('requisition_ink_items')
    .select('is_fulfilled')
    .eq('requisition_id', parsed.data.requisition_id)

  const allFulfilled = (items ?? []).every((i: { is_fulfilled: boolean }) => i.is_fulfilled)
  const newStatus: RequisitionStatus = allFulfilled ? 'FULFILLED' : 'PARTIAL'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('production_requisitions')
    .update({
      status:       newStatus,
      fulfilled_by: user.id,
      ...(newStatus === 'FULFILLED' ? { fulfilled_at: new Date().toISOString() } : {}),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', parsed.data.requisition_id)

  invalidate(parsed.data.requisition_id)
  return { success: true }
}

export async function createPaperOutput(
  values: CreatePaperOutputValues,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createPaperOutputSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()

  // Validate requisition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, paper_items:requisition_paper_items ( id, paper_catalog_id, m2_requested, m2_delivered )')
    .eq('id', parsed.data.requisition_id)
    .single()

  if (!req) return { error: 'Requisición no encontrada' }
  if (!['APPROVED', 'PARTIAL'].includes(req.status)) return { error: 'La requisición debe estar aprobada' }

  // Validate lot
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: lot } = await (supabase as any)
    .from('paper_inventory')
    .select('paper_catalog_id, remaining_m2, initial_width_m, remaining_length_m, internal_batch, receipt_id, enabled')
    .eq('id', parsed.data.paper_inventory_id)
    .single()

  if (!lot) return { error: 'Bobina no encontrada' }
  if (!lot.enabled) return { error: 'La bobina está deshabilitada' }
  if (parsed.data.width_m_delivered > lot.initial_width_m) {
    return { error: `El ancho supera el de la bobina (${lot.initial_width_m.toFixed(3)} m)` }
  }

  const m2 = parsed.data.length_m_delivered * parsed.data.width_m_delivered

  // Insert paper_output
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: outErr } = await (supabase as any)
    .from('paper_outputs')
    .insert({
      requisition_id:      parsed.data.requisition_id,
      paper_inventory_id:  parsed.data.paper_inventory_id,
      length_m_delivered:  parsed.data.length_m_delivered,
      length_m_requested:  parsed.data.length_m_delivered,
      width_m_delivered:   parsed.data.width_m_delivered,
      width_m_requested:   parsed.data.width_m_delivered,
      m2_delivered:        m2,
      m2_requested:        m2,
      m2_returned:         0,
      notes:               parsed.data.notes ?? null,
      delivered_by:        user.id,
      received_by:         req.requested_by,
    })

  if (outErr) return { error: outErr.message }

  // Handle bobina split
  if (parsed.data.generates_split && parsed.data.split_lot_a && parsed.data.split_lot_b) {
    // Disable original lot
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('paper_inventory')
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq('id', parsed.data.paper_inventory_id)

    const remainingWidth = lot.initial_width_m - parsed.data.width_m_delivered

    // Lot A: remaining roll
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('paper_inventory')
      .insert({
        paper_catalog_id:    lot.paper_catalog_id,
        initial_length_m:    lot.remaining_length_m,
        initial_width_m:     remainingWidth,
        internal_batch:      parsed.data.split_lot_a.internal_batch,
        location:            parsed.data.split_lot_a.location ?? null,
        parent_inventory_id: parsed.data.paper_inventory_id,
        receipt_id:          lot.receipt_id,
        enabled:             true,
      })

    // Lot B: delivered cut
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('paper_inventory')
      .insert({
        paper_catalog_id:    lot.paper_catalog_id,
        initial_length_m:    parsed.data.length_m_delivered,
        initial_width_m:     parsed.data.width_m_delivered,
        internal_batch:      parsed.data.split_lot_b.internal_batch,
        location:            parsed.data.split_lot_b.location ?? null,
        parent_inventory_id: parsed.data.paper_inventory_id,
        receipt_id:          lot.receipt_id,
        enabled:             true,
      })
  }

  // Update requisition_paper_items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type PaperItem = { id: number; paper_catalog_id: number; m2_requested: number | null; m2_delivered: number | null }
  const matchingItem = (req.paper_items as PaperItem[]).find(i => i.paper_catalog_id === lot.paper_catalog_id)

  if (matchingItem) {
    const newM2       = (matchingItem.m2_delivered ?? 0) + m2
    const isFulfilled = matchingItem.m2_requested != null && newM2 >= matchingItem.m2_requested

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('requisition_paper_items')
      .update({ m2_delivered: newM2, is_fulfilled: isFulfilled })
      .eq('id', matchingItem.id)
  }

  // Refresh and update requisition status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: items } = await (supabase as any)
    .from('requisition_paper_items')
    .select('is_fulfilled')
    .eq('requisition_id', parsed.data.requisition_id)

  const allFulfilled = (items ?? []).every((i: { is_fulfilled: boolean }) => i.is_fulfilled)
  const newStatus: RequisitionStatus = allFulfilled ? 'FULFILLED' : 'PARTIAL'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('production_requisitions')
    .update({
      status:       newStatus,
      fulfilled_by: user.id,
      ...(newStatus === 'FULFILLED' ? { fulfilled_at: new Date().toISOString() } : {}),
      updated_at:   new Date().toISOString(),
    })
    .eq('id', parsed.data.requisition_id)

  invalidate(parsed.data.requisition_id)
  return { success: true }
}

export async function registerInkReturn(
  outputId: number,
  kgReturned: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: out } = await (supabase as any)
    .from('ink_outputs')
    .select('kg_delivered, requisition_id')
    .eq('id', outputId)
    .single()

  if (!out) return { error: 'Salida no encontrada' }
  if (kgReturned > out.kg_delivered) {
    return { error: `No puedes devolver más de lo entregado (${out.kg_delivered.toFixed(2)} kg)` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ink_outputs')
    .update({ kg_returned: kgReturned, updated_at: new Date().toISOString() })
    .eq('id', outputId)

  if (error) return { error: error.message }
  invalidate(out.requisition_id)
  return { success: true }
}

export async function registerPaperReturn(
  outputId: number,
  lengthReturned: number,
  widthReturned: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: out } = await (supabase as any)
    .from('paper_outputs')
    .select('m2_delivered, length_m_delivered, width_m_delivered, requisition_id')
    .eq('id', outputId)
    .single()

  if (!out) return { error: 'Salida no encontrada' }

  const m2Returned = lengthReturned * widthReturned
  if (m2Returned > (out.m2_delivered ?? 0)) {
    return { error: `No puedes devolver más de lo entregado (${(out.m2_delivered ?? 0).toFixed(3)} m²)` }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('paper_outputs')
    .update({
      length_m_returned: lengthReturned,
      width_m_returned:  widthReturned,
      updated_at:        new Date().toISOString(),
    })
    .eq('id', outputId)

  if (error) return { error: error.message }
  invalidate(out.requisition_id)
  return { success: true }
}
