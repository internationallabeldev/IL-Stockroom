'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/actions/auth.actions'
import { differenceInHours, differenceInDays, parseISO, format, startOfMonth, startOfDay, endOfDay } from 'date-fns'
import type {
  DateRange,
  LowStockItem,
  ConsumptionResult,
  ConsumptionDataPoint,
  PendingRequisition,
  ActiveOrder,
  PendingQualityReceipt,
  StockOverviewItem,
  RecentActivityEvent,
  DashboardKPIs,
} from '@/types/dashboard.types'

const PAPER_COLORS = ['#008dc2', '#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#14b8a6']

// ── Low stock alerts ───────────────────────────────────────────────────────────

export async function getLowStockAlerts(): Promise<{ inks: LowStockItem[]; papers: LowStockItem[] }> {
  const supabase = createAdminClient()

  const [inkResult, paperResult] = await Promise.all([
    supabase
      .from('ink_catalog')
      .select('id, code, name, color_code, current_stock_kg, min_stock_kg, providers(name)')
      .eq('enabled', true),
    supabase
      .from('paper_catalog')
      .select('id, code, name, current_stock_m2, min_stock_m2, providers(name)')
      .eq('enabled', true)
      .not('min_stock_m2', 'is', null),
  ])

  const inks: LowStockItem[] = ((inkResult.data ?? []) as any[])
    .filter(i => i.current_stock_kg !== null && i.current_stock_kg <= i.min_stock_kg)
    .map(i => ({
      id: i.id,
      code: i.code,
      name: i.name,
      color_code: i.color_code,
      current_stock: i.current_stock_kg ?? 0,
      min_stock: i.min_stock_kg,
      stock_percentage: i.min_stock_kg > 0
        ? Math.round(((i.current_stock_kg ?? 0) / i.min_stock_kg) * 1000) / 10
        : 0,
      unit: 'kg' as const,
      provider_name: i.providers?.name ?? null,
    }))
    .sort((a, b) => a.stock_percentage - b.stock_percentage)

  const papers: LowStockItem[] = ((paperResult.data ?? []) as any[])
    .filter(p => p.current_stock_m2 !== null && p.min_stock_m2 !== null && p.current_stock_m2 <= p.min_stock_m2)
    .map(p => ({
      id: p.id,
      code: p.code,
      name: p.name,
      current_stock: p.current_stock_m2 ?? 0,
      min_stock: p.min_stock_m2 ?? 0,
      stock_percentage: (p.min_stock_m2 ?? 0) > 0
        ? Math.round(((p.current_stock_m2 ?? 0) / (p.min_stock_m2 ?? 1)) * 1000) / 10
        : 0,
      unit: 'm²' as const,
      provider_name: p.providers?.name ?? null,
    }))
    .sort((a, b) => a.stock_percentage - b.stock_percentage)

  return { inks, papers }
}

// ── Consumption data ───────────────────────────────────────────────────────────

