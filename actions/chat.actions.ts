'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import { notifyUsers } from './notifications.actions'
import type { Database } from '@/types/database.types'

// ── Types ────────────────────────────────────────────────────────────────────

export type ChatChannel = Database['public']['Tables']['chat_channels']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type ChatReaction = Database['public']['Tables']['chat_reactions']['Row']

/** Lightweight user directory used to render message authors (and @mentions later).
 *  chat_messages.user_id FKs auth.users, so authors are resolved client-side by id
 *  rather than via a PostgREST embed. */
export type ChatUser = {
  id: string
  first_name: string
  last_name: string
  nickname: string | null
  avatar_url: string | null
  role: Database['public']['Enums']['user_role']
}

const PAGE = 30

// ── Reads ──────────────────────────────────────────────────────────────────────

/** The single default ("general") channel. */
export async function getGeneralChannel(): Promise<ChatChannel | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('chat_channels')
    .select('*')
    .eq('is_default', true)
    .order('id')
    .limit(1)
    .maybeSingle()
  return data ?? null
}

/** Directory of enabled users, for resolving authors and (later) mentions.
 *  Uses the admin client because users RLS may forbid reading other rows;
 *  only non-sensitive display fields are exposed, gated by an auth check. */
export async function getChatUsers(): Promise<ChatUser[]> {
  const me = await getSessionUser()
  if (!me) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('users')
    .select('id, first_name, last_name, nickname, avatar_url, role')
    .eq('enabled', true)
    .order('first_name')
  return (data ?? []) as ChatUser[]
}

/** Cursor-based page of messages, oldest→newest for rendering.
 *  `cursor` = id of the oldest message already loaded (fetch strictly older). */
export async function getMessages(
  channelId: number,
  cursor?: number,
  limit = PAGE,
): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const supabase = await createClient()
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .order('id', { ascending: false })
    .limit(limit + 1)
  if (cursor) query = query.lt('id', cursor)

  const { data } = await query
  const rows = data ?? []
  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  return { messages: page.reverse(), hasMore }
}

/** Count of unread messages in a channel (others' messages newer than last read). */
export async function getUnreadCount(channelId: number): Promise<number> {
  const me = await getSessionUser()
  if (!me) return 0
  const supabase = await createClient()

  const { data: status } = await supabase
    .from('chat_read_status')
    .select('last_read_message_id')
    .eq('channel_id', channelId)
    .maybeSingle()

  const lastRead = status?.last_read_message_id ?? 0
  const { count } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('channel_id', channelId)
    .eq('is_deleted', false)
    .gt('id', lastRead)
    .neq('user_id', me.id)
  return count ?? 0
}

// ── Mutations ────────────────────────────────────────────────────────────────

/** Extract user ids from Tiptap @mention spans (`data-type="mention" … data-id="…"`). */
function parseMentionIds(html: string): string[] {
  const ids = new Set<string>()
  const spanRe = /<span\b[^>]*\bdata-type="mention"[^>]*>/g
  let m: RegExpExecArray | null
  while ((m = spanRe.exec(html))) {
    const idMatch = /data-id="([^"]+)"/.exec(m[0])
    if (idMatch) ids.add(idMatch[1])
  }
  return [...ids]
}

export async function sendMessage(
  channelId: number,
  content: string,
  contentText: string,
  replyToId?: number,
  priority?: 'important' | 'warning' | 'urgent' | null,
): Promise<{ message?: ChatMessage; error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }

  const text = contentText.trim()
  if (!text) return { error: 'El mensaje está vacío' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      channel_id: channelId,
      user_id: me.id,
      content,
      content_text: text,
      reply_to_id: replyToId ?? null,
      priority: priority ?? null,
    })
    .select('*')
    .single()

  if (error) return { error: error.message }

  // Mentions → chat_mentions rows + system notifications (don't block the send).
  const mentionIds = parseMentionIds(content).filter(id => id !== me.id)
  if (mentionIds.length > 0) {
    const admin = createAdminClient()
    const { data: valid } = await admin
      .from('users')
      .select('id')
      .in('id', mentionIds)
      .eq('enabled', true)
    const targets = (valid ?? []).map(u => u.id)
    if (targets.length > 0) {
      await admin
        .from('chat_mentions')
        .insert(targets.map(uid => ({ message_id: data.id, mentioned_user_id: uid })))
      const senderName = me.nickname || me.first_name
      await notifyUsers(targets, {
        type: 'chat_mention',
        title: `${senderName} te mencionó en el chat`,
        body: text.slice(0, 100),
        link: '/dashboard',
        metadata: { message_id: data.id, channel_id: channelId },
      })
    }
  }

  return { message: data }
}

