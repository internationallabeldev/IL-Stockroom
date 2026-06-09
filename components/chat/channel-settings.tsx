'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { AlertTriangle, Archive, ArchiveRestore, Globe, Lock, Trash2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RetentionSelect } from './retention-select'
import { MemberPicker } from './member-picker'
import {
  updateChannel,
  setChannelArchived,
  deleteChannel,
  getChannelMembers,
  setChannelMembers,
  type ChannelWithMeta,
  type ChatChannel,
  type ChatUser,
} from '@/actions/chat.actions'
import { cn } from '@/lib/utils'

type Props = {
  channel: ChannelWithMeta
  onUpdated: (channel: ChatChannel) => void
  /** After a channel is archived or restored — the view should refresh + leave it. */
  onArchivedChange: () => void
  /** After a channel is permanently deleted — the view should leave it. */
  onDeleted: () => void
  /** Directory + current user, for the private-channel member picker. */
  users: ChatUser[]
  currentUserId: string
  children: ReactNode
}

/** Order-independent equality for two id lists. */
function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const s = new Set(a)
  return b.every(x => s.has(x))
}

/** Settings for the active channel (ADMIN creator only; general channel = retention only).
 *  A popover anchored inside the widget rather than a Sheet, to avoid the floating
 *  widget's z-index trapping the panel. Mount with key={channel.id} so its draft
 *  state resets per channel. */
