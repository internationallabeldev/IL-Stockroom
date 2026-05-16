'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function pingDatabase(): Promise<{ latencyMs: number; ok: boolean }> {
  const start = Date.now()
  try {
    const supabase = createAdminClient()
    await supabase.from('users').select('id').limit(1)
    return { latencyMs: Date.now() - start, ok: true }
  } catch {
    return { latencyMs: Date.now() - start, ok: false }
  }
}

export type SystemStats = {
  reqPending:   number
  ordersActive: number
  inkLots:      number
  paperLots:    number
  users:        number
}

export async function getSystemStats(): Promise<SystemStats> {
  try {
    const supabase = createAdminClient()
    const [req, orders, ink, paper, users] = await Promise.all([
      supabase.from('production_requisitions').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
      supabase.from('purchase_orders').select('id', { count: 'exact', head: true }).in('status', ['PENDING', 'PARTIAL']),
      supabase.from('ink_inventory').select('id', { count: 'exact', head: true }).eq('enabled', true),
      supabase.from('paper_inventory').select('id', { count: 'exact', head: true }).eq('enabled', true),
      supabase.from('users').select('id', { count: 'exact', head: true }),
    ])
    return {
      reqPending:   req.count    ?? 0,
      ordersActive: orders.count ?? 0,
      inkLots:      ink.count    ?? 0,
      paperLots:    paper.count  ?? 0,
      users:        users.count  ?? 0,
    }
  } catch {
    return { reqPending: 0, ordersActive: 0, inkLots: 0, paperLots: 0, users: 0 }
  }
}
