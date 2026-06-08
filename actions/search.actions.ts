'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import type { RefDomain, RefSection } from '@/lib/chat/references'

export type SearchResultType =
  | 'provider'
  | 'ink_catalog'
  | 'paper_catalog'
  | 'ink_inventory'
  | 'paper_inventory'
  | 'purchase_order'
  | 'requisition'
  | 'output'
  | 'supply'

export type SearchResult = {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  badge?: string
  url: string
  /** Best term to seed the target page's search box (used by chat /references). */
  q?: string
}

export type SearchCategory = {
  label: string
  results: SearchResult[]
}

const LIMIT = 4

const PROVIDER_TYPE_LABEL: Record<string, string> = {
  INK_SUPPLIER:    'Tintas',
  PAPER_SUPPLIER:  'Papel',
  SUPPLY_SUPPLIER: 'Consumibles',
  BOTH:            'Múltiples',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  PARTIAL: 'Parcial',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  APPROVED: 'Aprobada',
  REJECTED: 'Rechazada',
  FULFILLED: 'Atendida',
  IN_PROGRESS: 'En progreso',
}

export async function globalSearch(query: string): Promise<SearchCategory[]> {
  const q = query.trim()
  if (q.length < 2) return []

  // El buscador usa el cliente admin (como el resto de la app) porque RLS
  // bloquea la lectura directa de inventario, catálogo, órdenes, etc.
  // Por eso exigimos una sesión válida antes de devolver cualquier resultado.
  const user = await getSessionUser()
  if (!user) return []

  const supabase = createAdminClient()
  const isNumeric = /^\d+$/.test(q)

  // Dedupe rows coming from several parallel queries, keeping order, capped at LIMIT.
  const mergeById = <T extends { id: number | string }>(rows: T[]): T[] => {
    const seen = new Set<T['id']>()
    const out: T[] = []
    for (const r of rows) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      out.push(r)
      if (out.length >= LIMIT) break
    }
    return out
  }

  // Inventory matches the local page search: internal batch, catalog name/code,
  // and the provider batch on the linked receipt. PostgREST can't OR across
  // tables in one query, so we run one query per source and merge by id.
  const searchInkInventory = async () => {
    const [byBatch, byCatalog, byProvBatch] = await Promise.all([
      supabase
        .from('ink_inventory')
        .select('id, internal_batch, ink_catalog(name)')
        .ilike('internal_batch', `%${q}%`)
        .limit(LIMIT),
      supabase
        .from('ink_inventory')
        .select('id, internal_batch, ink_catalog:ink_catalog_id!inner(name)')
        .or(`name.ilike.%${q}%,code.ilike.%${q}%`, { referencedTable: 'ink_catalog' })
        .limit(LIMIT),
      supabase
        .from('ink_inventory')
        .select('id, internal_batch, ink_catalog(name), receipt:receipt_id!inner(provider_batch)')
        .ilike('receipt.provider_batch', `%${q}%`)
        .limit(LIMIT),
    ])
    return mergeById([
      ...(byBatch.data ?? []),
      ...(byCatalog.data ?? []),
      ...(byProvBatch.data ?? []),
    ] as any[])
  }

  const searchPaperInventory = async () => {
    const [byBatch, byCatalog, byProvBatch] = await Promise.all([
      supabase
        .from('paper_inventory')
        .select('id, internal_batch, paper_catalog(name)')
        .ilike('internal_batch', `%${q}%`)
        .limit(LIMIT),
      supabase
        .from('paper_inventory')
        .select('id, internal_batch, paper_catalog:paper_catalog_id!inner(name)')
        .or(`name.ilike.%${q}%,code.ilike.%${q}%`, { referencedTable: 'paper_catalog' })
        .limit(LIMIT),
      supabase
        .from('paper_inventory')
        .select('id, internal_batch, paper_catalog(name), receipt:receipt_id!inner(provider_batch)')
        .ilike('receipt.provider_batch', `%${q}%`)
        .limit(LIMIT),
    ])
    return mergeById([
      ...(byBatch.data ?? []),
      ...(byCatalog.data ?? []),
      ...(byProvBatch.data ?? []),
    ] as any[])
  }

  const [
    providersRes,
    inkCatalogRes,
    paperCatalogRes,
    inkInv,
    paperInv,
    inkOrdersRes,
    paperOrdersRes,
    inkReqRes,
    paperReqRes,
    inkOutputsRes,
    paperOutputsRes,
  ] = await Promise.all([
    supabase
      .from('providers')
      .select('id, name, contact_person, provider_type')
      .or(`name.ilike.%${q}%,contact_person.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(LIMIT),

    supabase
      .from('ink_catalog')
      .select('id, name, code, ink_type')
      .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
      .limit(LIMIT),

    supabase
      .from('paper_catalog')
      .select('id, name, code, material')
      .or(`name.ilike.%${q}%,code.ilike.%${q}%`)
      .limit(LIMIT),

    searchInkInventory(),

    searchPaperInventory(),

    isNumeric
      ? supabase
          .from('purchase_orders')
          .select('id, order_number, status, material_type, providers(name)')
          .eq('material_type', 'INK')
          .eq('order_number', parseInt(q))
          .limit(LIMIT)
      : Promise.resolve({ data: [] as any[], error: null }),

    isNumeric
      ? supabase
          .from('purchase_orders')
          .select('id, order_number, status, material_type, providers(name)')
          .eq('material_type', 'PAPER')
          .eq('order_number', parseInt(q))
          .limit(LIMIT)
      : Promise.resolve({ data: [] as any[], error: null }),

    supabase
      .from('production_requisitions')
      .select('id, requisition_number, production_order, material_type, status')
      .eq('material_type', 'INK')
      .or(
        isNumeric
          ? `production_order.ilike.%${q}%,requisition_number.eq.${parseInt(q)}`
          : `production_order.ilike.%${q}%`
      )
      .limit(LIMIT),

    supabase
      .from('production_requisitions')
      .select('id, requisition_number, production_order, material_type, status')
      .eq('material_type', 'PAPER')
      .or(
        isNumeric
          ? `production_order.ilike.%${q}%,requisition_number.eq.${parseInt(q)}`
          : `production_order.ilike.%${q}%`
      )
      .limit(LIMIT),

    supabase
      .from('ink_outputs')
      .select('id, output_date, kg_delivered')
      .or(
        isNumeric
          ? `id.eq.${parseInt(q)},output_date.ilike.%${q}%`
          : `output_date.ilike.%${q}%`
      )
      .limit(LIMIT),

    supabase
      .from('paper_outputs')
      .select('id, output_date, m2_delivered')
      .or(
        isNumeric
          ? `id.eq.${parseInt(q)},output_date.ilike.%${q}%`
          : `output_date.ilike.%${q}%`
      )
      .limit(LIMIT),
  ])

  const categories: SearchCategory[] = []

  const providers = providersRes.data ?? []
  if (providers.length) {
    categories.push({
      label: 'Proveedores',
      results: providers.map(p => ({
        id: `provider-${p.id}`,
        type: 'provider' as const,
        title: p.name,
        subtitle: p.contact_person ?? undefined,
        badge: PROVIDER_TYPE_LABEL[p.provider_type],
        url: '/dashboard/providers',
        q: p.name,
      })),
    })
  }

  const inkCatalog = inkCatalogRes.data ?? []
  if (inkCatalog.length) {
    categories.push({
      label: 'Catálogo — Tintas',
      results: inkCatalog.map(i => ({
        id: `ink-catalog-${i.id}`,
        type: 'ink_catalog' as const,
        title: i.name,
        subtitle: i.code,
        badge: i.ink_type ?? undefined,
        url: '/dashboard/catalog/inks',
        q: i.code ?? i.name,
      })),
    })
  }

  const paperCatalog = paperCatalogRes.data ?? []
  if (paperCatalog.length) {
    categories.push({
      label: 'Catálogo — Papel',
      results: paperCatalog.map(p => ({
        id: `paper-catalog-${p.id}`,
        type: 'paper_catalog' as const,
        title: p.name,
        subtitle: p.code,
        badge: p.material ?? undefined,
        url: '/dashboard/catalog/papers',
        q: p.code ?? p.name,
      })),
    })
  }

  if (inkInv.length) {
    categories.push({
      label: 'Inventario — Tintas',
      results: inkInv.map((i: any) => ({
        id: `ink-inv-${i.id}`,
        type: 'ink_inventory' as const,
        title: i.internal_batch,
        subtitle: (i.ink_catalog as any)?.name ?? undefined,
        url: '/dashboard/inventory/inks',
        q: i.internal_batch,
      })),
    })
  }

  if (paperInv.length) {
    categories.push({
      label: 'Inventario — Papel',
      results: paperInv.map((p: any) => ({
        id: `paper-inv-${p.id}`,
        type: 'paper_inventory' as const,
        title: p.internal_batch,
        subtitle: (p.paper_catalog as any)?.name ?? undefined,
        url: '/dashboard/inventory/paper',
        q: p.internal_batch,
      })),
    })
  }

  const allOrders = [
    ...(inkOrdersRes.data ?? []).map(o => ({ ...o, _type: 'INK' as const })),
    ...(paperOrdersRes.data ?? []).map(o => ({ ...o, _type: 'PAPER' as const })),
  ]
  if (allOrders.length) {
    categories.push({
      label: 'Órdenes de compra',
      results: allOrders.map(o => ({
        id: `order-${o.id}`,
        type: 'purchase_order' as const,
        title: `OC #${o.order_number}`,
        subtitle: (o.providers as any)?.name ?? undefined,
        badge: STATUS_LABEL[o.status ?? ''] ?? o.status ?? undefined,
        url: o._type === 'INK' ? '/dashboard/orders/ink' : '/dashboard/orders/paper',
        q: String(o.order_number),
      })),
    })
  }

  const allReqs = [
    ...(inkReqRes.data ?? []),
    ...(paperReqRes.data ?? []),
  ]
  if (allReqs.length) {
    categories.push({
      label: 'Requisiciones de producción',
      results: allReqs.map(r => ({
        id: `req-${r.id}`,
        type: 'requisition' as const,
        title: `REQ #${r.requisition_number}`,
        subtitle: r.production_order,
        badge: STATUS_LABEL[r.status ?? ''] ?? r.status ?? undefined,
        url: r.material_type === 'INK' ? '/dashboard/requisitions/inks' : '/dashboard/requisitions/paper',
        q: String(r.requisition_number),
      })),
    })
  }

  const inkOutputs = inkOutputsRes.data ?? []
  const paperOutputs = paperOutputsRes.data ?? []
  const allOutputs = [
    ...inkOutputs.map(o => ({
      id: `ink-output-${o.id}`,
      type: 'output' as const,
      title: `Salida de tinta #${o.id}`,
      subtitle: `${o.output_date} · ${o.kg_delivered} kg`,
      url: '/dashboard/outputs/history',
      q: String(o.id),
    })),
    ...paperOutputs.map(o => ({
      id: `paper-output-${o.id}`,
      type: 'output' as const,
      title: `Salida de papel #${o.id}`,
      subtitle: `${o.output_date} · ${o.m2_delivered} m²`,
      url: '/dashboard/outputs/history',
      q: String(o.id),
    })),
  ]
  if (allOutputs.length) {
    categories.push({
      label: 'Salidas de material',
      results: allOutputs,
    })
  }

  return categories
}

