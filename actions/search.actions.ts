'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'

export type SearchResultType =
  | 'provider'
  | 'ink_catalog'
  | 'paper_catalog'
  | 'ink_inventory'
  | 'paper_inventory'
  | 'purchase_order'
  | 'requisition'
  | 'output'

export type SearchResult = {
  id: string
  type: SearchResultType
  title: string
  subtitle?: string
  badge?: string
  url: string
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
    })),
    ...paperOutputs.map(o => ({
      id: `paper-output-${o.id}`,
      type: 'output' as const,
      title: `Salida de papel #${o.id}`,
      subtitle: `${o.output_date} · ${o.m2_delivered} m²`,
      url: '/dashboard/outputs/history',
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