/** UPSERT the user's read marker for a channel. */
export async function updateReadStatus(
  channelId: number,
  lastMessageId: number,
): Promise<void> {
  const me = await getSessionUser()
  if (!me) return
  const supabase = await createClient()
  await supabase
    .from('chat_read_status')
    .upsert(
      {
        user_id: me.id,
        channel_id: channelId,
        last_read_message_id: lastMessageId,
        last_read_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,channel_id' },
    )
}

// ── Reactions ────────────────────────────────────────────────────────────────

/** Reactions for a set of messages (used to hydrate the loaded window). */
export async function getReactions(messageIds: number[]): Promise<ChatReaction[]> {
  if (messageIds.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase
    .from('chat_reactions')
    .select('*')
    .in('message_id', messageIds)
  return data ?? []
}

/** Add the reaction if absent, remove it if present (toggle). */
export async function toggleReaction(
  messageId: number,
  emoji: string,
): Promise<{ error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('chat_reactions')
    .select('id')
    .eq('message_id', messageId)
    .eq('user_id', me.id)
    .eq('emoji', emoji)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase.from('chat_reactions').delete().eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase
      .from('chat_reactions')
      .insert({ message_id: messageId, user_id: me.id, emoji })
    if (error) return { error: error.message }
  }
  return {}
}

// ── Replies ──────────────────────────────────────────────────────────────────

/** Fetch specific messages by id (includes deleted, so reply previews can show a
 *  "deleted" placeholder). */
export async function getMessagesByIds(ids: number[]): Promise<ChatMessage[]> {
  if (ids.length === 0) return []
  const supabase = await createClient()
  const { data } = await supabase.from('chat_messages').select('*').in('id', ids)
  return data ?? []
}

// ── Edit / delete ────────────────────────────────────────────────────────────

export async function editMessage(
  messageId: number,
  content: string,
  contentText: string,
): Promise<{ error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }
  const text = contentText.trim()
  if (!text) return { error: 'El mensaje está vacío' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('chat_messages')
    .update({ content, content_text: text, edited_at: new Date().toISOString() })
    .eq('id', messageId)
    .eq('user_id', me.id) // author only
  if (error) return { error: error.message }
  return {}
}

/** Soft delete. Author can delete their own; ADMIN can delete any. */
export async function deleteMessage(messageId: number): Promise<{ error?: string }> {
  const me = await getSessionUser()
  if (!me) return { error: 'Sin sesión' }
  const supabase = await createClient()

  let query = supabase
    .from('chat_messages')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('id', messageId)
  if (me.role !== 'ADMIN') query = query.eq('user_id', me.id)

  const { error } = await query
  if (error) return { error: error.message }
  return {}
}

// ── Pins (ADMIN) ─────────────────────────────────────────────────────────────

async function setPinned(messageId: number, pinned: boolean): Promise<{ error?: string }> {
  const me = await getSessionUser()
  if (!me || me.role !== 'ADMIN') return { error: 'Sin permisos' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('chat_messages')
    .update({ is_pinned: pinned })
    .eq('id', messageId)
  if (error) return { error: error.message }
  return {}
}

export async function pinMessage(messageId: number) {
  return setPinned(messageId, true)
}

export async function unpinMessage(messageId: number) {
  return setPinned(messageId, false)
}

export async function getPinnedMessages(channelId: number): Promise<ChatMessage[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('channel_id', channelId)
    .eq('is_pinned', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
  return data ?? []
}

// ── Mentions ─────────────────────────────────────────────────────────────────

export async function markMentionAsRead(mentionId: number): Promise<void> {
  const supabase = await createClient()
  await supabase.from('chat_mentions').update({ is_read: true }).eq('id', mentionId)
}
