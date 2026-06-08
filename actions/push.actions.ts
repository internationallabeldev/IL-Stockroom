'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from './auth.actions'

/** Shape the browser sends from a PushSubscription. */
export type PushSubscriptionInput = {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

/** Persist (or refresh) a push subscription for the current user + device. */
export async function savePushSubscription(
  sub: PushSubscriptionInput,
  userAgent?: string,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Sin sesión' }
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { error: 'Suscripción inválida' }
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .upsert(
      {
        user_id:    user.id,
        endpoint:   sub.endpoint,
        p256dh:     sub.keys.p256dh,
        auth:       sub.keys.auth,
        user_agent: userAgent ?? null,
      },
      { onConflict: 'endpoint' },
    )

  if (error) return { error: error.message }
  return { success: true }
}

/** Remove a subscription (this device opted out). */
export async function deletePushSubscription(
  endpoint: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!endpoint) return { error: 'endpoint requerido' }
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint)
  if (error) return { error: error.message }
  return { success: true }
}
