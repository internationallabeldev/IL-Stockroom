'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { redirect }          from 'next/navigation'
import type { AuditLogEntry, AuditFilters } from '@/lib/audit-constants'

// ── Helpers ───────────────────────────────────────────────────────────────────

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') redirect('/dashboard')
  return user
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function getAuditLog(filters: AuditFilters = {}): Promise<{
  data:  AuditLogEntry[]
  total: number
}> {
  await requireAdmin()

  const { table_name, operation, performed_by, date_from, date_to, search, page = 1, pageSize = 50 } = filters
  const from = (page - 1) * pageSize
  const to   = page * pageSize - 1

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (table_name)   query = query.eq('table_name', table_name)
  if (operation)    query = query.eq('operation', operation)
  if (performed_by) query = query.eq('performed_by', performed_by)
  if (date_from)    query = query.gte('created_at', date_from)
  if (date_to)      query = query.lte('created_at', date_to)
  if (search) {
    const q = search.trim()
    const asNum = Number(q)
    const orParts: string[] = [`performed_by_name.ilike.%${q}%`]
    if (!isNaN(asNum) && Number.isInteger(asNum)) orParts.push(`record_id.eq.${asNum}`)
    query = query.or(orParts.join(','))
  }

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as AuditLogEntry[], total: count ?? 0 }
}

// ── KPIs / Stats ──────────────────────────────────────────────────────────────

export type AuditStats = {
  total:        number
  byOperation:  { INSERT: number; UPDATE: number; DELETE: number }
  topTable:     { name: string; count: number } | null
  uniqueUsers:  number
}

export async function getAuditStats(
  filters: Omit<AuditFilters, 'page' | 'pageSize'> = {},
): Promise<AuditStats> {
  await requireAdmin()

  const { table_name, operation, performed_by, date_from, date_to, search } = filters
  const admin = createAdminClient()

  const searchOr = (() => {
    if (!search) return null
    const q = search.trim()
    if (!q) return null
    const asNum = Number(q)
    const parts: string[] = [`performed_by_name.ilike.%${q}%`]
    if (!isNaN(asNum) && Number.isInteger(asNum)) parts.push(`record_id.eq.${asNum}`)
    return parts.join(',')
  })()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseQuery = (op?: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let q: any = (admin as any).from('audit_log').select('*', { count: 'exact', head: true })
    if (table_name)   q = q.eq('table_name', table_name)
    if (performed_by) q = q.eq('performed_by', performed_by)
    if (date_from)    q = q.gte('created_at', date_from)
    if (date_to)      q = q.lte('created_at', date_to)
    if (op)           q = q.eq('operation', op)
    else if (operation) q = q.eq('operation', operation)
    if (searchOr)     q = q.or(searchOr)
    return q
  }

  // Aggregation fetch (table_name + performed_by only) to compute topTable + uniqueUsers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let aggQuery: any = (admin as any)
    .from('audit_log')
    .select('table_name, performed_by')
    .order('created_at', { ascending: false })
    .range(0, 9999)

  if (table_name)   aggQuery = aggQuery.eq('table_name', table_name)
  if (operation)    aggQuery = aggQuery.eq('operation', operation)
  if (performed_by) aggQuery = aggQuery.eq('performed_by', performed_by)
  if (date_from)    aggQuery = aggQuery.gte('created_at', date_from)
  if (date_to)      aggQuery = aggQuery.lte('created_at', date_to)
  if (searchOr)     aggQuery = aggQuery.or(searchOr)

  const [totalRes, insRes, updRes, delRes, aggRes] = await Promise.all([
    baseQuery(),
    baseQuery('INSERT'),
    baseQuery('UPDATE'),
    baseQuery('DELETE'),
    aggQuery,
  ])

  const rows = (aggRes.data ?? []) as { table_name: string; performed_by: string | null }[]

  const tableCounts = new Map<string, number>()
  const userSet     = new Set<string>()
  for (const r of rows) {
    tableCounts.set(r.table_name, (tableCounts.get(r.table_name) ?? 0) + 1)
    if (r.performed_by) userSet.add(r.performed_by)
  }

  let topTable: { name: string; count: number } | null = null
  for (const [name, count] of tableCounts) {
    if (!topTable || count > topTable.count) topTable = { name, count }
  }

  return {
    total:       totalRes.count ?? 0,
    byOperation: {
      INSERT: insRes.count ?? 0,
      UPDATE: updRes.count ?? 0,
      DELETE: delRes.count ?? 0,
    },
    topTable,
    uniqueUsers: userSet.size,
  }
}

export async function getAuditLogByRecord(
  tableName: string,
  recordId:  number,
): Promise<AuditLogEntry[]> {
  await requireAdmin()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from('audit_log')
    .select('*')
    .eq('table_name', tableName)
    .eq('record_id', recordId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogEntry[]
}

export async function getAuditLogByUser(
  userId:     string,
  dateRange?: { from?: string; to?: string },
): Promise<AuditLogEntry[]> {
  await requireAdmin()

  const admin = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (admin as any)
    .from('audit_log')
    .select('*')
    .eq('performed_by', userId)
    .order('created_at', { ascending: false })

  if (dateRange?.from) query = query.gte('created_at', dateRange.from)
  if (dateRange?.to)   query = query.lte('created_at', dateRange.to)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []) as AuditLogEntry[]
}
