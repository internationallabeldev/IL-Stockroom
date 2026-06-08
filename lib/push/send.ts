import 'server-only'
import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Web Push sender (VAPID). Mirrors lib/email/send.ts: never throws — a delivery
 * failure must not break the action that triggered the notification.
 *
 * Required env vars:
 *   NEXT_PUBLIC_VAPID_PUBLIC_KEY   exposed to the client to subscribe
 *   VAPID_PRIVATE_KEY              server only
 *   VAPID_SUBJECT                  mailto: or site URL
 */

let configured = false

function ensureConfigured(): boolean {
  if (configured) return true
  const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject    = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
  return true
}

export type PushPayload = {
  title: string
  body?: string
  url?: string
  tag?: string
}

type SubRow = { id: number; endpoint: string; p256dh: string; auth: string }

/**
 * Sends a push to every subscription belonging to the given users. Dead
 * subscriptions (404/410) are pruned. Returns counts for logging.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload,
): Promise<{ sent: number; pruned: number; skipped?: boolean }> {
  const ids = [...new Set(userIds)].filter(Boolean)
  if (ids.length === 0) return { sent: 0, pruned: 0 }

  if (!ensureConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[push] VAPID keys not set — push skipped')
    }
    return { sent: 0, pruned: 0, skipped: true }
  }

  // push_subscriptions isn't in the generated DB types yet → cast to any.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any
  const { data } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('user_id', ids)

  const subs = (data ?? []) as unknown as SubRow[]
  if (subs.length === 0) return { sent: 0, pruned: 0 }

  const body = JSON.stringify(payload)
  const dead: number[] = []
  let sent = 0

  await Promise.all(
    subs.map(async sub => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        )
        sent++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) dead.push(sub.id)
        else console.error('[push] send failed:', (err as Error)?.message ?? err)
      }
    }),
  )

  if (dead.length) {
    await admin.from('push_subscriptions').delete().in('id', dead)
  }

  return { sent, pruned: dead.length }
}