export async function getConsumptionData(dateRange: DateRange): Promise<{ ink: ConsumptionResult; paper: ConsumptionResult }> {
  const supabase = createAdminClient()
  // output_date is a timestamptz — use full-day ISO bounds so the last day of
  // the range is included (a plain 'yyyy-MM-dd' end excludes everything after 00:00).
  const startISO = startOfDay(dateRange.start).toISOString()
  const endISO   = endOfDay(dateRange.end).toISOString()

  const [inkRows, paperRows] = await Promise.all([
    supabase
      .from('ink_outputs')
      .select('output_date, kg_delivered, kg_returned, ink_inventory(ink_catalog(name, color_code))')
      .gte('output_date', startISO)
      .lte('output_date', endISO),
    supabase
      .from('paper_outputs')
      .select('output_date, m2_delivered, m2_returned, paper_inventory(paper_catalog(name))')
      .gte('output_date', startISO)
      .lte('output_date', endISO),
  ])

  function buildResult(
    rows: any[],
    getValue: (r: any) => number,
    getName: (r: any) => string,
    getColor: (name: string, idx: number) => string,
  ): ConsumptionResult {
    const dayMap = new Map<string, Map<string, number>>()
    const nameToColor = new Map<string, string>()
    let colorIdx = 0

    for (const row of rows) {
      const date = (row.output_date as string).substring(0, 10)
      const name = getName(row) ?? 'Desconocido'
      const val  = getValue(row)

      if (!nameToColor.has(name)) {
        nameToColor.set(name, getColor(name, colorIdx++))
      }
      if (!dayMap.has(date)) dayMap.set(date, new Map())
      const d = dayMap.get(date)!
      d.set(name, (d.get(name) ?? 0) + val)
    }

    const sortedDates = [...dayMap.keys()].sort()
    const points: ConsumptionDataPoint[] = sortedDates.map(date => {
      const point: ConsumptionDataPoint = { date }
      for (const [name, val] of dayMap.get(date)!) point[name] = Math.round(val * 100) / 100
      return point
    })

    const materials = [...nameToColor.entries()].map(([name, color]) => ({ name, color }))
    return { points, materials }
  }

  const ink = buildResult(
    inkRows.data ?? [],
    r => (r.kg_delivered ?? 0) - (r.kg_returned ?? 0),
    r => r.ink_inventory?.ink_catalog?.name,
    (_name, idx) => PAPER_COLORS[idx % PAPER_COLORS.length],
  )

  // For inks, use color_code from catalog when available
  const inkColorMap = new Map<string, string>()
  for (const row of (inkRows.data ?? []) as any[]) {
    const name  = row.ink_inventory?.ink_catalog?.name
    const color = row.ink_inventory?.ink_catalog?.color_code
    if (name && color && !inkColorMap.has(name)) inkColorMap.set(name, color)
  }
  ink.materials = ink.materials.map(m => ({ ...m, color: inkColorMap.get(m.name) ?? m.color }))

  const paper = buildResult(
    paperRows.data ?? [],
    r => (r.m2_delivered ?? 0) - (r.m2_returned ?? 0),
    r => r.paper_inventory?.paper_catalog?.name,
    (_name, idx) => PAPER_COLORS[idx % PAPER_COLORS.length],
  )

  return { ink, paper }
}

// ── Pending requisitions ───────────────────────────────────────────────────────

export async function getPendingRequisitions(): Promise<PendingRequisition[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('production_requisitions')
    .select('id, requisition_number, material_type, status, request_date, production_order, requester:users!production_requisitions_requested_by_fkey(first_name, last_name)')
    .in('status', ['PENDING', 'APPROVED', 'PARTIAL'])
    .order('request_date', { ascending: true })

  const now = new Date()
  return ((data ?? []) as any[]).map(r => ({
    id: r.id,
    requisition_number: r.requisition_number,
    material_type: r.material_type,
    status: r.status,
    request_date: r.request_date,
    production_order: r.production_order,
    requested_by_name: r.requester ? `${r.requester.first_name} ${r.requester.last_name}`.trim() : '—',
    hours_waiting: differenceInHours(now, parseISO(r.request_date)),
  }))
}

// ── Active orders ──────────────────────────────────────────────────────────────

export async function getActiveOrders(): Promise<ActiveOrder[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('purchase_orders')
    .select('id, order_number, material_type, status, request_date, expected_delivery_date, providers(name)')
    .in('status', ['PENDING', 'PARTIAL'])
    .order('expected_delivery_date', { ascending: true, nullsFirst: false })

  const now = new Date()
  return ((data ?? []) as any[]).map(o => {
    const overdue = o.expected_delivery_date
      ? differenceInDays(now, parseISO(o.expected_delivery_date))
      : null
    return {
      id: o.id,
      order_number: o.order_number,
      material_type: o.material_type,
      status: o.status,
      request_date: o.request_date,
      expected_delivery_date: o.expected_delivery_date,
      provider_name: o.providers?.name ?? '—',
      days_overdue: overdue !== null && overdue > 0 ? overdue : null,
    }
  })
}

// ── Pending quality receipts ───────────────────────────────────────────────────

export async function getPendingQualityReceipts(): Promise<PendingQualityReceipt[]> {
  const supabase = createAdminClient()

  const [inkResult, paperResult] = await Promise.all([
    supabase
      .from('ink_receipts')
      .select('id, internal_batch, receipt_date, kg_received, purchase_order_ink_items(ink_catalog(name))')
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),
    supabase
      .from('paper_receipts')
      .select('id, internal_batch, receipt_date, total_m2_received, purchase_order_paper_items(paper_catalog(name))')
      .eq('quality_certificate', 'PENDING')
      .order('receipt_date', { ascending: true }),
  ])

  const now = new Date()

  const inks: PendingQualityReceipt[] = ((inkResult.data ?? []) as any[]).map(r => ({
    id: r.id,
    internal_batch: r.internal_batch,
    receipt_date: r.receipt_date,
    material_name: r.purchase_order_ink_items?.ink_catalog?.name ?? '—',
    material_type: 'INK' as const,
    quantity: r.kg_received,
    days_pending: differenceInDays(now, parseISO(r.receipt_date)),
  }))

  const papers: PendingQualityReceipt[] = ((paperResult.data ?? []) as any[]).map(r => ({
    id: r.id,
    internal_batch: r.internal_batch,
    receipt_date: r.receipt_date,
    material_name: r.purchase_order_paper_items?.paper_catalog?.name ?? '—',
    material_type: 'PAPER' as const,
    quantity: r.total_m2_received ?? 0,
    days_pending: differenceInDays(now, parseISO(r.receipt_date)),
  }))

  return [...inks, ...papers].sort((a, b) => b.days_pending - a.days_pending)
}

