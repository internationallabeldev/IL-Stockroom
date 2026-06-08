import { createAdminClient } from '@/lib/supabase/admin'
import { notifyRoles } from '@/actions/notifications.actions'

/**
 * Daily cron: scan purchase orders that are overdue beyond the configured
 * threshold and notify PURCHASER + ADMIN. Each order alerts only once
 * (overdue_notified_at guards re-runs). Scheduled via vercel.json crons.
 *
 * Protected by CRON_SECRET — Vercel Cron sends it as a Bearer token.
 */
export async function GET(request: Request) {
  if (process.env.CRON_SECRET) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
      return new Response('Unauthorized', { status: 401 })
    }
  }

  const admin = createAdminClient()

  // Threshold (days past expected delivery to count as overdue)
  const { data: setting } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'alerts.order_overdue_days')
    .maybeSingle()
  const overdueDays = Number(setting?.value ?? 3)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - overdueDays)
  const cutoffStr = cutoff.toISOString().split('T')[0]

  // Orders still open, past the cutoff, not yet alerted
  const { data: orders } = await admin
    .from('purchase_orders')
    .select('id, order_number, material_type, expected_delivery_date, providers(name)')
    .in('status', ['PENDING', 'PARTIAL'])
    .lt('expected_delivery_date', cutoffStr)
    .is('overdue_notified_at', null)

  const list = (orders ?? []) as {
    id: number
    order_number: number
    material_type: string
    expected_delivery_date: string
    providers: { name: string } | null
  }[]

  if (list.length === 0) {
    return Response.json({ ok: true, notified: 0 })
  }

  for (const o of list) {
    const path = o.material_type === 'INK' ? '/dashboard/orders/ink' : '/dashboard/orders/paper'
    await notifyRoles(['PURCHASER', 'ADMIN'], {
      type:  'order_overdue',
      title: `Orden de compra vencida #${o.order_number}`,
      body:  `Entrega esperada el ${o.expected_delivery_date}${o.providers?.name ? ` — ${o.providers.name}` : ''}.`,
      link:  path,
      metadata: { order_id: o.id, order_number: o.order_number },
      email: { badge: '⏰ Orden vencida', subtitle: o.providers?.name ?? undefined },
    })
  }

  // Mark as alerted so the next run doesn't repeat them
  const ids = list.map(o => o.id)
  await admin
    .from('purchase_orders')
    .update({ overdue_notified_at: new Date().toISOString() })
    .in('id', ids)

  return Response.json({ ok: true, notified: ids.length })
}
