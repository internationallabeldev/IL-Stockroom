'use client'

import { X, Reply } from 'lucide-react'
import type { ChatMessage, ChatUser } from '@/actions/chat.actions'

type Props = {
  message: ChatMessage
  author?: ChatUser
  onCancel: () => void
}

/** Banner shown above the composer while replying to a message. */
export function ReplyPreview({ message, author, onCancel }: Props) {
  const name = author ? author.nickname || author.first_name : 'Usuario'
  const preview = message.is_deleted
    ? 'Mensaje eliminado'
    : (message.content_text ?? '').slice(0, 120)

  return (
    <div className="flex items-center gap-2 border-t border-border bg-muted/40 px-3 py-1.5">
      <Reply className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1 text-[11px]">
        <span className="font-semibold text-foreground">Respondiendo a {name}</span>
        <span className="ml-1 text-muted-foreground line-clamp-1">{preview}</span>
      </div>
      <button
        onClick={onCancel}
        aria-label="Cancelar respuesta"
        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}
