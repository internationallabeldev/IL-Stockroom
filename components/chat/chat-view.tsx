'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { MessageCircle, Pin, X, Info, Maximize2, Minimize2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MessageList } from './message-list'
import { MessageEditor } from './message-editor'
import { ReplyPreview } from './reply-preview'
import { PinnedMessages } from './pinned-messages'
import { useChat } from '@/hooks/use-chat'
import {
  getChatUsers,
  updateReadStatus,
  type ChatChannel,
  type ChatMessage,
  type ChatUser,
} from '@/actions/chat.actions'
import type { Database } from '@/types/database.types'
import type { ChatPriority } from '@/lib/chat/constants'

type Props = {
  channel: ChatChannel
  currentUserId: string
  userRole: Database['public']['Enums']['user_role']
  maximized: boolean
  onToggleMaximize: () => void
  onClose: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
}

export function ChatView({
  channel, currentUserId, userRole, maximized, onToggleMaximize, onClose, onPointerDownDrag,
}: Props) {
  const chat = useChat(channel.id)
  const { messages, reactions, loading, hasMore, sending, loadMore, send, getReply } = chat
  const isAdmin = userRole === 'ADMIN'

  const [users, setUsers] = useState<Map<string, ChatUser>>(new Map())
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [scrollToId, setScrollToId] = useState<number | null>(null)
  const lastReadRef = useRef(0)

  const mentionUsers = useMemo(() => [...users.values()], [users])

  useEffect(() => {
    getChatUsers().then(list => setUsers(new Map(list.map(u => [u.id, u]))))
  }, [])

  // Persist read status as new messages arrive while open.
  useEffect(() => {
    if (messages.length === 0) return
    const lastId = messages[messages.length - 1].id
    if (lastId <= lastReadRef.current) return
    lastReadRef.current = lastId
    void updateReadStatus(channel.id, lastId)
  }, [messages, channel.id])

  const handleSend = useCallback(
    async (content: string, contentText: string, priority?: ChatPriority | null) => {
      const res = await send(content, contentText, replyTarget?.id, priority)
      if (res?.error) toast.error(res.error)
      else setReplyTarget(null)
    },
    [send, replyTarget],
  )

  const handleReact = useCallback(
    async (messageId: number, emoji: string) => {
      const res = await chat.toggleReaction(messageId, emoji)
      if (res?.error) toast.error(res.error)
    },
    [chat],
  )

  const handleSaveEdit = useCallback(
    async (messageId: number, content: string, contentText: string) => {
      const res = await chat.editMessage(messageId, content, contentText)
      if (res?.error) toast.error(res.error)
      else setEditingId(null)
    },
    [chat],
  )

  const handleDelete = useCallback(
    async (messageId: number) => {
      const res = await chat.deleteMessage(messageId)
      if (res?.error) toast.error(res.error)
    },
    [chat],
  )

  const handleTogglePin = useCallback(
    async (message: ChatMessage) => {
      const res = message.is_pinned
        ? await chat.unpinMessage(message.id)
        : await chat.pinMessage(message.id)
      if (res?.error) toast.error(res.error)
    },
    [chat],
  )

  const handleJump = useCallback(
    (messageId: number) => {
      if (messages.some(m => m.id === messageId)) setScrollToId(messageId)
      else toast.info('Desplázate hacia arriba para cargar ese mensaje')
    },
    [messages],
  )

  return (
    <div className="flex h-full flex-col">
      {/* Header (drag handle) */}
      <div
        onPointerDown={onPointerDownDrag}
        className="flex shrink-0 cursor-move touch-none select-none items-center justify-between border-b border-border bg-background px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="size-4 text-foreground/60" />
          <span className="text-[11px] font-bold uppercase tracking-widest">{channel.name}</span>
        </div>
        <div className="flex items-center gap-0.5" onPointerDown={e => e.stopPropagation()}>
          {/* Formatting help */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                title="Ayuda de formato"
                aria-label="Ayuda de formato"
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Info className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" collisionPadding={8} style={{ zIndex: 70 }} className="w-72 gap-0 p-0">
              <div className="border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-widest">
                Formato
              </div>
              <div className="space-y-2 p-3 text-[11px] leading-relaxed">
                <FormatRow keys="Ctrl + B" label="Negrita" hint="**texto**" />
                <FormatRow keys="Ctrl + I" label="Cursiva" hint="*texto*" />
                <FormatRow keys="Ctrl + E" label="Código" hint="`texto`" />
                <FormatRow keys="Ctrl ⇧ 8" label="Lista" hint="- texto" />
                <FormatRow keys="Ctrl ⇧ 7" label="Lista numerada" hint="1. texto" />
                <FormatRow keys="Ctrl ⇧ B" label="Cita" hint="> texto" />
                <FormatRow keys="Ctrl Alt 1" label="Encabezado" hint="# texto" />
                <FormatRow keys="@" label="Mencionar" hint="elige de la lista" />
                <div className="border-t border-border/60 pt-2 text-muted-foreground">
                  <span className="font-semibold text-foreground">Enter</span> envía ·{' '}
                  <span className="font-semibold text-foreground">Shift + Enter</span> salto de línea
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <PinnedMessages
            channelId={channel.id}
            isAdmin={isAdmin}
            users={users}
            onJump={handleJump}
            onUnpin={id => chat.unpinMessage(id)}
          >
            <button
              title="Mensajes fijados"
              aria-label="Mensajes fijados"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Pin className="size-4" />
            </button>
          </PinnedMessages>

          <button
            onClick={onToggleMaximize}
            title={maximized ? 'Restaurar tamaño' : 'Maximizar'}
            aria-label={maximized ? 'Restaurar tamaño' : 'Maximizar'}
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {maximized ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </button>

          <button
            onClick={onClose}
            aria-label="Cerrar chat"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-[11px] text-muted-foreground">
            {loading ? 'Cargando…' : `Sé el primero en escribir en ${channel.name}.`}
          </p>
        </div>
      ) : (
        <MessageList
          messages={messages}
          users={users}
          mentionUsers={mentionUsers}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          hasMore={hasMore}
          loadMore={loadMore}
          reactions={reactions}
          getReply={getReply}
          editingId={editingId}
          scrollToId={scrollToId}
          onScrolled={() => setScrollToId(null)}
          onReact={handleReact}
          onReply={setReplyTarget}
          onEdit={m => setEditingId(m.id)}
          onDelete={handleDelete}
          onTogglePin={handleTogglePin}
          onSaveEdit={handleSaveEdit}
          onCancelEdit={() => setEditingId(null)}
        />
      )}

      {/* Reply banner */}
      {replyTarget && (
        <ReplyPreview
          message={replyTarget}
          author={users.get(replyTarget.user_id)}
          onCancel={() => setReplyTarget(null)}
        />
      )}

      <MessageEditor onSend={handleSend} disabled={sending} mentionUsers={mentionUsers} />
    </div>
  )
}

function FormatRow({ keys, label, hint }: { keys: string; label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-medium text-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <code className="rounded bg-muted px-1 py-0.5 text-[10px]">{hint}</code>
        <kbd className="rounded border border-border bg-foreground/5 px-1 py-0.5 text-[9px]">{keys}</kbd>
      </span>
    </div>
  )
}
