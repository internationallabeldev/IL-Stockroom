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

  const { table_name, operation, performed_by, date_from, date_to, page = 1, pageSize = 50 } = filters
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

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data: (data ?? []) as AuditLogEntry[], total: count ?? 0 }
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
