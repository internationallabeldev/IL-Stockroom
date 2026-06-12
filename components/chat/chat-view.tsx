'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  MessageCircle, Pin, X, Info, Maximize2, Minimize2, Settings, PanelLeftClose, PanelLeftOpen, Hash, Archive, Lock, Eraser,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import { MessageList } from './message-list'
import { MessageEditor } from './message-editor'
import { ReplyPreview } from './reply-preview'
import { PinnedMessages } from './pinned-messages'
import { ChannelSidebar } from './channel-sidebar'
import { ChannelSettings } from './channel-settings'
import { BotTypingIndicator } from './bot-typing-indicator'
import { useChat } from '@/hooks/use-chat'
import {
  getChannels,
  getChatUsers,
  updateReadStatus,
  type ChannelWithMeta,
  type ChatChannel,
  type ChatMessage,
  type ChatUser,
} from '@/actions/chat.actions'
import { askBot, getOrCreateBotChannel, clearBotConversation } from '@/actions/bot.actions'
import type { Database } from '@/types/database.types'
import type { ChatPriority } from '@/lib/chat/constants'

type Props = {
  /** The general channel — used as the initial + fallback channel. */
  initialChannel: ChatChannel
  currentUserId: string
  userRole: Database['public']['Enums']['user_role']
  /** Current widget width — drives auto-collapsing the channel sidebar when narrow. */
  width: number
  maximized: boolean
  onToggleMaximize: () => void
  onClose: () => void
  onPointerDownDrag: (e: React.PointerEvent) => void
}

/** Below this widget width the sidebar (144px) leaves too little room for messages,
 *  so we auto-collapse it. */
const SIDEBAR_BREAKPOINT = 480

const BOT_USER_ID = process.env.NEXT_PUBLIC_BOT_USER_ID

/** True when the sent message @mentions the bot (its id appears in a mention span). */
function mentionsBot(html: string): boolean {
  return !!BOT_USER_ID && html.includes(BOT_USER_ID)
}

