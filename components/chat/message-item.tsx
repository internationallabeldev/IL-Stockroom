'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { generateJSON, generateHTML } from '@tiptap/react'
import { format } from 'date-fns'
import { Smile, Reply, Pencil, Trash2, Pin, PinOff, CornerUpRight, Bot } from 'lucide-react'
import { UserAvatar } from '@/components/shared/user-avatar'
import { cn } from '@/lib/utils'
import { renderExtensions } from '@/lib/chat/extensions'
import { PRIORITY_META, type ChatPriority } from '@/lib/chat/constants'
import { EmojiPicker } from './emoji-picker'
import type { ChatMessage, ChatReaction, ChatUser } from '@/actions/chat.actions'
import type { Database } from '@/types/database.types'

type Role = Database['public']['Enums']['user_role']

const BOT_USER_ID = process.env.NEXT_PUBLIC_BOT_USER_ID

const ROLE_LABEL: Record<Role, string> = {
  ADMIN:             'Admin',
  PURCHASER:         'Compras',
  WAREHOUSE_MANAGER: 'Almacén',
  PRODUCER:          'Producción',
  USER:              'Usuario',
}

// Re-serialize stored HTML through the editor schema, dropping anything the schema
// doesn't allow. Cheap XSS guard without an extra sanitizer dependency.
function sanitize(html: string): string {
  try {
    return generateHTML(generateJSON(html, renderExtensions), renderExtensions)
  } catch {
    return ''
  }
}

function groupReactions(rows: ChatReaction[], myId: string) {
  const map = new Map<string, { emoji: string; count: number; mine: boolean }>()
  for (const r of rows) {
    const g = map.get(r.emoji) ?? { emoji: r.emoji, count: 0, mine: false }
    g.count++
    if (r.user_id === myId) g.mine = true
    map.set(r.emoji, g)
  }
  return [...map.values()]
}

type Props = {
  message: ChatMessage
  author?: ChatUser
  showHeader: boolean
  isOwn: boolean
  isAdmin: boolean
  currentUserId: string
  reactions: ChatReaction[]
  replyTo?: ChatMessage
  replyToAuthor?: ChatUser
  onReact: (messageId: number, emoji: string) => void
  onReply: (message: ChatMessage) => void
  onEdit: (message: ChatMessage) => void
  onDelete: (messageId: number) => void
  onTogglePin: (message: ChatMessage) => void
}

export function MessageItem({
  message, author, showHeader, isOwn, isAdmin, currentUserId,
  reactions, replyTo, replyToAuthor,
  onReact, onReply, onEdit, onDelete, onTogglePin,
}: Props) {
  const router = useRouter()
  const safeHtml = useMemo(
    () => (message.is_deleted ? '' : sanitize(message.content)),
    [message.content, message.is_deleted],
  )
  const name = author ? author.nickname || author.first_name : 'Usuario'
  const isBot = !!BOT_USER_ID && message.user_id === BOT_USER_ID
  const time = message.created_at ? format(new Date(message.created_at), 'HH:mm') : ''
  const grouped = groupReactions(reactions, currentUserId)
  const prio = message.priority ? PRIORITY_META[message.priority as ChatPriority] : null

  // Clicking a /reference chip navigates to its page and seeds the search box.
  function handleContentClick(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest('[data-type="reference"]') as HTMLElement | null
    if (!el) return
    const url = el.getAttribute('data-url')
    if (!url) return
    e.preventDefault()
    const q = el.getAttribute('data-q')
    router.push(q ? `${url}?q=${encodeURIComponent(q)}` : url)
  }

  if (message.is_deleted) {
    return (
      <div data-message-id={message.id} className="flex gap-2 px-3 pt-1">
        <div className="w-7 shrink-0" />
        <p className="text-xs italic text-muted-foreground">Mensaje eliminado</p>
      </div>
    )
  }

  const canDelete = isOwn || isAdmin

  return (
    <div
      data-message-id={message.id}
      className={cn(
        'group relative flex gap-2 px-3 hover:bg-muted/40',
        showHeader ? 'pt-3' : 'pt-0.5',
        isBot && 'bg-violet-500/4',
      )}
    >
      <div className="w-7 shrink-0">
        {showHeader &&
          (isBot ? (
            <div className="flex size-7 items-center justify-center rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-400">
              <Bot className="size-4" />
            </div>
          ) : (
            author && (
              <UserAvatar firstName={author.first_name} lastName={author.last_name} avatarUrl={author.avatar_url} size="sm" />
            )
          ))}
      </div>

      <div className={cn('min-w-0 flex-1', prio && `border-l-2 pl-2 ${prio.border}`)}>
        {showHeader && (
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-semibold text-foreground">
              {name}
              {isOwn && <span className="ml-1 text-[9px] font-normal text-muted-foreground">(tú)</span>}
            </span>
            {isBot ? (
              <span className="flex items-center gap-0.5 rounded bg-violet-500/15 px-1 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400">
                <Bot className="size-2.5" /> IA
              </span>
            ) : (
              author && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  {ROLE_LABEL[author.role]}
                </span>
              )
            )}
            <span className="text-[10px] text-muted-foreground">{time}</span>
            {message.is_pinned && (
              <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-500">
                <Pin className="size-2.5" /> Fijado
              </span>
            )}
          </div>
        )}

        {prio && (
          <span className={cn('my-0.5 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide', prio.badge)}>
            {prio.label}
          </span>
        )}

        {/* Reply quote */}
        {replyTo && (
          <div className="mb-0.5 flex items-center gap-1 border-l-2 border-border pl-2 text-[11px] text-muted-foreground">
            <CornerUpRight className="size-3 shrink-0" />
            <span className="font-medium">
              {replyToAuthor ? replyToAuthor.nickname || replyToAuthor.first_name : 'Usuario'}:
            </span>
            <span className="truncate">
              {replyTo.is_deleted ? 'Mensaje eliminado' : replyTo.content_text}
            </span>
          </div>
        )}

        <div
          className="chat-content max-w-none break-words text-sm leading-relaxed"
          onClick={handleContentClick}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />

        {message.edited_at && <span className="text-[9px] text-muted-foreground">(editado)</span>}

        {/* Reactions */}
        {grouped.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {grouped.map(g => (
              <button
                key={g.emoji}
                onClick={() => onReact(message.id, g.emoji)}
                className={cn(
                  'flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors',
                  g.mine
                    ? 'border-primary/40 bg-primary/10 text-foreground'
                    : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                <span>{g.emoji}</span>
                <span className="font-medium">{g.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover toolbar */}
      <div className="absolute -top-2 right-2 flex items-center gap-0.5 rounded-md border border-border bg-background p-0.5 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        <EmojiPicker align="end" onSelect={emoji => onReact(message.id, emoji)}>
          <button title="Reaccionar" aria-label="Reaccionar" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <Smile className="size-3.5" />
          </button>
        </EmojiPicker>
        <button onClick={() => onReply(message)} title="Responder" aria-label="Responder" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
          <Reply className="size-3.5" />
        </button>
        {isOwn && (
          <button onClick={() => onEdit(message)} title="Editar" aria-label="Editar" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            <Pencil className="size-3.5" />
          </button>
        )}
        {isAdmin && (
          <button onClick={() => onTogglePin(message)} title={message.is_pinned ? 'Desfijar' : 'Fijar'} aria-label="Fijar" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">
            {message.is_pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
          </button>
        )}
        {canDelete && (
          <button onClick={() => onDelete(message.id)} title="Eliminar" aria-label="Eliminar" className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-red-500">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
