'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import { setAuditUser }      from '@/lib/supabase/audit'
import { notifyRoles, notifyUsers } from './notifications.actions'
import {
  createInkRequisitionSchema,
  createPaperRequisitionSchema,
  rejectRequisitionSchema,
  type CreateInkRequisitionValues,
  type CreatePaperRequisitionValues,
  type FulfillInkOutput,
  type FulfillPaperOutput,
} from '@/lib/validations/requisition.schema'

// ── Types ────────────────────────────────────────────────────────────────────

export type RequisitionStatus = 'PENDING' | 'APPROVED' | 'PARTIAL' | 'FULFILLED' | 'REJECTED' | 'CANCELLED'
export type MaterialType      = 'INK' | 'PAPER'

export type RequisitionInkItem = {
  id:             number
  requisition_id: number
  ink_catalog_id: number
  kg_requested:   number
  kg_delivered:   number | null
  is_fulfilled:   boolean | null
  created_at:     string | null
  ink_catalog:    { id: number; code: string; name: string; color_code: string | null } | null
}

export type RequisitionPaperItem = {
  id:                  number
  requisition_id:      number
  paper_catalog_id:    number
  length_m_requested:  number
  width_m_requested:   number
  m2_requested:        number | null
  m2_delivered:        number | null
  is_fulfilled:        boolean | null
  created_at:          string | null
  paper_catalog:       { id: number; code: string; name: string } | null
}

export type InkOutputRecord = {
  id:               number
  requisition_id:   number
  ink_inventory_id: number
  kg_delivered:     number
  kg_requested:     number
  kg_returned:      number | null
  notes:            string | null
  received_by:      string
  delivered_by:     string
  output_date:      string
  created_at:       string | null
  delivered_by_user: { first_name: string | null; last_name: string | null } | null
  ink_inventory:    { internal_batch: string; ink_catalog_id: number; ink_catalog: { name: string; color_code: string | null } | null } | null
}

export type PaperOutputRecord = {
  id:                   number
  requisition_id:       number
  paper_inventory_id:   number
  length_m_delivered:   number
  length_m_requested:   number
  length_m_returned:    number | null
  width_m_delivered:    number
  width_m_requested:    number
  width_m_returned:     number | null
  m2_delivered:         number | null
  m2_requested:         number | null
  m2_returned:          number | null
  notes:                string | null
  received_by:          string
  delivered_by:         string
  output_date:          string
  created_at:           string | null
  delivered_by_user:    { first_name: string | null; last_name: string | null } | null
  paper_inventory:      { internal_batch: string; paper_catalog_id: number; paper_catalog: { name: string } | null } | null
}

export type Requisition = {
  id:                 number
  requisition_number: number
  material_type:      MaterialType
  requested_by:       string
  approved_by:        string | null
  fulfilled_by:       string | null
  production_order:   string
  status:             RequisitionStatus
  notes:              string | null
  request_date:       string
  approved_at:        string | null
  fulfilled_at:       string | null
  created_at:         string | null
  updated_at:         string | null
  requester:          { first_name: string; last_name: string; email: string } | null
  approver:           { first_name: string | null; last_name: string | null } | null
  ink_items:          RequisitionInkItem[]
  paper_items:        RequisitionPaperItem[]
  ink_outputs:        InkOutputRecord[]
  paper_outputs:      PaperOutputRecord[]
}

export type AvailableInkLot = {
  id:             number
  internal_batch: string
  remaining_kg:   number
  location:       string | null
  ink_catalog:    { id: number; name: string; code: string; color_code: string | null } | null
}

export type AvailablePaperLot = {
  id:                 number
  internal_batch:     string
  remaining_m2:       number
  remaining_length_m: number
  initial_width_m:    number
  remaining_width_m:  number | null
  location:           string | null
  paper_catalog:      { id: number; name: string; code: string } | null
}

export type RequisitionFilters = {
  status?:        RequisitionStatus | ''
  statuses?:      RequisitionStatus[]
  material_type?: MaterialType | ''
  requested_by?:  string
  date_from?:     string
  date_to?:       string
}

const CAN_MANAGE = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATHS      = ['/dashboard/requisitions']

// ── Full select fragment ─────────────────────────────────────────────────────