export function ChatView({
  initialChannel, currentUserId, userRole, width, maximized, onToggleMaximize, onClose, onPointerDownDrag,
}: Props) {
  const isAdmin = userRole === 'ADMIN'

  const [channels, setChannels] = useState<ChannelWithMeta[]>([])
  const [activeChannelId, setActiveChannelId] = useState(initialChannel.id)
  const [users, setUsers] = useState<Map<string, ChatUser>>(new Map())
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [scrollToId, setScrollToId] = useState<number | null>(null)
  const narrow = width < SIDEBAR_BREAKPOINT
  const [sidebarOpen, setSidebarOpen] = useState(!narrow)
  const [botTyping, setBotTyping] = useState(false)
  const lastReadRef = useRef(0)

  // Auto-collapse/expand the sidebar when the widget crosses the narrow threshold
  // (e.g. via resize or maximize). Manual toggles within a width regime are preserved
  // because this only fires when `narrow` actually flips.
  useEffect(() => {
    setSidebarOpen(!narrow)
  }, [narrow])

  // Fallback so the header/empty-state render before getChannels resolves.
  const activeChannel: ChannelWithMeta = useMemo(
    () =>
      channels.find(c => c.id === activeChannelId) ?? {
        ...initialChannel,
        unread_count: 0,
        last_message: null,
        is_member: true,
      },
    [channels, activeChannelId, initialChannel],
  )

  // A private channel you're not a member of is read-only (e.g. an ADMIN moderating).
  const canPost = !activeChannel.is_private || activeChannel.is_member

  const chat = useChat(activeChannelId)
  const { messages, reactions, loading, hasMore, sending, loadMore, send, getReply } = chat

  const mentionUsers = useMemo(() => [...users.values()], [users])
  const canManageChannel = isAdmin && (activeChannel.is_default || activeChannel.created_by === currentUserId)

  const refreshChannels = useCallback(() => {
    getChannels().then(setChannels)
  }, [])

  useEffect(() => { refreshChannels() }, [refreshChannels])
  useEffect(() => {
    getChatUsers().then(list => setUsers(new Map(list.map(u => [u.id, u]))))
  }, [])

  // Reset the read marker when switching channels, and clear the unread badge of the
  // channel we just opened.
  useEffect(() => {
    lastReadRef.current = 0
    setChannels(prev => prev.map(c => (c.id === activeChannelId ? { ...c, unread_count: 0 } : c)))
  }, [activeChannelId])

  // Persist read status as new messages arrive in the active channel.
  useEffect(() => {
    if (messages.length === 0) return
    const lastId = messages[messages.length - 1].id
    if (lastId <= lastReadRef.current) return
    lastReadRef.current = lastId
    void updateReadStatus(activeChannelId, lastId)
  }, [messages, activeChannelId])

  // Realtime: bump the sidebar unread badge for *other* channels (the active one is
  // covered by the read-status effect above).
  const activeIdRef = useRef(activeChannelId)
  activeIdRef.current = activeChannelId
  useEffect(() => {
    const supabase = createClient()
    const ch = supabase
      .channel('chat-sidebar-unread')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const row = payload.new as ChatMessage
          if (row.user_id === currentUserId || row.is_deleted) return
          if (row.channel_id === activeIdRef.current) return
          setChannels(prev =>
            prev.map(c =>
              c.id === row.channel_id
                ? {
                    ...c,
                    unread_count: c.unread_count + 1,
                    last_message: { content_text: row.content_text, created_at: row.created_at },
                  }
                : c,
            ),
          )
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [currentUserId])

  const handleSelectChannel = useCallback((channel: ChannelWithMeta) => {
    setActiveChannelId(channel.id)
    setReplyTarget(null)
    setEditingId(null)
  }, [])

  const handleChannelCreated = useCallback((channel: ChatChannel) => {
    setActiveChannelId(channel.id)
    refreshChannels()
  }, [refreshChannels])

  const handleChannelUpdated = useCallback((channel: ChatChannel) => {
    setChannels(prev =>
      prev.map(c => (c.id === channel.id ? { ...c, ...channel } : c)),
    )
  }, [])

  // Archived/deleted active channel → fall back to the general channel and refresh.
  const handleLeaveChannel = useCallback(() => {
    setActiveChannelId(initialChannel.id)
    refreshChannels()
  }, [initialChannel.id, refreshChannels])

  const handleSend = useCallback(
    async (content: string, contentText: string, priority?: ChatPriority | null) => {
      const res = await send(content, contentText, replyTarget?.id, priority)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setReplyTarget(null)

      // Trigger the assistant: every message in its DM, or any @mention elsewhere.
      const isBotDm = !!activeChannel.is_bot_dm
      if (!isBotDm && !mentionsBot(content)) return
      setBotTyping(true)
      try {
        const r = await askBot({ question: contentText, channelId: activeChannelId, withContext: isBotDm })
        if (r?.error && isBotDm) toast.error(r.error)
      } finally {
        setBotTyping(false)
      }
    },
    [send, replyTarget, activeChannel.is_bot_dm, activeChannelId],
  )

  // Open (lazily creating) the private chat with the IA assistant.
  const handleOpenBot = useCallback(async () => {
    const res = await getOrCreateBotChannel()
    if (res.error || !res.channel) {
      toast.error(res.error ?? 'No se pudo abrir el asistente')
      return
    }
    setActiveChannelId(res.channel.id)
    setReplyTarget(null)
    setEditingId(null)
    refreshChannels()
  }, [refreshChannels])

  // Wipe the bot DM history (resets context + frees tokens).
  const handleClearBot = useCallback(async () => {
    if (!window.confirm('¿Borrar toda la conversación con el asistente?')) return
    const res = await clearBotConversation(activeChannelId)
    if (res.error) {
      toast.error(res.error)
      return
    }
    await chat.reload()
  }, [activeChannelId, chat])

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
    <div className="flex h-full">
      {sidebarOpen && (
        <ChannelSidebar
          channels={channels}
          activeId={activeChannelId}
          isAdmin={isAdmin}
          onSelect={handleSelectChannel}
          onCreated={handleChannelCreated}
          onOpenBot={handleOpenBot}
          users={mentionUsers}
          currentUserId={currentUserId}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header (drag handle) */}
        <div
          onPointerDown={onPointerDownDrag}
          className="flex shrink-0 cursor-move touch-none select-none items-center justify-between border-b border-border bg-background px-3 py-2"
        >
          <div className="flex min-w-0 items-center gap-2">
            <button
              onClick={() => setSidebarOpen(o => !o)}
              onPointerDown={e => e.stopPropagation()}
              title={sidebarOpen ? 'Ocultar canales' : 'Mostrar canales'}
              aria-label={sidebarOpen ? 'Ocultar canales' : 'Mostrar canales'}
              className="flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              {sidebarOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
            </button>
            {activeChannel.is_private ? (
              <Lock className="size-3.5 shrink-0 text-foreground/60" />
            ) : (
              <Hash className="size-3.5 shrink-0 text-foreground/60" />
            )}
            <span className="truncate text-[11px] font-bold uppercase tracking-widest">
              {activeChannel.name}
            </span>
            {activeChannel.is_archived && (
              <span className="flex shrink-0 items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                <Archive className="size-2.5" /> Archivado
              </span>
            )}
          </div>

          <div className="flex items-center gap-0.5" onPointerDown={e => e.stopPropagation()}>
            {/* Channel settings (ADMIN creator / general) */}
            {canManageChannel && (
              <ChannelSettings
                key={activeChannel.id}
                channel={activeChannel}
                onUpdated={handleChannelUpdated}
                onArchivedChange={handleLeaveChannel}
                onDeleted={handleLeaveChannel}
                users={mentionUsers}
                currentUserId={currentUserId}
              >
                <button
                  title="Configuración del canal"
                  aria-label="Configuración del canal"
                  className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Settings className="size-4" />
                </button>
              </ChannelSettings>
            )}

            {/* Clear conversation (bot DM only) */}
            {activeChannel.is_bot_dm && (
              <button
                onClick={handleClearBot}
                title="Limpiar conversación"
                aria-label="Limpiar conversación"
                className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Eraser className="size-4" />
              </button>
            )}

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
              channelId={activeChannel.id}
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
              {loading ? 'Cargando…' : `Sé el primero en escribir en ${activeChannel.name}.`}
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

        {botTyping && <BotTypingIndicator />}

        {/* Reply banner */}
        {replyTarget && (
          <ReplyPreview
            message={replyTarget}
            author={users.get(replyTarget.user_id)}
            onCancel={() => setReplyTarget(null)}
          />
        )}

        {canPost ? (
          <MessageEditor onSend={handleSend} disabled={sending} mentionUsers={mentionUsers} />
        ) : (
          <div className="flex shrink-0 items-center gap-2 border-t border-border bg-muted/30 px-3 py-3 text-[11px] text-muted-foreground">
            <Lock className="size-3.5 shrink-0" />
            <span>
              <span className="font-medium text-foreground">Canal privado</span> · no eres miembro.
              Puedes leer pero no escribir; pídele al creador que te agregue.
            </span>
          </div>
        )}
      </div>
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
