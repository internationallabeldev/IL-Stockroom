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

/** A channel enriched with the current user's unread count and a last-message preview.
 *  `is_member` drives the read-only composer: a viewer of a private channel who isn't
 *  a member (e.g. an ADMIN moderating) can read but not post. Always true for the
 *  channels a non-ADMIN sees (they only see public channels or ones they belong to). */
export type ChannelWithMeta = ChatChannel & {
  unread_count: number
  last_message: { content_text: string | null; created_at: string | null } | null
  is_member: boolean
}

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

/** Channels visible to the current user, each with unread count + last-message preview.
 *  Non-ADMINs never see archived channels; ADMINs see them (rendered collapsed in the UI).
 *  Default channel first, then alphabetical. */
export async function getChannels(): Promise<ChannelWithMeta[]> {
  const me = await getSessionUser()
  if (!me) return []
  const supabase = await createClient()

  let query = supabase
    .from('chat_channels')
    .select('*')
    .order('is_default', { ascending: false })
    .order('name')
  if (me.role !== 'ADMIN') query = query.eq('is_archived', false)

  const { data: channels } = await query
  const list = channels ?? []
  if (list.length === 0) return []

  // The user's read markers (RLS already scopes chat_read_status to the caller).
  const { data: statuses } = await supabase
    .from('chat_read_status')
    .select('channel_id, last_read_message_id')
    .eq('user_id', me.id)
  const lastReadByChannel = new Map(
    (statuses ?? []).map(s => [s.channel_id, s.last_read_message_id ?? 0]),
  )

  // The user's channel memberships (own rows pass RLS) → drives is_member.
  const { data: memberships } = await supabase
    .from('chat_channel_members')
    .select('channel_id')
    .eq('user_id', me.id)
  const memberOf = new Set((memberships ?? []).map(m => m.channel_id))

  return Promise.all(
    list.map(async channel => {
      const lastRead = lastReadByChannel.get(channel.id) ?? 0
      const [{ count }, { data: lastMsg }] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .gt('id', lastRead)
          .neq('user_id', me.id),
        supabase
          .from('chat_messages')
          .select('content_text, created_at')
          .eq('channel_id', channel.id)
          .eq('is_deleted', false)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      return {
        ...channel,
        unread_count: count ?? 0,
        last_message: lastMsg ?? null,
        is_member: !channel.is_private || memberOf.has(channel.id),
      }
    }),
  )
}

