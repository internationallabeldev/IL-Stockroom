'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from './auth.actions'
import { sendEmail } from '@/lib/email/send'
import { renderNotificationEmail, type EmailStat } from '@/lib/email/template'
import { sendPushToUsers } from '@/lib/push/send'
import type { Database, Json } from '@/types/database.types'

// ── Types ────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'pending_requisitions'
  | 'quality_pending'
  | 'quality_result'
  | 'low_stock'
  | 'order_overdue'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'requisition_fulfilled'
  | 'chat_mention'

export type Notification = {
  id: number
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  link: string | null
  metadata: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

/** Optional email content. Omit to deliver in-app only. */
export type NotifyEmail = {
  badge: string
  subtitle?: string
  intro?: string
  stats?: EmailStat[]
  ctaLabel?: string
}

export type NotifyPayload = {
  type: NotificationType
  title: string
  body?: string
  link?: string
  metadata?: Record<string, unknown>
  email?: NotifyEmail
}

type TargetUser = {
  id: string
  email: string
  enabled: boolean | null
  notifications: Record<string, boolean> | null
}

// ── Core helper ────────────────────────────────────────────────────────────────

const APP_URL = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/$/, '')

/** Preference is opt-out: deliver unless the user explicitly turned it off. */
function wantsType(u: TargetUser, type: NotificationType): boolean {
  return u.notifications?.[type] !== false
}

async function dispatch(targets: TargetUser[], payload: NotifyPayload): Promise<void> {
  const recipients = targets.filter(u => u.enabled !== false && wantsType(u, payload.type))
  if (recipients.length === 0) return

  const admin = createAdminClient()

  // 1. In-app rows (service_role bypasses RLS). `.select()` returns the inserted
  // rows with their real id/created_at so we can broadcast them verbatim.
  const rows = recipients.map(u => ({
    user_id:  u.id,
    type:     payload.type,
    title:    payload.title,
    body:     payload.body ?? null,
    link:     payload.link ?? null,
    metadata: (payload.metadata ?? {}) as Json,
  }))
  const { data: inserted } = await admin.from('notifications').insert(rows).select()

  // 1b. Realtime Broadcast — direct pub/sub, far lower latency than postgres_changes
  // (no WAL polling / per-subscriber RLS). One HTTP send per recipient's channel;
  // never let a Realtime hiccup break the surrounding action.
  if (inserted?.length) {
    await Promise.all(
      inserted.map(row =>
        admin
          .channel(`notifications:${row.user_id}`)
          .httpSend('new', row)
          .catch(() => {}),
      ),
    )
  }

  // 2. Web Push — fire to every recipient's devices (no-op without VAPID keys)
  await sendPushToUsers(recipients.map(u => u.id), {
    title: payload.title,
    body:  payload.body,
    url:   payload.link ?? '/dashboard',
    tag:   payload.type,
  })

  // 3. Email (optional) — one send to all recipients
  if (payload.email) {
    const emails = recipients.map(u => u.email).filter(Boolean)
    if (emails.length) {
      const ctaUrl = payload.link && APP_URL ? `${APP_URL}${payload.link}` : undefined
      const html = renderNotificationEmail({
        badge:    payload.email.badge,
        title:    payload.title,
        subtitle: payload.email.subtitle,
        intro:    payload.email.intro ?? payload.body,
        stats:    payload.email.stats,
        ctaLabel: ctaUrl ? (payload.email.ctaLabel ?? 'Abrir en IL Stockroom') : undefined,
        ctaUrl,
      })
      await sendEmail({ to: emails, subject: payload.title, html })
    }
  }
}

/** Notify a set of users by id. */
export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const ids = [...new Set(userIds)].filter(Boolean)
  if (ids.length === 0) return
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id, email, enabled, notifications')
    .in('id', ids)
  await dispatch((data ?? []) as unknown as TargetUser[], payload)
}

/** Notify every enabled user holding one of the given roles. */
export async function notifyRoles(roles: string[], payload: NotifyPayload): Promise<void> {
  if (roles.length === 0) return
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id, email, enabled, notifications')
    .in('role', roles as Database['public']['Enums']['user_role'][])
    .eq('enabled', true)
  await dispatch((data ?? []) as unknown as TargetUser[], payload)
}

// ── Read / mutate (current user, via RLS) ──────────────────────────────────────

export async function getNotifications(limit = 30): Promise<Notification[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return (data ?? []) as unknown as Notification[]
}

export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .is('read_at', null)
  return count ?? 0
}

export async function markAsRead(id: number): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
    .is('read_at', null)
  if (error) return { error: error.message }
  return { success: true }
}

export async function markAllAsRead(): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Sin sesión' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .is('read_at', null)
  if (error) return { error: error.message }
  return { success: true }
}