// ── Stock overview ─────────────────────────────────────────────────────────────

export async function getStockOverview(): Promise<{ inks: StockOverviewItem[]; papers: StockOverviewItem[] }> {
  const supabase = createAdminClient()

  const [inkResult, paperResult] = await Promise.all([
    supabase
      .from('ink_catalog')
      .select('id, code, name, color_code, current_stock_kg, min_stock_kg')
      .eq('enabled', true)
      .order('name'),
    supabase
      .from('paper_catalog')
      .select('id, code, name, current_stock_m2, min_stock_m2')
      .eq('enabled', true)
      .order('name'),
  ])

  const inks: StockOverviewItem[] = ((inkResult.data ?? []) as any[]).map(i => ({
    id: i.id,
    code: i.code,
    name: i.name,
    current_stock: i.current_stock_kg ?? 0,
    min_stock: i.min_stock_kg ?? 0,
    unit: 'kg' as const,
    color_code: i.color_code,
  }))

  const papers: StockOverviewItem[] = ((paperResult.data ?? []) as any[]).map(p => ({
    id: p.id,
    code: p.code,
    name: p.name,
    current_stock: p.current_stock_m2 ?? 0,
    min_stock: p.min_stock_m2 ?? 0,
    unit: 'm²' as const,
  }))

  return { inks, papers }
}

// ── KPIs ───────────────────────────────────────────────────────────────────────

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase  = createAdminClient()
  const user      = await getSessionUser()
  const now       = new Date()
  const todayStr  = format(now, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')

  const [
    inkStockRes,
    paperStockRes,
    pendingReqRes,
    activeOrderRes,
    overdueOrderRes,
    pendingQualityRes,
    deliveriesTodayRes,
    myActiveReqRes,
    myCompletedRes,
  ] = await Promise.all([
    supabase.from('ink_inventory').select('remaining_kg').eq('enabled', true),
    supabase.from('paper_inventory').select('remaining_m2').eq('enabled', true),
    supabase.from('production_requisitions').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'PARTIAL']),
    supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'PARTIAL']).lt('expected_delivery_date', todayStr),
    supabase.from('ink_receipts').select('id', { count: 'exact', head: true }).eq('quality_certificate', 'PENDING'),
    supabase.from('ink_outputs').select('id', { count: 'exact', head: true }).eq('output_date', todayStr),
    user ? supabase.from('production_requisitions').select('id', { count: 'exact', head: true }).eq('requested_by', user.id).in('status', ['PENDING', 'APPROVED', 'PARTIAL']) : Promise.resolve({ count: 0 }),
    user ? supabase.from('production_requisitions').select('id', { count: 'exact', head: true }).eq('requested_by', user.id).eq('status', 'FULFILLED').gte('fulfilled_at', monthStart) : Promise.resolve({ count: 0 }),
  ])

  const totalInkKg   = ((inkStockRes.data ?? []) as any[]).reduce((s, r) => s + (r.remaining_kg ?? 0), 0)
  const totalPaperM2 = ((paperStockRes.data ?? []) as any[]).reduce((s, r) => s + (r.remaining_m2 ?? 0), 0)

  const [inkLowCount, paperLowCount] = await Promise.all([
    supabase.from('ink_catalog').select('id, current_stock_kg, min_stock_kg').eq('enabled', true),
    supabase.from('paper_catalog').select('id, current_stock_m2, min_stock_m2').eq('enabled', true).not('min_stock_m2', 'is', null),
  ])
  const lowStockCount =
    ((inkLowCount.data ?? []) as any[]).filter(i => (i.current_stock_kg ?? 0) <= i.min_stock_kg).length +
    ((paperLowCount.data ?? []) as any[]).filter(p => p.min_stock_m2 !== null && (p.current_stock_m2 ?? 0) <= p.min_stock_m2).length

  return {
    totalInkKg:          Math.round(totalInkKg * 10) / 10,
    totalPaperM2:        Math.round(totalPaperM2 * 10) / 10,
    pendingReqsCount:    pendingReqRes.count  ?? 0,
    activeOrdersCount:   activeOrderRes.count ?? 0,
    overdueOrdersCount:  overdueOrderRes.count ?? 0,
    lowStockCount,
    pendingQualityCount: pendingQualityRes.count ?? 0,
    deliveriesToday:     deliveriesTodayRes.count ?? 0,
    myActiveReqs:        (myActiveReqRes as any).count ?? 0,
    myCompletedThisMonth: (myCompletedRes as any).count ?? 0,
  }
}

