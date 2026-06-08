'use client'

import { useEffect, useRef } from 'react'
import { format, isSameDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { MessageItem } from './message-item'
import { MessageEditor } from './message-editor'
import type { ChatMessage, ChatReaction, ChatUser } from '@/actions/chat.actions'

type Props = {
  messages: ChatMessage[]
  users: Map<string, ChatUser>
  mentionUsers: ChatUser[]
  currentUserId: string
  isAdmin: boolean
  hasMore: boolean
  loadMore: () => void
  reactions: Map<number, ChatReaction[]>
  getReply: (id: number) => ChatMessage | undefined
  editingId: number | null
  scrollToId: number | null
  onScrolled: () => void
  onReact: (messageId: number, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onEdit: (message: ChatMessage) => void
  onDelete: (messageId: number) => void
  onTogglePin: (message: ChatMessage) => void
  onSaveEdit: (messageId: number, content: string, contentText: string) => void
  onCancelEdit: () => void
}

const GROUP_GAP_MS = 5 * 60 * 1000

function dayLabel(iso: string): string {
  return format(new Date(iso), "d 'de' MMMM yyyy", { locale: es })
}

export function MessageList({
  messages, users, mentionUsers, currentUserId, isAdmin, hasMore, loadMore,
  reactions, getReply, editingId, scrollToId, onScrolled,
  onReact, onReply, onEdit, onDelete, onTogglePin, onSaveEdit, onCancelEdit,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)
  const prevHeightRef = useRef(0)
  const prependingRef = useRef(false)

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    atBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  // After messages change: preserve position when prepending, else autoscroll if at bottom.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (prependingRef.current) {
      el.scrollTop = el.scrollHeight - prevHeightRef.current
      prependingRef.current = false
    } else if (atBottomRef.current) {
      el.scrollTop = el.scrollHeight
    }
  }, [messages])

  // Infinite scroll upward.
  useEffect(() => {
    const sentinel = topSentinelRef.current
    const root = containerRef.current
    if (!sentinel || !root || !hasMore) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting) {
          prevHeightRef.current = root.scrollHeight
          prependingRef.current = true
          loadMore()
        }
      },
      { root, threshold: 0.1 },
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [hasMore, loadMore])

  // Jump to a message (from pinned list).
  useEffect(() => {
    if (scrollToId == null) return
    const el = containerRef.current?.querySelector(`[data-message-id="${scrollToId}"]`)
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      el.classList.add('bg-primary/10')
      setTimeout(() => el.classList.remove('bg-primary/10'), 1500)
    }
    onScrolled()
  }, [scrollToId, onScrolled])

  return (
    <div ref={containerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-2">
      {hasMore && <div ref={topSentinelRef} className="h-px" />}

      {messages.map((m, i) => {
        const prev = messages[i - 1]
        const sameDay =
          prev && prev.created_at && m.created_at &&
          isSameDay(new Date(prev.created_at), new Date(m.created_at))
        const showDay = !sameDay
        const gap =
          prev && prev.created_at && m.created_at
            ? new Date(m.created_at).getTime() - new Date(prev.created_at).getTime()
            : Infinity
        const showHeader = showDay || !prev || prev.user_id !== m.user_id || gap > GROUP_GAP_MS
        const replyTo = m.reply_to_id != null ? getReply(m.reply_to_id) : undefined

        return (
          <div key={m.id}>
            {showDay && m.created_at && (
              <div className="my-2 flex items-center gap-2 px-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {dayLabel(m.created_at)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

            {editingId === m.id ? (
              <div className="px-3 py-1">
                <MessageEditor
                  mentionUsers={mentionUsers}
                  initialContent={m.content}
                  onSend={(content, text) => onSaveEdit(m.id, content, text)}
                  onCancel={onCancelEdit}
                />
              </div>
            ) : (
              <MessageItem
                message={m}
                author={users.get(m.user_id)}
                showHeader={showHeader}
                isOwn={m.user_id === currentUserId}
                isAdmin={isAdmin}
                currentUserId={currentUserId}
                reactions={reactions.get(m.id) ?? []}
                replyTo={replyTo}
                replyToAuthor={replyTo ? users.get(replyTo.user_id) : undefined}
                onReact={onReact}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
