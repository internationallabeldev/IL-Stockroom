'use client'

import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getGeneralChannel,
  getTotalUnreadCount,
  type ChatChannel,
  type ChatMessage,
} from '@/actions/chat.actions'
import { ChatView } from './chat-view'
import { OPEN_CHAT_EVENT, type OpenChatDetail } from '@/lib/chat/open-chat'
import type { Database } from '@/types/database.types'

type Pos = { x: number; y: number }
type Size = { w: number; h: number }

const MIN_W = 320
const MIN_H = 360
const DEFAULT: Size = { w: 440, h: 560 }
const POS_KEY = 'chat-widget-pos'
const SIZE_KEY = 'chat-widget-size'
const LAUNCHER_KEY = 'chat-launcher-pos'
const LAUNCHER_SIZE = 48 // size-12
const DRAG_THRESHOLD = 4 // px before a press counts as a drag (vs. a click)
const MARGIN = 24

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

function readStored<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

type Props = {
  userId: string
  userRole: Database['public']['Enums']['user_role']
}

/** Keeps a crash inside the chat from unmounting the whole widget (which would
 *  make the floating button silently vanish). Surfaces the error instead. */
class ChatErrorBoundary extends Component<
  { onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-[11px] font-semibold text-red-500">Error en el chat</p>
          <p className="text-[10px] text-muted-foreground break-words">{this.state.error.message}</p>
          <button
            onClick={this.props.onClose}
            className="rounded border border-border px-3 py-1 text-[11px] hover:bg-muted"
          >
            Cerrar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function ChatWidget({ userId, userRole }: Props) {
  const [open, setOpen] = useState(false)
  const [requestedChannelId, setRequestedChannelId] = useState<number | null>(null)
  const [channel, setChannel] = useState<ChatChannel | null>(null)
  const [channelStatus, setChannelStatus] = useState<'loading' | 'error'>('loading')
  const [unread, setUnread] = useState(0)
  const [pos, setPos] = useState<Pos | null>(null)
  const [size, setSize] = useState<Size>(DEFAULT)
  const [maximized, setMaximized] = useState(false)
  const [launcherPos, setLauncherPos] = useState<Pos | null>(null)
  const restoreRef = useRef<{ pos: Pos; size: Size } | null>(null)
  // Tracks whether the last launcher press turned into a drag, so the click
  // that follows pointerup doesn't also open the chat.
  const launcherDraggedRef = useRef(false)

  const openRef = useRef(open)
  openRef.current = open

  // Initial geometry (client-only to avoid SSR mismatch).
  useEffect(() => {
    const storedSize = readStored<Size>(SIZE_KEY)
    const s = storedSize ?? DEFAULT
    setSize(s)
    const storedPos = readStored<Pos>(POS_KEY)
    if (storedPos) {
      setPos({
        x: clamp(storedPos.x, 0, window.innerWidth - s.w),
        y: clamp(storedPos.y, 0, window.innerHeight - s.h),
      })
    } else {
      setPos({ x: window.innerWidth - s.w - MARGIN, y: window.innerHeight - s.h - MARGIN })
    }
  }, [])

  // Launcher (closed-state bubble) position: restored from storage or anchored
  // bottom-right. Kept inside the viewport on load and on window resize.
  useEffect(() => {
    const maxX = () => Math.max(MARGIN, window.innerWidth - LAUNCHER_SIZE - MARGIN)
    const maxY = () => Math.max(MARGIN, window.innerHeight - LAUNCHER_SIZE - MARGIN)
    const stored = readStored<Pos>(LAUNCHER_KEY)
    setLauncherPos(
      stored
        ? { x: clamp(stored.x, MARGIN, maxX()), y: clamp(stored.y, MARGIN, maxY()) }
        : { x: maxX(), y: maxY() },
    )
    const onResize = () =>
      setLauncherPos(p => (p ? { x: clamp(p.x, MARGIN, maxX()), y: clamp(p.y, MARGIN, maxY()) } : p))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Load the general channel.
  const loadChannel = useCallback(() => {
    setChannelStatus('loading')
    getGeneralChannel()
      .then(c => {
        if (c) setChannel(c)
        else setChannelStatus('error')
      })
      .catch(() => setChannelStatus('error'))
  }, [])
  useEffect(() => { loadChannel() }, [loadChannel])

  // Unread counter (summed across all visible channels): initial fetch + realtime
  // increments while closed.
  useEffect(() => {
    if (!channel) return
    getTotalUnreadCount().then(setUnread)

    const supabase = createClient()
    const ch = supabase
      .channel('chat-unread-total')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        payload => {
          const row = payload.new as ChatMessage
          if (row.user_id === userId || row.is_deleted) return
          if (!openRef.current) setUnread(c => c + 1)
        },
      )
      .subscribe()

    const onFocus = () => { if (!openRef.current) getTotalUnreadCount().then(setUnread) }
    window.addEventListener('focus', onFocus)
    return () => {
      supabase.removeChannel(ch)
      window.removeEventListener('focus', onFocus)
    }
  }, [channel, userId])

  // Persist geometry (skip while maximized, so the stored size stays the "normal" one).
  useEffect(() => { if (pos && !maximized) localStorage.setItem(POS_KEY, JSON.stringify(pos)) }, [pos, maximized])
  useEffect(() => { if (!maximized) localStorage.setItem(SIZE_KEY, JSON.stringify(size)) }, [size, maximized])

  function handleOpen() {
    setOpen(true)
    setUnread(0)
  }

  // Open on demand from elsewhere (e.g. a chat-mention notification toast),
  // optionally jumping to the mentioned channel.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<OpenChatDetail>).detail
      setOpen(true)
      setUnread(0)
      if (detail?.channelId != null) setRequestedChannelId(detail.channelId)
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen)
  }, [])

  // Toggle between the floating size and a large centered window.
  const toggleMaximize = useCallback(() => {
    if (!pos) return
    if (maximized) {
      if (restoreRef.current) {
        setPos(restoreRef.current.pos)
        setSize(restoreRef.current.size)
      }
      setMaximized(false)
    } else {
      restoreRef.current = { pos, size }
      const w = Math.min(960, window.innerWidth - MARGIN * 2)
      const h = Math.min(820, window.innerHeight - MARGIN * 2)
      setSize({ w, h })
      setPos({ x: (window.innerWidth - w) / 2, y: Math.max(MARGIN, (window.innerHeight - h) / 2) })
      setMaximized(true)
    }
  }, [maximized, pos, size])

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragStart = useCallback((e: React.PointerEvent) => {
    if (!pos) return
    const start = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }
    const move = (ev: PointerEvent) => {
      setPos({
        x: clamp(start.px + ev.clientX - start.mx, 0, window.innerWidth - size.w),
        y: clamp(start.py + ev.clientY - start.my, 0, window.innerHeight - size.h),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [pos, size])

  // ── Resize (bottom-right corner) ────────────────────────────────────────────
  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    if (!pos) return
    setMaximized(false) // manual resize takes over from the maximized preset
    const start = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h }
    const move = (ev: PointerEvent) => {
      setSize({
        w: clamp(start.w + ev.clientX - start.mx, MIN_W, window.innerWidth - pos.x),
        h: clamp(start.h + ev.clientY - start.my, MIN_H, window.innerHeight - pos.y),
      })
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [pos, size])

  // ── Launcher drag (free reposition, persisted) ──────────────────────────────
  const onLauncherDragStart = useCallback((e: React.PointerEvent) => {
    const startPos = launcherPos ?? {
      x: window.innerWidth - LAUNCHER_SIZE - MARGIN,
      y: window.innerHeight - LAUNCHER_SIZE - MARGIN,
    }
    const start = { mx: e.clientX, my: e.clientY, px: startPos.x, py: startPos.y }
    launcherDraggedRef.current = false
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.mx
      const dy = ev.clientY - start.my
      if (!launcherDraggedRef.current && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
        launcherDraggedRef.current = true
      }
      if (!launcherDraggedRef.current) return
      const next = {
        x: clamp(start.px + dx, MARGIN, window.innerWidth - LAUNCHER_SIZE - MARGIN),
        y: clamp(start.py + dy, MARGIN, window.innerHeight - LAUNCHER_SIZE - MARGIN),
      }
      setLauncherPos(next)
      localStorage.setItem(LAUNCHER_KEY, JSON.stringify(next))
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [launcherPos])

  // Launcher (closed state)
  if (!open) {
    return (
      <button
        onPointerDown={onLauncherDragStart}
        onClick={() => {
          // A drag just ended — swallow the synthetic click instead of opening.
          if (launcherDraggedRef.current) {
            launcherDraggedRef.current = false
            return
          }
          handleOpen()
        }}
        aria-label="Abrir chat"
        style={launcherPos ? { left: launcherPos.x, top: launcherPos.y } : { right: MARGIN, bottom: MARGIN }}
        className="fixed z-60 flex size-12 touch-none select-none items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:cursor-grabbing"
      >
        <MessageCircle className="size-5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    )
  }

  if (!pos) return null

  return (
    <div
      className="fixed z-60 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      {channel ? (
        <ChatErrorBoundary onClose={() => setOpen(false)}>
          <ChatView
            initialChannel={channel}
            currentUserId={userId}
            userRole={userRole}
            width={size.w}
            maximized={maximized}
            requestedChannelId={requestedChannelId}
            onChannelOpened={() => setRequestedChannelId(null)}
            onToggleMaximize={toggleMaximize}
            onClose={() => setOpen(false)}
            onPointerDownDrag={onDragStart}
          />
        </ChatErrorBoundary>
      ) : (
        <div className="flex h-full flex-col">
          <div
            onPointerDown={onDragStart}
            className="flex shrink-0 cursor-move touch-none select-none items-center justify-between border-b border-border bg-background px-3 py-2"
          >
            <span className="text-[11px] font-bold uppercase tracking-widest">Chat</span>
            <button
              onClick={() => setOpen(false)}
              onPointerDown={e => e.stopPropagation()}
              aria-label="Cerrar chat"
              className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            {channelStatus === 'loading' ? (
              <p className="text-[11px] text-muted-foreground">Cargando chat…</p>
            ) : (
              <>
                <p className="text-[11px] text-muted-foreground">
                  No se pudo cargar el canal general del chat.
                </p>
                <button
                  onClick={loadChannel}
                  className="rounded border border-border px-3 py-1 text-[11px] hover:bg-muted"
                >
                  Reintentar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Resize handle */}
      <div
        onPointerDown={onResizeStart}
        title="Arrastra para redimensionar"
        className="absolute bottom-0 right-0 z-10 flex size-5 cursor-nwse-resize items-end justify-end p-0.5 touch-none"
        aria-hidden
      >
        <div className="size-0 border-b-8 border-r-8 border-b-foreground/40 border-r-foreground/40" />
      </div>
    </div>
  )
}