/**
 * Scoped search for the chat "/" reference picker. Returns only results of one
 * domain (tinta | papel | suministro) and section (catálogo, inventario, …),
 * so the dropdown is explicit and precise. Empty query lists the most recent.
 */
export async function searchReferences(
  domain: RefDomain,
  section: RefSection,
  query: string,
): Promise<SearchResult[]> {
  const user = await getSessionUser()
  if (!user) return []

  const q = query.trim()
  const like = `%${q}%`
  const isNumeric = /^\d+$/.test(q)
  const LIM = 8
  const supabase = createAdminClient()

  // ── Suministros ──────────────────────────────────────────────────────────
  if (domain === 'suministro') {
    if (section !== 'inventario') return []
    const { data } = await supabase
      .from('supply_items')
      .select('id, name, unit')
      .ilike('name', like)
      .order('name')
      .limit(LIM)
    return (data ?? []).map(s => ({
      id: `supply-${s.id}`,
      type: 'supply' as const,
      title: s.name,
      subtitle: s.unit ?? undefined,
      url: '/dashboard/supplies',
      q: s.name,
    }))
  }

  // ── Tinta / Papel ────────────────────────────────────────────────────────
  const isInk = domain === 'tinta'
  const material = isInk ? 'INK' : 'PAPER'

  if (section === 'catalogo') {
    const table = isInk ? 'ink_catalog' : 'paper_catalog'
    const { data } = await supabase
      .from(table)
      .select('id, name, code')
      .or(`name.ilike.${like},code.ilike.${like}`)
      .limit(LIM)
    return (data ?? []).map(c => ({
      id: `${domain}-cat-${c.id}`,
      type: (isInk ? 'ink_catalog' : 'paper_catalog') as SearchResultType,
      title: c.name,
      subtitle: c.code ?? undefined,
      url: isInk ? '/dashboard/catalog/inks' : '/dashboard/catalog/papers',
      q: c.code ?? c.name,
    }))
  }

  if (section === 'inventario') {
    const table = isInk ? 'ink_inventory' : 'paper_inventory'
    const { data } = await supabase
      .from(table)
      .select('id, internal_batch')
      .ilike('internal_batch', like)
      .order('id', { ascending: false })
      .limit(LIM)
    return (data ?? []).map(i => ({
      id: `${domain}-inv-${i.id}`,
      type: (isInk ? 'ink_inventory' : 'paper_inventory') as SearchResultType,
      title: i.internal_batch,
      url: isInk ? '/dashboard/inventory/inks' : '/dashboard/inventory/paper',
      q: i.internal_batch,
    }))
  }

  if (section === 'orden') {
    let qb = supabase
      .from('purchase_orders')
      .select('id, order_number, status, providers(name)')
      .eq('material_type', material)
      .order('order_number', { ascending: false })
      .limit(LIM)
    if (isNumeric) qb = qb.eq('order_number', parseInt(q))
    const { data } = await qb
    return (data ?? []).map(o => ({
      id: `${domain}-oc-${o.id}`,
      type: 'purchase_order' as const,
      title: `OC #${o.order_number}`,
      subtitle: (o.providers as { name?: string } | null)?.name ?? undefined,
      badge: STATUS_LABEL[o.status ?? ''] ?? o.status ?? undefined,
      url: isInk ? '/dashboard/orders/ink' : '/dashboard/orders/paper',
      q: String(o.order_number),
    }))
  }

  if (section === 'requisicion') {
    let qb = supabase
      .from('production_requisitions')
      .select('id, requisition_number, production_order, status')
      .eq('material_type', material)
      .order('requisition_number', { ascending: false })
      .limit(LIM)
    if (isNumeric) qb = qb.eq('requisition_number', parseInt(q))
    else if (q) qb = qb.ilike('production_order', like)
    const { data } = await qb
    return (data ?? []).map(r => ({
      id: `${domain}-req-${r.id}`,
      type: 'requisition' as const,
      title: `REQ #${r.requisition_number}`,
      subtitle: r.production_order ?? undefined,
      badge: STATUS_LABEL[r.status ?? ''] ?? r.status ?? undefined,
      url: isInk ? '/dashboard/requisitions/inks' : '/dashboard/requisitions/paper',
      q: String(r.requisition_number),
    }))
  }

  if (section === 'salida') {
    const table = isInk ? 'ink_outputs' : 'paper_outputs'
    let qb = supabase.from(table).select('id, output_date').order('id', { ascending: false }).limit(LIM)
    if (isNumeric) qb = qb.eq('id', parseInt(q))
    else if (q) qb = qb.ilike('output_date', like)
    const { data } = await qb
    return (data ?? []).map(o => ({
      id: `${domain}-out-${o.id}`,
      type: 'output' as const,
      title: `Salida #${o.id}`,
      subtitle: o.output_date ?? undefined,
      url: '/dashboard/outputs/history',
      q: String(o.id),
    }))
  }

  return []
}
