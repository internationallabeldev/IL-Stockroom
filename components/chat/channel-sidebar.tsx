'use client'

import { useState } from 'react'
import { Hash, Lock, Plus, Archive, ChevronDown, ChevronRight } from 'lucide-react'
import { ChannelForm } from './channel-form'
import { cn } from '@/lib/utils'
import type { ChannelWithMeta, ChatChannel, ChatUser } from '@/actions/chat.actions'

type Props = {
  channels: ChannelWithMeta[]
  activeId: number
  isAdmin: boolean
  onSelect: (channel: ChannelWithMeta) => void
  onCreated: (channel: ChatChannel) => void
  /** Directory + creator id, threaded to the create-channel form's member picker. */
  users: ChatUser[]
  currentUserId: string
}

/** Left column of the chat: channel list, "+" to create (ADMIN), and a collapsed
 *  archived section at the bottom (ADMIN only). */
export function ChannelSidebar({ channels, activeId, isAdmin, onSelect, onCreated, users, currentUserId }: Props) {
  const [showArchived, setShowArchived] = useState(false)
  const active = channels.filter(c => !c.is_archived)
  const archived = channels.filter(c => c.is_archived)

  return (
    <div className="flex h-full w-36 shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="flex shrink-0 items-center justify-between px-2 py-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Canales
        </span>
        {isAdmin && (
          <ChannelForm onCreated={onCreated} users={users} currentUserId={currentUserId}>
            <button
              title="Crear canal"
              aria-label="Crear canal"
              className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="size-3.5" />
            </button>
          </ChannelForm>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {active.map(ch => (
          <ChannelRow key={ch.id} channel={ch} active={ch.id === activeId} onSelect={onSelect} />
        ))}

        {isAdmin && archived.length > 0 && (
          <div className="mt-2 border-t border-border/60 pt-2">
            <button
              onClick={() => setShowArchived(s => !s)}
              className="flex w-full items-center gap-1 px-1.5 py-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
            >
              {showArchived ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
              Archivados
            </button>
            {showArchived &&
              archived.map(ch => (
                <ChannelRow key={ch.id} channel={ch} active={ch.id === activeId} onSelect={onSelect} archived />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChannelRow({
  channel,
  active,
  onSelect,
  archived,
}: {
  channel: ChannelWithMeta
  active: boolean
  onSelect: (channel: ChannelWithMeta) => void
  archived?: boolean
}) {
  const unread = channel.unread_count
  return (
    <button
      onClick={() => onSelect(channel)}
      title={channel.name}
      className={cn(
        'flex w-full items-center gap-1 rounded px-1.5 py-1.5 text-left text-xs',
        active ? 'bg-foreground/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-muted',
      )}
    >
      {archived ? (
        <Archive className="size-3 shrink-0" />
      ) : channel.is_private ? (
        <Lock className="size-3 shrink-0" />
      ) : (
        <Hash className="size-3 shrink-0" />
      )}
      <span className="min-w-0 flex-1 truncate">{channel.name}</span>
      {unread > 0 && !active && (
        <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </button>
  )
}
