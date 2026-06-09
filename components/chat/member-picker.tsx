'use client'

import { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { cn } from '@/lib/utils'
import type { ChatUser } from '@/actions/chat.actions'

function displayName(u: ChatUser): string {
  return u.nickname || `${u.first_name} ${u.last_name}`.trim()
}

type Props = {
  users: ChatUser[]
  /** Currently selected user ids. */
  selected: string[]
  onChange: (ids: string[]) => void
  /** Always-included id (the channel creator) — shown checked + locked. */
  lockedId?: string
}

/** Searchable multi-select of users, used to pick the members of a private channel. */
export function MemberPicker({ users, selected, onChange, lockedId }: Props) {
  const [filter, setFilter] = useState('')
  const selectedSet = useMemo(() => new Set(selected), [selected])

  const visible = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const list = f
      ? users.filter(u =>
          `${u.nickname ?? ''} ${u.first_name} ${u.last_name}`.toLowerCase().includes(f),
        )
      : users
    return list
  }, [users, filter])

  function toggle(id: string) {
    if (id === lockedId) return
    if (selectedSet.has(id)) onChange(selected.filter(x => x !== id))
    else onChange([...selected, id])
  }

  const count = selectedSet.size

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium">Miembros</span>
        <span className="text-[10px] text-muted-foreground">{count} seleccionado{count === 1 ? '' : 's'}</span>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar usuario…"
          className="w-full rounded-md border border-border bg-background py-1.5 pl-7 pr-2 text-xs outline-none focus:border-foreground/40"
        />
      </div>

      <div className="max-h-44 overflow-y-auto rounded-md border border-border">
        <div className="p-1">
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-center text-[11px] text-muted-foreground">Sin resultados</p>
          ) : (
            visible.map(u => {
              const locked = u.id === lockedId
              const checked = selectedSet.has(u.id) || locked
              return (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggle(u.id)}
                  disabled={locked}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs',
                    locked ? 'cursor-default opacity-70' : 'hover:bg-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded border',
                      checked ? 'border-foreground bg-foreground text-background' : 'border-border',
                    )}
                  >
                    {checked && <Check className="size-3" />}
                  </span>
                  <UserAvatar firstName={u.first_name} lastName={u.last_name} avatarUrl={u.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{displayName(u)}</span>
                  {locked && <span className="shrink-0 text-[9px] text-muted-foreground">creador</span>}
                </button>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