// ── Recent activity (ADMIN) ────────────────────────────────────────────────────

export async function getRecentActivity(): Promise<RecentActivityEvent[]> {
  const supabase = createAdminClient()

  const [inkOut, paperOut, inkRec, paperRec, orders, reqs] = await Promise.all([
    supabase.from('ink_outputs').select('id, output_date, kg_delivered, ink_inventory(ink_catalog(name)), deliverer:users!ink_outputs_delivered_by_fkey(first_name, last_name)').order('output_date', { ascending: false }).limit(5),
    supabase.from('paper_outputs').select('id, output_date, m2_delivered, paper_inventory(paper_catalog(name)), deliverer:users!paper_outputs_delivered_by_fkey(first_name, last_name)').order('output_date', { ascending: false }).limit(5),
    supabase.from('ink_receipts').select('id, receipt_date, kg_received, purchase_order_ink_items(ink_catalog(name))').order('receipt_date', { ascending: false }).limit(5),
    supabase.from('paper_receipts').select('id, receipt_date, total_m2_received, purchase_order_paper_items(paper_catalog(name))').order('receipt_date', { ascending: false }).limit(5),
    supabase.from('purchase_orders').select('id, created_at, order_number, material_type, providers(name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('production_requisitions').select('id, requested_at, requisition_number, material_type, requester:users!production_requisitions_requested_by_fkey(first_name, last_name)').order('requested_at', { ascending: false }).limit(5),
  ])

  const events: RecentActivityEvent[] = []

  for (const r of (inkOut.data ?? []) as any[]) {
    const name = r.ink_inventory?.ink_catalog?.name ?? 'tinta'
    const user = r.deliverer ? `${r.deliverer.first_name} ${r.deliverer.last_name}`.trim() : undefined
    events.push({ id: `io-${r.id}`, type: 'ink_output', description: `Entrega de ${name} · ${r.kg_delivered ?? 0} kg`, date: r.output_date, user_name: user })
  }
  for (const r of (paperOut.data ?? []) as any[]) {
    const name = r.paper_inventory?.paper_catalog?.name ?? 'papel'
    const user = r.deliverer ? `${r.deliverer.first_name} ${r.deliverer.last_name}`.trim() : undefined
    events.push({ id: `po-${r.id}`, type: 'paper_output', description: `Entrega de ${name} · ${r.m2_delivered ?? 0} m²`, date: r.output_date, user_name: user })
  }
  for (const r of (inkRec.data ?? []) as any[]) {
    const name = r.purchase_order_ink_items?.ink_catalog?.name ?? 'tinta'
    events.push({ id: `ir-${r.id}`, type: 'ink_receipt', description: `Recepción de ${name} · ${r.kg_received ?? 0} kg`, date: r.receipt_date })
  }
  for (const r of (paperRec.data ?? []) as any[]) {
    const name = r.purchase_order_paper_items?.paper_catalog?.name ?? 'papel'
    events.push({ id: `pr-${r.id}`, type: 'paper_receipt', description: `Recepción de ${name} · ${r.total_m2_received ?? 0} m²`, date: r.receipt_date })
  }
  for (const o of (orders.data ?? []) as any[]) {
    const prov = o.providers?.name ?? '—'
    events.push({ id: `ord-${o.id}`, type: 'order', description: `Orden #${o.order_number} de ${prov}`, date: o.created_at?.substring(0, 10) ?? '' })
  }
  for (const r of (reqs.data ?? []) as any[]) {
    const user = r.requester ? `${r.requester.first_name} ${r.requester.last_name}`.trim() : undefined
    events.push({ id: `req-${r.id}`, type: 'requisition', description: `Requisición #${r.requisition_number} · ${r.material_type === 'INK' ? 'Tinta' : 'Papel'}`, date: r.requested_at?.substring(0, 10) ?? '', user_name: user })
  }

  return events
    .filter(e => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
}
