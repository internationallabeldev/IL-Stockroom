'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { updateLotLocation } from '@/actions/ink-inventory.actions'
import { toast } from 'sonner'

type Props = {
  inventoryId: number
  value:       string | null
  canEdit:     boolean
}

export function LotLocationEdit({ inventoryId, value, canEdit }: Props) {
  const [editing, setEditing] = useState(false)
  const [text,    setText]    = useState(value ?? '')
  const [saving,  setSaving]  = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])
  useEffect(() => { setText(value ?? '') }, [value])

  async function save() {
    if (text === (value ?? '')) { setEditing(false); return }
    setSaving(true)
    const res = await updateLotLocation(inventoryId, text)
    setSaving(false)
    if (res.error) { toast.error(res.error); return }
    setEditing(false)
  }

  if (!canEdit) {
    return (
      <span className="font-mono text-[11px] text-muted-foreground">
        {value ?? <span className="opacity-40">—</span>}
      </span>
    )
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onBlur={save}
          onKeyDown={e => {
            if (e.key === 'Enter')  save()
            if (e.key === 'Escape') { setText(value ?? ''); setEditing(false) }
          }}
          disabled={saving}
          placeholder="Ubicación"
          className="w-28 h-6 border border-border bg-card px-1.5 font-mono text-[11px] outline-none focus:border-foreground transition-colors disabled:opacity-50"
        />
        {saving && <Loader2 className="size-3 animate-spin text-muted-foreground shrink-0" />}
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground hover:text-foreground transition-colors group"
    >
      <MapPin className="size-3 opacity-40 group-hover:opacity-80 shrink-0" />
      {value
        ? value
        : <span className="italic opacity-40">Sin ubicación</span>
      }
    </button>
  )
}
