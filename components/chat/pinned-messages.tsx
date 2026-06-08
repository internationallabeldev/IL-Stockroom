'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Pin, PinOff, CornerDownRight } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getPinnedMessages, type ChatMessage, type ChatUser } from '@/actions/chat.actions'

type Props = {
  channelId: number
  isAdmin: boolean
  users: Map<string, ChatUser>
  onJump: (messageId: number) => void
  onUnpin: (messageId: number) => void
  children: React.ReactNode
}

/** Popover panel listing pinned messages, anchored to the header pin button. */
export function PinnedMessages({ channelId, isAdmin, users, onJump, onUnpin, children }: Props) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    getPinnedMessages(channelId)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [open, channelId])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" collisionPadding={8} style={{ zIndex: 70 }} className="w-80 gap-0 p-0">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <Pin className="size-3.5 text-foreground/60" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Mensajes fijados</span>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-6 text-center text-[11px] text-muted-foreground">
              No hay mensajes fijados.
            </p>
          ) : (
            items.map(m => {
              const author = users.get(m.user_id)
              const name = author ? author.nickname || author.first_name : 'Usuario'
              const time = m.created_at ? format(new Date(m.created_at), 'dd/MM HH:mm') : ''
              return (
                <div key={m.id} className="group flex gap-2 border-b border-border/60 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[11px] font-semibold">{name}</span>
                      <span className="text-[9px] text-muted-foreground">{time}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">
                      {m.content_text}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-1">
                    <button
                      onClick={() => { onJump(m.id); setOpen(false) }}
                      title="Ir al mensaje"
                      aria-label="Ir al mensaje"
                      className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <CornerDownRight className="size-3.5" />
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => { onUnpin(m.id); setItems(prev => prev.filter(x => x.id !== m.id)) }}
                        title="Desfijar"
                        aria-label="Desfijar"
                        className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <PinOff className="size-3.5" />
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