const FULL_SELECT = `
  *,
  requester:requested_by ( first_name, last_name, email ),
  approver:approved_by   ( first_name, last_name ),
  ink_items:requisition_ink_items (
    *,
    ink_catalog:ink_catalog_id ( id, code, name, color_code )
  ),
  paper_items:requisition_paper_items (
    *,
    paper_catalog:paper_catalog_id ( id, code, name )
  ),
  ink_outputs (
    *,
    delivered_by_user:delivered_by ( first_name, last_name ),
    ink_inventory:ink_inventory_id (
      internal_batch,
      ink_catalog_id,
      ink_catalog:ink_catalog_id ( name, color_code )
    )
  ),
  paper_outputs (
    *,
    delivered_by_user:delivered_by ( first_name, last_name ),
    paper_inventory:paper_inventory_id (
      internal_batch,
      paper_catalog_id,
      paper_catalog:paper_catalog_id ( name )
    )
  )
`

// ── Queries ──────────────────────────────────────────────────────────────────

export async function getRequisitions(filters?: RequisitionFilters): Promise<Requisition[]> {
  const supabase = createAdminClient()
  const user     = await getSessionUser()
  if (!user) return []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('production_requisitions')
    .select(FULL_SELECT)
    .order('request_date', { ascending: false })

  if (user.role === 'PRODUCER') query = query.eq('requested_by', user.id)

  if (filters?.statuses?.length) query = query.in('status', filters.statuses)
  else if (filters?.status)      query = query.eq('status', filters.status)
  if (filters?.material_type)    query = query.eq('material_type', filters.material_type)
  if (filters?.requested_by)  query = query.eq('requested_by', filters.requested_by)
  if (filters?.date_from)     query = query.gte('request_date', filters.date_from)
  if (filters?.date_to)       query = query.lte('request_date', filters.date_to)

  const { data, error } = await query
  if (error) return []
  return (data ?? []) as unknown as Requisition[]
}

