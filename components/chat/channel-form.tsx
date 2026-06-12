'use client'

import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Globe, Lock } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RetentionSelect } from './retention-select'
import { MemberPicker } from './member-picker'
import { createChannel, type ChatChannel, type ChatUser } from '@/actions/chat.actions'
import { cn } from '@/lib/utils'

type Props = {
  /** Called with the freshly created channel so the view can navigate to it. */
  onCreated: (channel: ChatChannel) => void
  /** Directory used to pick members for a private channel. */
  users: ChatUser[]
  /** The creator — auto-added and locked in the member list. */
  currentUserId: string
  /** The trigger element (the "+" button). */
  children: ReactNode
}

/** ADMIN-only popover to create a new channel. Anchored inside the widget (zIndex
 *  70) to match the priority/pins popovers. */
export function ChannelForm({ onCreated, users, currentUserId, children }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [retention, setRetention] = useState<number | null>(90)
  const [isPrivate, setIsPrivate] = useState(false)
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function reset() {
    setName('')
    setDescription('')
    setRetention(90)
    setIsPrivate(false)
    setMemberIds([])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || saving) return
    setSaving(true)
    const res = await createChannel({
      name,
      description,
      retention_days: retention,
      is_private: isPrivate,
      member_ids: isPrivate ? memberIds : [],
    })
    setSaving(false)
    if (res.error || !res.channel) {
      toast.error(res.error ?? 'No se pudo crear el canal')
      return
    }
    onCreated(res.channel)
    reset()
    setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={o => {
        setOpen(o)
        if (!o) reset()
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={8}
        style={{ zIndex: 70 }}
        className="flex max-h-(--radix-popper-available-height) w-72 flex-col gap-0 overflow-hidden p-0"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-widest">
            Nuevo canal
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium">Nombre</label>
              <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Almacén"
                maxLength={40}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground/40"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium">
                Descripción <span className="text-muted-foreground">(opcional)</span>
              </label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="¿De qué trata el canal?"
                maxLength={120}
                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium">Retención de mensajes</label>
              <RetentionSelect value={retention} onChange={setRetention} />
            </div>

            {/* Visibility */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium">Visibilidad</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                    !isPrivate ? 'border-foreground/40 bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Globe className="size-3.5 shrink-0" /> Público
                </button>
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                    isPrivate ? 'border-foreground/40 bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Lock className="size-3.5 shrink-0" /> Privado
                </button>
              </div>
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                {isPrivate
                  ? 'Solo los miembros elegidos (y los administradores) podrán ver y escribir.'
                  : 'Cualquier usuario podrá ver y escribir en el canal.'}
              </p>
            </div>

            {isPrivate && (
              <MemberPicker
                users={users}
                selected={memberIds}
                onChange={setMemberIds}
                lockedId={currentUserId}
              />
            )}

            <button
              type="submit"
              disabled={!name.trim() || saving}
              className={cn(
                'w-full rounded-md py-1.5 text-xs font-medium transition-colors',
                name.trim() && !saving
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground',
              )}
            >
              {saving ? 'Creando…' : 'Crear canal'}
            </button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
