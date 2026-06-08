'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  getGeneralChannel,
  getUnreadCount,
  type ChatChannel,
  type ChatMessage,
} from '@/actions/chat.actions'
import { ChatView } from './chat-view'
import type { Database } from '@/types/database.types'

type Pos = { x: number; y: number }
type Size = { w: number; h: number }

const MIN_W = 320
const MIN_H = 360
const DEFAULT: Size = { w: 380, h: 560 }
const POS_KEY = 'chat-widget-pos'
const SIZE_KEY = 'chat-widget-size'
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

export function ChatWidget({ userId, userRole }: Props) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState<ChatChannel | null>(null)
  const [unread, setUnread] = useState(0)
  const [pos, setPos] = useState<Pos | null>(null)
  const [size, setSize] = useState<Size>(DEFAULT)
  const [maximized, setMaximized] = useState(false)
  const restoreRef = useRef<{ pos: Pos; size: Size } | null>(null)

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

  // Load the general channel once.
  useEffect(() => {
    getGeneralChannel().then(setChannel)
  }, [])

  // Unread counter: initial fetch + realtime increments while closed.
  useEffect(() => {
    if (!channel) return
    getUnreadCount(channel.id).then(setUnread)

    const supabase = createClient()
    const ch = supabase
      .channel(`chat-unread:${channel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `channel_id=eq.${channel.id}` },
        payload => {
          const row = payload.new as ChatMessage
          if (row.user_id === userId || row.is_deleted) return
          if (!openRef.current) setUnread(c => c + 1)
        },
      )
      .subscribe()

    const onFocus = () => { if (!openRef.current) getUnreadCount(channel.id).then(setUnread) }
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

  // Launcher (closed state)
  if (!open) {
    return (
      <button
        onClick={handleOpen}
        aria-label="Abrir chat"
        className="fixed bottom-6 right-6 z-60 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105"
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

  if (!pos || !channel) return null

  return (
    <div
      className="fixed z-60 flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <ChatView
        channel={channel}
        currentUserId={userId}
        userRole={userRole}
        maximized={maximized}
        onToggleMaximize={toggleMaximize}
        onClose={() => setOpen(false)}
        onPointerDownDrag={onDragStart}
      />

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