export async function getRequisitionById(id: number): Promise<Requisition | null> {
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('production_requisitions')
    .select(FULL_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as unknown as Requisition
}

export async function getPendingRequisitions(): Promise<Requisition[]> {
  return getRequisitions({ status: 'PENDING' })
}

// ── Catalog helpers ──────────────────────────────────────────────────────────

export type InkCatalogForRequisition = {
  id: number; code: string; name: string
  color_code: string | null; current_stock_kg: number | null; min_stock_kg: number
}

export type PaperCatalogForRequisition = {
  id: number; code: string; name: string
  current_stock_m2: number | null; standard_width_m: number | null
  weight_gsm: number | null; min_stock_m2: number | null
}

export async function getInkCatalogWithStock(): Promise<InkCatalogForRequisition[]> {
  const supabase = createAdminClient()

  const { data: lots } = await supabase
    .from('ink_inventory')
    .select('ink_catalog_id, receipt:receipt_id ( quality_certificate )')
    .eq('enabled', true)
    .gt('remaining_kg', 0)

  const ids = [...new Set(
    ((lots ?? []) as unknown as Array<{ ink_catalog_id: number; receipt: { quality_certificate: string } | null }>)
      .filter(l => l.receipt?.quality_certificate === 'APPROVED')
      .map(l => l.ink_catalog_id),
  )]
  if (!ids.length) return []

  const { data } = await supabase
    .from('ink_catalog')
    .select('id, code, name, color_code, current_stock_kg, min_stock_kg')
    .in('id', ids)
    .eq('enabled', true)
    .order('name')

  return (data ?? []) as InkCatalogForRequisition[]
}

export async function getPaperCatalogWithStock(): Promise<PaperCatalogForRequisition[]> {
  const supabase = createAdminClient()

  const { data: lots } = await (supabase as any)
    .from('paper_inventory')
    .select('paper_catalog_id, receipt:receipt_id ( quality_certificate )')
    .eq('enabled', true)
    .gt('remaining_m2', 0)

  const ids = [...new Set(
    ((lots ?? []) as Array<{ paper_catalog_id: number; receipt: { quality_certificate: string } | null }>)
      .filter(l => l.receipt?.quality_certificate === 'APPROVED')
      .map(l => l.paper_catalog_id),
  )]
  if (!ids.length) return []

  const { data } = await supabase
    .from('paper_catalog')
    .select('id, code, name, current_stock_m2, standard_width_m, weight_gsm, min_stock_m2')
    .in('id', ids)
    .eq('enabled', true)
    .order('name')

  return (data ?? []) as PaperCatalogForRequisition[]
}

export async function getAvailableInkLots(inkCatalogId: number): Promise<AvailableInkLot[]> {
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

export async function getAvailablePaperLots(paperCatalogId: number): Promise<AvailablePaperLot[]> {
  const supabase = createAdminClient()

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

  return ((data ?? []) as any[])
    .filter((l: any) => l.receipt?.quality_certificate === 'APPROVED')
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

export async function createInkRequisition(
  values: CreateInkRequisitionValues,
): Promise<{ success?: boolean; requisitionId?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role === 'USER') return { error: 'Sin permisos' }

  const parsed = createInkRequisitionSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('production_requisitions')
    .select('*', { count: 'exact', head: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req, error: reqErr } = await (supabase as any)
    .from('production_requisitions')
    .insert({
      material_type:      'INK',
      production_order:   parsed.data.production_order,
      requested_by:       user.id,
      status:             'PENDING',
      notes:              parsed.data.notes ?? null,
      requisition_number: (count ?? 0) + 1,
    })
    .select('id')
    .single()

  if (reqErr) return { error: reqErr.message }

  const items = parsed.data.items.map(item => ({
    requisition_id: req.id,
    ink_catalog_id: item.ink_catalog_id,
    kg_requested:   item.kg_requested,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsErr } = await (supabase as any).from('requisition_ink_items').insert(items)
  if (itemsErr) return { error: itemsErr.message }

  await notifyRoles(CAN_MANAGE, {
    type:  'pending_requisitions',
    title: `Nueva requisición de tinta — OP ${parsed.data.production_order}`,
    body:  `${parsed.data.items.length} material(es) esperando aprobación.`,
    link:  `/dashboard/requisitions/${req.id}`,
    metadata: { requisition_id: req.id, material: 'INK' },
    email: { badge: '📋 Requisición pendiente', subtitle: `Solicitada por ${user.first_name} ${user.last_name}` },
  })

  PATHS.forEach(p => revalidatePath(p))
  return { success: true, requisitionId: req.id }
}

export async function createPaperRequisition(
  values: CreatePaperRequisitionValues,
): Promise<{ success?: boolean; requisitionId?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role === 'USER') return { error: 'Sin permisos' }

  const parsed = createPaperRequisitionSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from('production_requisitions')
    .select('*', { count: 'exact', head: true })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req, error: reqErr } = await (supabase as any)
    .from('production_requisitions')
    .insert({
      material_type:      'PAPER',
      production_order:   parsed.data.production_order,
      requested_by:       user.id,
      status:             'PENDING',
      notes:              parsed.data.notes ?? null,
      requisition_number: (count ?? 0) + 1,
    })
    .select('id')
    .single()

  if (reqErr) return { error: reqErr.message }

  const items = parsed.data.items.map(item => ({
    requisition_id:     req.id,
    paper_catalog_id:   item.paper_catalog_id,
    length_m_requested: item.length_m_requested,
    width_m_requested:  item.width_m_requested,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itemsErr } = await (supabase as any).from('requisition_paper_items').insert(items)
  if (itemsErr) return { error: itemsErr.message }

  await notifyRoles(CAN_MANAGE, {
    type:  'pending_requisitions',
    title: `Nueva requisición de papel — OP ${parsed.data.production_order}`,
    body:  `${parsed.data.items.length} material(es) esperando aprobación.`,
    link:  `/dashboard/requisitions/${req.id}`,
    metadata: { requisition_id: req.id, material: 'PAPER' },
    email: { badge: '📋 Requisición pendiente', subtitle: `Solicitada por ${user.first_name} ${user.last_name}` },
  })

  PATHS.forEach(p => revalidatePath(p))
  return { success: true, requisitionId: req.id }
}

export async function approveRequisition(
  id: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, production_order')
    .eq('id', id)
    .single()

  if (req?.status !== 'PENDING') return { error: 'Solo se pueden aprobar requisiciones pendientes' }

  await setAuditUser(supabase, user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('production_requisitions')
    .update({
      status:      'APPROVED',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (req.requested_by) {
    await notifyUsers([req.requested_by], {
      type:  'requisition_approved',
      title: `Requisición aprobada — OP ${req.production_order}`,
      body:  'Tu requisición de producción fue aprobada.',
      link:  `/dashboard/requisitions/${id}`,
      metadata: { requisition_id: id },
      email: { badge: '✅ Requisición aprobada' },
    })
  }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/requisitions/${id}`)
  return { success: true }
}

export async function rejectRequisition(
  id: number,
  reason: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, production_order')
    .eq('id', id)
    .single()

  if (req?.status !== 'PENDING') return { error: 'Solo se pueden rechazar requisiciones pendientes' }

  await setAuditUser(supabase, user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('production_requisitions')
    .update({
      status:      'REJECTED',
      approved_by: user.id,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }

  if (req.requested_by) {
    await notifyUsers([req.requested_by], {
      type:  'requisition_rejected',
      title: `Requisición rechazada — OP ${req.production_order}`,
      body:  reason ? `Motivo: ${reason}` : 'Tu requisición de producción fue rechazada.',
      link:  `/dashboard/requisitions/${id}`,
      metadata: { requisition_id: id },
      email: { badge: '❌ Requisición rechazada' },
    })
  }

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/requisitions/${id}`)
  return { success: true }
}

export async function fulfillInkRequisition(
  requisitionId: number,
  outputs: FulfillInkOutput[],
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }
  if (!outputs.length) return { error: 'Debes especificar al menos una salida' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, production_order, ink_items:requisition_ink_items ( id, ink_catalog_id, kg_requested, kg_delivered )')
    .eq('id', requisitionId)
    .single()

  if (!req) return { error: 'Requisición no encontrada' }
  if (!['APPROVED', 'PARTIAL'].includes(req.status)) return { error: 'La requisición debe estar aprobada o parcial' }

  await setAuditUser(supabase, user.id)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: outErr } = await (supabase as any)
    .from('ink_outputs')
    .insert(outputs.map(o => ({
      requisition_id:   requisitionId,
      ink_inventory_id: o.inventory_id,
      kg_delivered:     o.kg_delivered,
      kg_requested:     o.kg_delivered,
      kg_returned:      0,
      delivered_by:     user.id,
      received_by:      req.requested_by,
    })))

  if (outErr) return { error: outErr.message }

  // Re-fetch ALL outputs for this requisition as the authoritative source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allOutputs } = await (supabase as any)
    .from('ink_outputs')
    .select('ink_inventory_id, kg_delivered')
    .eq('requisition_id', requisitionId)

  const allInvIds = [...new Set(((allOutputs ?? []) as { ink_inventory_id: number }[]).map(o => o.ink_inventory_id))]
  const { data: allLots } = await supabase
    .from('ink_inventory')
    .select('id, ink_catalog_id')
    .in('id', allInvIds.length ? allInvIds : [0])

  const lotCatalog = new Map((allLots ?? []).map(l => [l.id, l.ink_catalog_id]))

  const kgByCatalog = new Map<number, number>()
  for (const o of (allOutputs ?? []) as { ink_inventory_id: number; kg_delivered: number }[]) {
    const catId = lotCatalog.get(o.ink_inventory_id)
    if (catId !== undefined) kgByCatalog.set(catId, (kgByCatalog.get(catId) ?? 0) + o.kg_delivered)
  }

  let allFulfilled = true
  for (const item of req.ink_items as RequisitionInkItem[]) {
    const totalDel    = kgByCatalog.get(item.ink_catalog_id) ?? 0
    const kgReq       = parseFloat(String(item.kg_requested)) || 0
    const isFulfilled = kgReq > 0 && totalDel >= kgReq
    if (!isFulfilled) allFulfilled = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('requisition_ink_items')
      .update({ kg_delivered: totalDel, is_fulfilled: isFulfilled })
      .eq('id', item.id)
  }

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
    .eq('id', requisitionId)

  // Notify the requester that material was delivered (full or partial)
  await notifyUsers([req.requested_by], {
    type:  'requisition_fulfilled',
    title: newStatus === 'FULFILLED'
      ? `Requisición surtida — OP ${req.production_order}`
      : `Entrega parcial — OP ${req.production_order}`,
    body:  newStatus === 'FULFILLED'
      ? 'Tu requisición fue surtida por completo.'
      : 'Se entregó parte de tu requisición; queda pendiente el resto.',
    link:  `/dashboard/requisitions/${requisitionId}`,
    metadata: { requisition_id: requisitionId, status: newStatus },
    email: { badge: newStatus === 'FULFILLED' ? '📦 Requisición surtida' : '📦 Entrega parcial' },
  })

  await alertInkLowStock(supabase, outputs, lotCatalog)

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/requisitions/${requisitionId}`)
  return { success: true }
}

/** Fire a low-stock notification when a catalog item crosses below its minimum. */
async function alertInkLowStock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  outputs: FulfillInkOutput[],
  lotCatalog: Map<number, number>,
): Promise<void> {
  const deltaByCatalog = new Map<number, number>()
  for (const o of outputs) {
    const catId = lotCatalog.get(o.inventory_id)
    if (catId !== undefined) deltaByCatalog.set(catId, (deltaByCatalog.get(catId) ?? 0) + o.kg_delivered)
  }
  if (deltaByCatalog.size === 0) return

  const { data: cats } = await supabase
    .from('ink_catalog')
    .select('id, name, current_stock_kg, min_stock_kg')
    .in('id', [...deltaByCatalog.keys()])

  for (const c of (cats ?? []) as { id: number; name: string; current_stock_kg: number | null; min_stock_kg: number | null }[]) {
    const after  = c.current_stock_kg ?? 0
    const min    = c.min_stock_kg ?? 0
    const before = after + (deltaByCatalog.get(c.id) ?? 0)
    // Only when it just crossed below the minimum (avoids repeat spam)
    if (min > 0 && before >= min && after < min) {
      await notifyRoles(['ADMIN', 'WAREHOUSE_MANAGER'], {
        type:  'low_stock',
        title: `Stock bajo: ${c.name}`,
        body:  `Quedan ${after.toFixed(2)} kg (mínimo ${min} kg).`,
        link:  '/dashboard/inventory/inks',
        metadata: { ink_catalog_id: c.id },
        email: { badge: '⚠️ Stock bajo', subtitle: c.name },
      })
    }
  }
}

export async function fulfillPaperRequisition(
  requisitionId: number,
  outputs: FulfillPaperOutput[],
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }
  if (!outputs.length) return { error: 'Debes especificar al menos una salida' }

  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: req } = await (supabase as any)
    .from('production_requisitions')
    .select('status, requested_by, production_order, paper_items:requisition_paper_items ( id, paper_catalog_id, m2_requested, m2_delivered )')
    .eq('id', requisitionId)
    .single()

  if (!req) return { error: 'Requisición no encontrada' }
  if (!['APPROVED', 'PARTIAL'].includes(req.status)) return { error: 'La requisición debe estar aprobada o parcial' }

  await setAuditUser(supabase, user.id)
  // Pre-fetch lot catalog IDs
  const { data: origLots } = await (supabase as any)
    .from('paper_inventory')
    .select('id, paper_catalog_id')
    .in('id', outputs.map(o => o.inventory_id))

  const lotCatalog = new Map((origLots ?? []).map((l: any) => [l.id, l.paper_catalog_id]))

  for (const output of outputs) {
    const m2 = output.length_m * output.width_m

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: outErr } = await (supabase as any)
      .from('paper_outputs')
      .insert({
        requisition_id:      requisitionId,
        paper_inventory_id:  output.inventory_id,
        length_m_delivered:  output.length_m,
        length_m_requested:  output.length_m,
        width_m_delivered:   output.width_m,
        width_m_requested:   output.width_m,
        m2_delivered:        m2,
        m2_requested:        m2,
        m2_returned:         0,
        delivered_by:        user.id,
        received_by:         req.requested_by,
      })

    if (outErr) return { error: outErr.message }
  }

  // Re-fetch ALL outputs for this requisition as the authoritative source
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allPaperOutputs } = await (supabase as any)
    .from('paper_outputs')
    .select('paper_inventory_id, m2_delivered')
    .eq('requisition_id', requisitionId)

  const allPaperInvIds = [...new Set((allPaperOutputs ?? []).map((o: { paper_inventory_id: number }) => o.paper_inventory_id))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allPaperLots } = await (supabase as any)
    .from('paper_inventory')
    .select('id, paper_catalog_id')
    .in('id', allPaperInvIds.length ? allPaperInvIds : [0])

  const lotCatalogP = new Map(((allPaperLots ?? []) as { id: number; paper_catalog_id: number }[]).map(l => [l.id, l.paper_catalog_id]))

  const m2ByCatalog = new Map<number, number>()
  for (const o of (allPaperOutputs ?? []) as { paper_inventory_id: number; m2_delivered: number | null }[]) {
    const catId = lotCatalogP.get(o.paper_inventory_id)
    if (catId !== undefined) m2ByCatalog.set(catId, (m2ByCatalog.get(catId) ?? 0) + (o.m2_delivered ?? 0))
  }

  let allFulfilled = true
  for (const item of req.paper_items as RequisitionPaperItem[]) {
    const totalDel    = m2ByCatalog.get(item.paper_catalog_id) ?? 0
    const m2Req       = parseFloat(String(item.m2_requested ?? '0')) || 0
    const isFulfilled = m2Req > 0 && totalDel >= m2Req
    if (!isFulfilled) allFulfilled = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('requisition_paper_items')
      .update({ m2_delivered: totalDel, is_fulfilled: isFulfilled })
      .eq('id', item.id)
  }

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
    .eq('id', requisitionId)

  // Notify the requester that material was delivered (full or partial)
  await notifyUsers([req.requested_by], {
    type:  'requisition_fulfilled',
    title: newStatus === 'FULFILLED'
      ? `Requisición surtida — OP ${req.production_order}`
      : `Entrega parcial — OP ${req.production_order}`,
    body:  newStatus === 'FULFILLED'
      ? 'Tu requisición fue surtida por completo.'
      : 'Se entregó parte de tu requisición; queda pendiente el resto.',
    link:  `/dashboard/requisitions/${requisitionId}`,
    metadata: { requisition_id: requisitionId, status: newStatus },
    email: { badge: newStatus === 'FULFILLED' ? '📦 Requisición surtida' : '📦 Entrega parcial' },
  })

  await alertPaperLowStock(supabase, outputs, lotCatalogP)

  PATHS.forEach(p => revalidatePath(p))
  revalidatePath(`/dashboard/requisitions/${requisitionId}`)
  return { success: true }
}

/** Fire a low-stock notification when a paper catalog item crosses below its minimum. */
async function alertPaperLowStock(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  outputs: FulfillPaperOutput[],
  lotCatalog: Map<number, number>,
): Promise<void> {
  const deltaByCatalog = new Map<number, number>()
  for (const o of outputs) {
    const catId = lotCatalog.get(o.inventory_id)
    if (catId !== undefined) deltaByCatalog.set(catId, (deltaByCatalog.get(catId) ?? 0) + o.length_m * o.width_m)
  }
  if (deltaByCatalog.size === 0) return

  const { data: cats } = await supabase
    .from('paper_catalog')
    .select('id, name, current_stock_m2, min_stock_m2')
    .in('id', [...deltaByCatalog.keys()])

  for (const c of (cats ?? []) as { id: number; name: string; current_stock_m2: number | null; min_stock_m2: number | null }[]) {
    const after  = c.current_stock_m2 ?? 0
    const min    = c.min_stock_m2 ?? 0
    const before = after + (deltaByCatalog.get(c.id) ?? 0)
    if (min > 0 && before >= min && after < min) {
      await notifyRoles(['ADMIN', 'WAREHOUSE_MANAGER'], {
        type:  'low_stock',
        title: `Stock bajo: ${c.name}`,
        body:  `Quedan ${after.toFixed(3)} m² (mínimo ${min} m²).`,
        link:  '/dashboard/inventory/paper',
        metadata: { paper_catalog_id: c.id },
        email: { badge: '⚠️ Stock bajo', subtitle: c.name },
      })
    }
  }
}

export async function registerInkReturn(
  outputId: number,
  kgReturned: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ink_outputs')
    .update({ kg_returned: kgReturned, updated_at: new Date().toISOString() })
    .eq('id', outputId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}

export async function registerPaperReturn(
  outputId: number,
  m2Returned: number,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !CAN_MANAGE.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('paper_outputs')
    .update({ m2_returned: m2Returned, updated_at: new Date().toISOString() })
    .eq('id', outputId)

  if (error) return { error: error.message }
  PATHS.forEach(p => revalidatePath(p))
  return { success: true }
}
