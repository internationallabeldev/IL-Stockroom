'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Check,
  CheckCheck,
  ClipboardList,
  FlaskConical,
  ShieldCheck,
  PackageX,
  CalendarClock,
  CircleCheck,
  CircleX,
  PackageCheck,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { createClient } from '@/lib/supabase/client'
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  type Notification,
  type NotificationType,
} from '@/actions/notifications.actions'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

// Icon + accent colour per notification type, so the panel is scannable.
const TYPE_META: Record<NotificationType, { icon: LucideIcon; tone: string }> = {
  pending_requisitions:   { icon: ClipboardList, tone: 'text-amber-500 bg-amber-500/10' },
  quality_pending:        { icon: FlaskConical,  tone: 'text-sky-500 bg-sky-500/10' },
  quality_result:         { icon: ShieldCheck,   tone: 'text-sky-500 bg-sky-500/10' },
  low_stock:              { icon: PackageX,       tone: 'text-red-500 bg-red-500/10' },
  order_overdue:          { icon: CalendarClock,  tone: 'text-red-500 bg-red-500/10' },
  requisition_approved:   { icon: CircleCheck,    tone: 'text-emerald-500 bg-emerald-500/10' },
  requisition_rejected:   { icon: CircleX,        tone: 'text-red-500 bg-red-500/10' },
  requisition_fulfilled:  { icon: PackageCheck,   tone: 'text-emerald-500 bg-emerald-500/10' },
  chat_mention:           { icon: MessageCircle,  tone: 'text-violet-500 bg-violet-500/10' },
}

const FALLBACK_META = { icon: Bell, tone: 'text-foreground/60 bg-muted' }

export function NotificationBell({ userId }: { userId: string }) {
  const router = useRouter()
  const [unread, setUnread] = useState(0)
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const refreshCount = useCallback(async () => {
    try {
      setUnread(await getUnreadCount())
    } catch {
      /* ignore transient errors */
    }
  }, [])

  // Live updates via Supabase Realtime (INSERT on this user's notifications).
  // Replaces interval polling — a fetch on window focus covers any missed events.
  useEffect(() => {
    refreshCount()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        payload => {
          const row = payload.new as Notification
          setUnread(c => c + 1)
          // Prepend to the open list so it shows without reopening
          setItems(prev => (prev.some(i => i.id === row.id) ? prev : [row, ...prev]))
        },
      )
      .subscribe()

    const onFocus = () => refreshCount()
    window.addEventListener('focus', onFocus)

    return () => {
      supabase.removeChannel(channel)
      window.removeEventListener('focus', onFocus)
    }
  }, [userId, refreshCount])

  // Load list when the popover opens
  useEffect(() => {
    if (!open) return
    setLoading(true)
    getNotifications()
      .then(setItems)
      .finally(() => setLoading(false))
  }, [open])

  // Mark a single notification as read, without navigating.
  const markOneRead = useCallback((id: number) => {
    setItems(prev =>
      prev.map(i => (i.id === id && !i.read_at ? { ...i, read_at: new Date().toISOString() } : i)),
    )
    setUnread(c => Math.max(0, c - 1))
    startTransition(() => { markAsRead(id) })
  }, [])

  function handleClick(n: Notification) {
    if (!n.read_at) markOneRead(n.id)
    if (n.link) {
      setOpen(false)
      router.push(n.link)
    }
  }

  function handleMarkAll() {
    setItems(prev => prev.map(i => ({ ...i, read_at: i.read_at ?? new Date().toISOString() })))
    setUnread(0)
    startTransition(() => { markAllAsRead() })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex size-8 items-center justify-center hover:bg-muted transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="size-4 text-foreground/60" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex min-w-4 h-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[26rem] max-w-[calc(100vw-1.5rem)] p-0 gap-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-widest">Notificaciones</span>
            {unread > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500/15 px-1 text-[9px] font-bold text-red-500">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="size-3" />
              Marcar todo
            </button>
          )}
        </div>

        <div className="max-h-[28rem] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-10 text-center text-[11px] text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
              <Bell className="size-6 text-muted-foreground/40" />
              <p className="text-[11px] text-muted-foreground">No tienes notificaciones</p>
            </div>
          ) : (
            items.map(n => {
              const meta = TYPE_META[n.type] ?? FALLBACK_META
              const Icon = meta.icon
              const isUnread = !n.read_at
              return (
                <div
                  key={n.id}
                  className={`group relative flex gap-3 border-b border-border/60 px-4 py-3 transition-colors hover:bg-muted/60 ${
                    isUnread ? 'bg-muted/20' : ''
                  }`}
                >
                  {/* Unread accent bar */}
                  {isUnread && <span className="absolute inset-y-0 left-0 w-0.5 bg-red-500" />}

                  <span className={`flex size-7 shrink-0 items-center justify-center rounded-md ${meta.tone}`}>
                    <Icon className="size-3.5" />
                  </span>

                  <button
                    onClick={() => handleClick(n)}
                    className="flex min-w-0 flex-1 flex-col gap-0.5 text-left"
                  >
                    <span className={`text-[12px] leading-snug ${isUnread ? 'font-semibold' : 'font-medium text-foreground/80'}`}>
                      {n.title}
                    </span>
                    {n.body && (
                      <span className="text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                        {n.body}
                      </span>
                    )}
                  </button>

                  {/* Right rail: timestamp on top, per-item mark-as-read below */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[9px] uppercase tracking-wide text-muted-foreground">
                      {timeAgo(n.created_at)}
                    </span>
                    {isUnread && (
                      <button
                        onClick={() => markOneRead(n.id)}
                        title="Marcar como leído"
                        aria-label="Marcar como leído"
                        className="flex size-5 items-center justify-center rounded-md border border-border bg-background/60 text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                      >
                        <Check className="size-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