/** Sum of unread messages across every channel the user can see (for the launcher badge). */
export async function getTotalUnreadCount(): Promise<number> {
  const channels = await getChannels()
  return channels.reduce((sum, c) => sum + c.unread_count, 0)
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

// ── Channels (ADMIN) ───────────────────────────────────────────────────────────

/** URL-safe slug from a channel name (accent-stripped, lowercased, dash-joined). */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip diacritics
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Create a non-default channel. ADMIN only. Slug derived from the name (deduped).
 *  When `is_private`, the creator plus `member_ids` are seeded as members; nobody
 *  else can see or post to the channel (ADMINs excepted, who can moderate any). */
export async function createChannel(data: {
  name: string
  description?: string | null
  retention_days: number | null
  is_private?: boolean
  member_ids?: string[]
}): Promise<{ channel?: ChatChannel; error?: string }> {
  const me = await getSessionUser()
  if (!me || me.role !== 'ADMIN') return { error: 'Sin permisos' }

  const name = data.name.trim()
  if (!name) return { error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const base = slugify(name) || 'canal'
  const { data: existing } = await supabase
    .from('chat_channels')
    .select('slug')
    .like('slug', `${base}%`)
  const taken = new Set((existing ?? []).map(c => c.slug))
  let slug = base
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`

  const isPrivate = !!data.is_private
  const { data: channel, error } = await supabase
    .from('chat_channels')
    .insert({
      name,
      description: data.description?.trim() || null,
      slug,
      is_default: false,
      is_private: isPrivate,
      created_by: me.id,
      retention_days: data.retention_days,
    })
    .select('*')
    .single()

  if (error || !channel) return { error: error?.message ?? 'No se pudo crear el canal' }

  // Seed membership for private channels (creator is always a member).
  if (isPrivate) {
    const ids = new Set<string>([me.id, ...(data.member_ids ?? [])])
    const admin = createAdminClient()
    await admin
      .from('chat_channel_members')
      .insert([...ids].map(uid => ({ channel_id: channel.id, user_id: uid, added_by: me.id })))
  }

  return { channel }
}

/** User ids that belong to a channel (empty for public channels). */
export async function getChannelMembers(channelId: number): Promise<string[]> {
  const me = await getSessionUser()
  if (!me) return []
  const admin = createAdminClient()
  const { data } = await admin
    .from('chat_channel_members')
    .select('user_id')
    .eq('channel_id', channelId)
  return (data ?? []).map(m => m.user_id)
}

/** Replace a private channel's membership with `memberIds` (the creator is always
 *  kept). Creator-only; the general channel never has members. */
export async function setChannelMembers(
  channelId: number,
  memberIds: string[],
): Promise<{ error?: string }> {
  const { channel, error: authError } = await authorizeChannelOwner(channelId)
  if (authError) return { error: authError }
  if (channel!.is_default) return { error: 'El canal general no admite miembros' }

  const desired = new Set<string>(memberIds)
  if (channel!.created_by) desired.add(channel!.created_by) // creator always belongs

  const admin = createAdminClient()
  await admin.from('chat_channel_members').delete().eq('channel_id', channelId)
  if (desired.size > 0) {
    const { error } = await admin
      .from('chat_channel_members')
      .insert([...desired].map(uid => ({ channel_id: channelId, user_id: uid, added_by: channel!.created_by })))
    if (error) return { error: error.message }
  }
  return {}
}

/** Look up a channel's guard fields and confirm the caller is its ADMIN creator. */
async function authorizeChannelOwner(
  channelId: number,
): Promise<{ channel?: Pick<ChatChannel, 'is_default' | 'created_by'>; error?: string }> {
  const me = await getSessionUser()
  if (!me || me.role !== 'ADMIN') return { error: 'Sin permisos' }
  const supabase = await createClient()
  const { data: channel } = await supabase
    .from('chat_channels')
    .select('is_default, created_by')
    .eq('id', channelId)
    .maybeSingle()
  if (!channel) return { error: 'Canal no encontrado' }
  if (channel.created_by !== me.id) return { error: 'Solo el creador puede modificar este canal' }
  return { channel }
}

/** Edit name/description/retention. The general channel may be edited by any ADMIN
 *  (it has no creator); other channels only by their creator. slug/is_default are immutable. */
export async function updateChannel(
  channelId: number,
  data: {
    name?: string
    description?: string | null
    retention_days?: number | null
    is_private?: boolean
  },
): Promise<{ channel?: ChatChannel; error?: string }> {
  const me = await getSessionUser()
  if (!me || me.role !== 'ADMIN') return { error: 'Sin permisos' }
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('chat_channels')
    .select('is_default, created_by')
    .eq('id', channelId)
    .maybeSingle()
  if (!existing) return { error: 'Canal no encontrado' }
  if (!existing.is_default && existing.created_by !== me.id)
    return { error: 'Solo el creador puede modificar este canal' }

  const patch: Database['public']['Tables']['chat_channels']['Update'] = {}
  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name) return { error: 'El nombre es obligatorio' }
    patch.name = name
  }
  if (data.description !== undefined) patch.description = data.description?.trim() || null
  if (data.retention_days !== undefined) patch.retention_days = data.retention_days
  if (data.is_private !== undefined) {
    if (existing.is_default && data.is_private)
      return { error: 'El canal general no puede ser privado' }
    patch.is_private = data.is_private
  }

  const { data: channel, error } = await supabase
    .from('chat_channels')
    .update(patch)
    .eq('id', channelId)
    .select('*')
    .single()
  if (error) return { error: error.message }

  // Made private → guarantee the creator is a member so the channel isn't orphaned.
  if (data.is_private === true && existing.created_by) {
    const admin = createAdminClient()
    await admin
      .from('chat_channel_members')
      .upsert(
        { channel_id: channelId, user_id: existing.created_by, added_by: existing.created_by },
        { onConflict: 'channel_id,user_id' },
      )
  }

  return { channel }
}

/** Archive (hide from non-ADMINs) or restore a channel. Creator only; never the general channel. */
export async function setChannelArchived(
  channelId: number,
  archived: boolean,
): Promise<{ error?: string }> {
  const { channel, error: authError } = await authorizeChannelOwner(channelId)
  if (authError) return { error: authError }
  if (channel!.is_default) return { error: 'No se puede archivar el canal general' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('chat_channels')
    .update({ is_archived: archived, archived_at: archived ? new Date().toISOString() : null })
    .eq('id', channelId)
  if (error) return { error: error.message }
  return {}
}

/** Permanently delete a channel and its messages (FK cascade). Creator only; never the general channel. */
export async function deleteChannel(channelId: number): Promise<{ error?: string }> {
  const { channel, error: authError } = await authorizeChannelOwner(channelId)
  if (authError) return { error: authError }
  if (channel!.is_default) return { error: 'No se puede eliminar el canal general' }

  const supabase = await createClient()
  const { error } = await supabase.from('chat_channels').delete().eq('id', channelId)
  if (error) return { error: error.message }
  return {}
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
