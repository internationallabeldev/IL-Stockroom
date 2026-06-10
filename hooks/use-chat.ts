'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getMessages,
  getReactions,
  getMessagesByIds,
  sendMessage as sendMessageAction,
  toggleReaction as toggleReactionAction,
  editMessage as editMessageAction,
  deleteMessage as deleteMessageAction,
  pinMessage as pinMessageAction,
  unpinMessage as unpinMessageAction,
  type ChatMessage,
  type ChatReaction,
} from '@/actions/chat.actions'

/** Data + realtime layer for a single chat channel: messages, reactions, and a
 *  cache of reply-source messages. Scroll handling lives in the message list. */
export function useChat(channelId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [reactions, setReactions] = useState<Map<number, ChatReaction[]>>(new Map())
  const [replies, setReplies] = useState<Map<number, ChatMessage>>(new Map())
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [sending, setSending] = useState(false)

  const messagesMap = useMemo(() => new Map(messages.map(m => [m.id, m])), [messages])
  const requestedReplies = useRef<Set<number>>(new Set())

  // Merge rows (insert or update), unique by id, sorted oldest → newest.
  const mergeMessages = useCallback((incoming: ChatMessage[]) => {
    setMessages(prev => {
      const map = new Map<number, ChatMessage>()
      for (const m of prev) map.set(m.id, m)
      for (const m of incoming) map.set(m.id, m)
      return [...map.values()].sort((a, b) => a.id - b.id)
    })
  }, [])

  const mergeReactions = useCallback((rows: ChatReaction[]) => {
    if (rows.length === 0) return
    setReactions(prev => {
      const next = new Map(prev)
      const byMsg = new Map<number, ChatReaction[]>()
      for (const r of rows) byMsg.set(r.message_id, [...(byMsg.get(r.message_id) ?? []), r])
      for (const [mid, list] of byMsg) {
        const existing = next.get(mid) ?? []
        const merged = new Map(existing.map(r => [r.id, r]))
        for (const r of list) merged.set(r.id, r)
        next.set(mid, [...merged.values()])
      }
      return next
    })
  }, [])

  const addReaction = useCallback((row: ChatReaction) => {
    setReactions(prev => {
      const next = new Map(prev)
      const existing = next.get(row.message_id) ?? []
      if (existing.some(r => r.id === row.id)) return prev
      next.set(row.message_id, [...existing, row])
      return next
    })
  }, [])

  const removeReactionById = useCallback((id: number) => {
    setReactions(prev => {
      const next = new Map(prev)
      for (const [mid, arr] of next) {
        if (arr.some(r => r.id === id)) {
          next.set(mid, arr.filter(r => r.id !== id))
          break
        }
      }
      return next
    })
  }, [])

  // Initial page (+ its reactions). Resets all per-channel state on switch so the
  // previous channel's messages/reactions don't flash before the new ones load.
  useEffect(() => {
    if (channelId == null) return
    let active = true
    setLoading(true)
    setMessages([])
    setReactions(new Map())
    setReplies(new Map())
    requestedReplies.current = new Set()
    getMessages(channelId).then(async res => {
      if (!active) return
      setMessages(res.messages)
      setHasMore(res.hasMore)
      setLoading(false)
      const rx = await getReactions(res.messages.map(m => m.id))
      if (active) mergeReactions(rx)
    })
    return () => { active = false }
  }, [channelId, mergeReactions])

  // Resolve missing reply-source messages for previews.
  useEffect(() => {
    const missing = messages
      .map(m => m.reply_to_id)
      .filter((id): id is number => id != null)
      .filter(id => !messagesMap.has(id) && !replies.has(id) && !requestedReplies.current.has(id))
    if (missing.length === 0) return
    missing.forEach(id => requestedReplies.current.add(id))
    getMessagesByIds(missing).then(rows => {
      if (rows.length === 0) return
      setReplies(prev => {
        const next = new Map(prev)
        for (const r of rows) next.set(r.id, r)
        return next
      })
    })
  }, [messages, messagesMap, replies])

  // Realtime — messages (insert/update) + reactions (insert/delete)
  useEffect(() => {
    if (channelId == null) return
    const supabase = createClient()
    const channel = supabase
      .channel(`chat:${channelId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channelId}` },
        payload => {
          if (payload.eventType === 'DELETE') return
          const row = payload.new as ChatMessage
          if (payload.eventType === 'INSERT' && row.is_deleted) return
          mergeMessages([row])
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_reactions' },
        payload => addReaction(payload.new as ChatReaction),
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'chat_reactions' },
        payload => {
          const old = payload.old as Partial<ChatReaction>
          if (old.id != null) removeReactionById(old.id)
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [channelId, mergeMessages, addReaction, removeReactionById])

  // Re-fetch the channel from scratch (used after clearing the bot DM, since the
  // realtime layer ignores message DELETEs).
  const reload = useCallback(async () => {
    if (channelId == null) return
    setLoading(true)
    setMessages([])
    setReactions(new Map())
    setReplies(new Map())
    requestedReplies.current = new Set()
    const res = await getMessages(channelId)
    setMessages(res.messages)
    setHasMore(res.hasMore)
    setLoading(false)
    const rx = await getReactions(res.messages.map(m => m.id))
    mergeReactions(rx)
  }, [channelId, mergeReactions])

  const loadMore = useCallback(async () => {
    if (channelId == null || messages.length === 0) return
    const oldest = messages[0].id
    const res = await getMessages(channelId, oldest)
    setHasMore(res.hasMore)
    mergeMessages(res.messages)
    const rx = await getReactions(res.messages.map(m => m.id))
    mergeReactions(rx)
  }, [channelId, messages, mergeMessages, mergeReactions])

  const send = useCallback(
    async (
      content: string,
      contentText: string,
      replyToId?: number,
      priority?: 'important' | 'warning' | 'urgent' | null,
    ) => {
      if (channelId == null) return { error: 'Sin canal' }
      setSending(true)
      try {
        const res = await sendMessageAction(channelId, content, contentText, replyToId, priority)
        if (res.message) mergeMessages([res.message])
        return res
      } finally {
        setSending(false)
      }
    },
    [channelId, mergeMessages],
  )

  const toggleReaction = useCallback(
    (messageId: number, emoji: string) => toggleReactionAction(messageId, emoji),
    [],
  )
  const editMessage = useCallback(
    (messageId: number, content: string, contentText: string) =>
      editMessageAction(messageId, content, contentText),
    [],
  )
  const deleteMessage = useCallback((messageId: number) => deleteMessageAction(messageId), [])
  const pinMessage = useCallback((messageId: number) => pinMessageAction(messageId), [])
  const unpinMessage = useCallback((messageId: number) => unpinMessageAction(messageId), [])

  const getReply = useCallback(
    (id: number) => messagesMap.get(id) ?? replies.get(id),
    [messagesMap, replies],
  )

  return {
    messages,
    reactions,
    loading,
    hasMore,
    sending,
    loadMore,
    reload,
    send,
    toggleReaction,
    editMessage,
    deleteMessage,
    pinMessage,
    unpinMessage,
    getReply,
  }
}