export function ChannelSettings({ channel, onUpdated, onArchivedChange, onDeleted, users, currentUserId, children }: Props) {
  const isDefault = !!channel.is_default
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(channel.name)
  const [description, setDescription] = useState(channel.description ?? '')
  const [retention, setRetention] = useState<number | null>(channel.retention_days ?? null)
  const [isPrivate, setIsPrivate] = useState(!!channel.is_private)
  const [members, setMembers] = useState<string[]>([])
  const [initialMembers, setInitialMembers] = useState<string[]>([])
  const [confirmName, setConfirmName] = useState('')
  const [busy, setBusy] = useState(false)

  // The creator (== the editing admin for non-default channels) is always a member.
  const creatorId = channel.created_by ?? currentUserId

  // Load existing membership once the settings panel opens for a non-default channel.
  useEffect(() => {
    if (!open || isDefault) return
    let cancelled = false
    getChannelMembers(channel.id).then(ids => {
      if (cancelled) return
      setMembers(ids)
      setInitialMembers(ids)
    })
    return () => { cancelled = true }
  }, [open, isDefault, channel.id])

  // A retention change shrinks the window when the new value is finite and either
  // the current value is unlimited or strictly larger.
  const reducesRetention =
    retention != null && (channel.retention_days == null || retention < channel.retention_days)

  const privacyDirty = !isDefault && isPrivate !== !!channel.is_private
  const membersDirty = !isDefault && isPrivate && !sameSet(members, initialMembers)
  const dirty =
    name.trim() !== channel.name ||
    (description.trim() || '') !== (channel.description ?? '') ||
    retention !== (channel.retention_days ?? null) ||
    privacyDirty ||
    membersDirty

  async function handleSave() {
    if (busy) return
    setBusy(true)
    const res = await updateChannel(channel.id, {
      name,
      description,
      retention_days: retention,
      is_private: isDefault ? undefined : isPrivate,
    })
    if (res.error || !res.channel) {
      setBusy(false)
      toast.error(res.error ?? 'No se pudo guardar')
      return
    }
    // Persist membership for private channels (creator is kept server-side).
    if (!isDefault && isPrivate) {
      const mres = await setChannelMembers(channel.id, members)
      if (mres.error) {
        setBusy(false)
        toast.error(mres.error)
        return
      }
      setInitialMembers(members)
    }
    setBusy(false)
    toast.success('Canal actualizado')
    onUpdated(res.channel)
  }

  async function handleArchiveToggle() {
    if (busy) return
    setBusy(true)
    const res = await setChannelArchived(channel.id, !channel.is_archived)
    setBusy(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success(channel.is_archived ? 'Canal restaurado' : 'Canal archivado')
    setOpen(false)
    onArchivedChange()
  }

  async function handleDelete() {
    if (busy || confirmName !== channel.name) return
    setBusy(true)
    const res = await deleteChannel(channel.id)
    setBusy(false)
    if (res.error) {
      toast.error(res.error)
      return
    }
    toast.success('Canal eliminado')
    setOpen(false)
    onDeleted()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={8}
        style={{ zIndex: 70 }}
        className="flex max-h-(--radix-popper-available-height) w-80 flex-col gap-0 overflow-hidden p-0"
      >
        <div className="shrink-0 border-b border-border px-3 py-2 text-[11px] font-bold uppercase tracking-widest">
          Configuración del canal
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="space-y-4 p-3">
            {/* Name + description (not for the general channel) */}
            {!isDefault && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium">Nombre</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
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
                    maxLength={120}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-foreground/40"
                  />
                </div>
              </div>
            )}

            {/* Retention */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium">Retención de mensajes</label>
              <RetentionSelect value={retention} onChange={setRetention} disabled={busy} />
              {reducesRetention && (
                <p className="flex items-start gap-1.5 rounded-md bg-amber-500/10 px-2 py-1.5 text-[10px] leading-relaxed text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                  Reducir la retención eliminará mensajes antiguos en la próxima limpieza
                  automática (mañana a las 3am).
                </p>
              )}
            </div>

            {/* Visibility + members (not for the general channel) */}
            {!isDefault && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium">Visibilidad</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsPrivate(false)}
                    disabled={busy}
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
                    disabled={busy}
                    className={cn(
                      'flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-[11px] transition-colors',
                      isPrivate ? 'border-foreground/40 bg-muted font-medium' : 'border-border text-muted-foreground hover:bg-muted',
                    )}
                  >
                    <Lock className="size-3.5 shrink-0" /> Privado
                  </button>
                </div>

                {isPrivate && (
                  <MemberPicker
                    users={users}
                    selected={members}
                    onChange={setMembers}
                    lockedId={creatorId}
                  />
                )}
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!dirty || !name.trim() || busy}
              className={cn(
                'w-full rounded-md py-1.5 text-xs font-medium transition-colors',
                dirty && name.trim() && !busy
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'cursor-not-allowed bg-muted text-muted-foreground',
              )}
            >
              Guardar cambios
            </button>

            {/* Danger zone (not for the general channel) */}
            {!isDefault && (
              <div className="space-y-2 rounded-md border border-red-500/30 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-red-500">
                  Zona de peligro
                </p>

                <button
                  onClick={handleArchiveToggle}
                  disabled={busy}
                  className="flex w-full items-center gap-2 rounded-md border border-border px-2 py-1.5 text-left text-[11px] hover:bg-muted disabled:opacity-50"
                >
                  {channel.is_archived ? (
                    <>
                      <ArchiveRestore className="size-3.5 shrink-0" />
                      <span>
                        <span className="font-medium">Restaurar canal</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Vuelve a ser visible para todos.
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Archive className="size-3.5 shrink-0" />
                      <span>
                        <span className="font-medium">Archivar canal</span>
                        <span className="block text-[10px] text-muted-foreground">
                          Reversible. Se oculta para los no-ADMIN.
                        </span>
                      </span>
                    </>
                  )}
                </button>

                <div className="space-y-1.5">
                  <label className="block text-[10px] text-muted-foreground">
                    Para eliminar de forma permanente, escribe{' '}
                    <span className="font-semibold text-foreground">{channel.name}</span>:
                  </label>
                  <input
                    value={confirmName}
                    onChange={e => setConfirmName(e.target.value)}
                    placeholder={channel.name}
                    className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-red-500/60"
                  />
                  <button
                    onClick={handleDelete}
                    disabled={busy || confirmName !== channel.name}
                    className={cn(
                      'flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[11px] font-medium transition-colors',
                      confirmName === channel.name && !busy
                        ? 'bg-red-500 text-white hover:bg-red-600'
                        : 'cursor-not-allowed bg-muted text-muted-foreground',
                    )}
                  >
                    <Trash2 className="size-3.5" /> Eliminar canal
                  </button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
