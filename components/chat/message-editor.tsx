'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention, { type MentionNodeAttrs, type MentionOptions } from '@tiptap/extension-mention'
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion'
import { Send, X, Flag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { UserAvatar } from '@/components/shared/user-avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Reference } from '@/lib/chat/extensions'
import { PRIORITY_ORDER, PRIORITY_META, type ChatPriority } from '@/lib/chat/constants'
import {
  REF_DOMAINS,
  REF_SECTIONS,
  isRefDomain,
  isRefSection,
  type RefDomain,
  type RefSection,
} from '@/lib/chat/references'
import { searchReferences, type SearchResult } from '@/actions/search.actions'
import type { ChatUser } from '@/actions/chat.actions'

function displayName(u: ChatUser): string {
  return u.nickname || `${u.first_name} ${u.last_name}`.trim()
}

const POPUP_MAX_H = 288 // px — matches max-h-72 on the lists

/** Position a body-appended suggestion popup, flipping above the caret when
 *  there isn't enough room below (the composer sits near the viewport bottom). */
function placePopup(el: HTMLElement, clientRect?: (() => DOMRect | null) | null) {
  if (!clientRect) return
  const r = clientRect()
  if (!r) return
  el.style.left = `${r.left}px`
  const spaceBelow = window.innerHeight - r.bottom
  if (spaceBelow < POPUP_MAX_H + 8 && r.top > spaceBelow) {
    el.style.top = 'auto'
    el.style.bottom = `${window.innerHeight - r.top + 4}px`
  } else {
    el.style.bottom = 'auto'
    el.style.top = `${r.bottom + 4}px`
  }
}

// ── @mention dropdown ──────────────────────────────────────────────────────────

type MentionListHandle = { onKeyDown: (e: KeyboardEvent) => boolean }

type MentionListProps = {
  items: ChatUser[]
  command: (attrs: MentionNodeAttrs) => void
}

const MentionList = forwardRef<MentionListHandle, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [index, setIndex] = useState(0)
    useEffect(() => setIndex(0), [items])

    const select = (i: number) => {
      const u = items[i]
      if (u) command({ id: u.id, label: displayName(u) })
    }

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: e => {
          if (items.length === 0) return false
          if (e.key === 'ArrowUp') { setIndex(i => (i + items.length - 1) % items.length); return true }
          if (e.key === 'ArrowDown') { setIndex(i => (i + 1) % items.length); return true }
          if (e.key === 'Enter') { select(index); return true }
          return false
        },
      }),
      [index, items],
    )

    if (items.length === 0) return null
    return (
      <ScrollArea className="max-h-72 w-56 rounded-md border border-border bg-popover shadow-md">
        <div className="py-1">
          {items.map((u, i) => (
            <button
              key={u.id}
              type="button"
              onClick={() => select(i)}
              onMouseEnter={() => setIndex(i)}
              className={cn(
                'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs',
                i === index ? 'bg-muted' : '',
              )}
            >
              <UserAvatar firstName={u.first_name} lastName={u.last_name} avatarUrl={u.avatar_url} size="sm" />
              <span className="truncate">{displayName(u)}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    )
  },
)

function createMentionSuggestion(
  getUsers: () => ChatUser[],
  setOpen: (open: boolean) => void,
): Omit<SuggestionOptions<ChatUser, MentionNodeAttrs>, 'editor'> {
  return {
    items: ({ query }) => {
      const q = query.toLowerCase()
      return getUsers()
        .filter(u => `${u.nickname ?? ''} ${u.first_name} ${u.last_name}`.toLowerCase().includes(q))
        .slice(0, 8)
    },
    render: () => {
      let component: ReactRenderer<MentionListHandle, MentionListProps> | null = null
      let el: HTMLDivElement | null = null

      const place = (clientRect?: (() => DOMRect | null) | null) => {
        if (el) placePopup(el, clientRect)
      }

      return {
        onStart: (props: SuggestionProps<ChatUser, MentionNodeAttrs>) => {
          setOpen(true)
          component = new ReactRenderer(MentionList, {
            props: { items: props.items, command: props.command },
            editor: props.editor,
          })
          el = document.createElement('div')
          el.style.position = 'fixed'
          el.style.zIndex = '80'
          document.body.appendChild(el)
          el.appendChild(component.element)
          place(props.clientRect)
        },
        onUpdate: (props: SuggestionProps<ChatUser, MentionNodeAttrs>) => {
          component?.updateProps({ items: props.items, command: props.command })
          place(props.clientRect)
        },
        onKeyDown: ({ event }) => {
          if (event.key === 'Escape') return true
          return component?.ref?.onKeyDown(event) ?? false
        },
        onExit: () => {
          setOpen(false)
          el?.remove()
          el = null
          component?.destroy()
          component = null
        },
      }
    },
  }
}

// ── /reference dropdown (hierarchical: domain → section → element) ──────────────

type RefAttrs = { id: string; label: string; url: string; q: string }

type RefItem =
  | { kind: 'domain'; key: RefDomain; label: string }
  | { kind: 'section'; domain: RefDomain; key: RefSection; label: string }
  | { kind: 'element'; result: SearchResult }

type RefListHandle = { onKeyDown: (e: KeyboardEvent) => boolean }
type RefListProps = { items: RefItem[]; onSelect: (item: RefItem) => void }

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  provider: 'Proveedor',
  ink_catalog: 'Cat. Tinta',
  paper_catalog: 'Cat. Papel',
  ink_inventory: 'Inv. Tinta',
  paper_inventory: 'Inv. Papel',
  purchase_order: 'Orden',
  requisition: 'Requisición',
  output: 'Salida',
  supply: 'Suministro',
}

function refItemKey(item: RefItem): string {
  if (item.kind === 'domain') return `d-${item.key}`
  if (item.kind === 'section') return `s-${item.domain}-${item.key}`
  return `e-${item.result.id}`
}

/** Resolve the dropdown items for the current typed path (text after the `/`). */
async function resolveRefItems(query: string): Promise<RefItem[]> {
  const segs = query.split('/')
  const domainSeg = segs[0] ?? ''

  // Level 1 — domains, until an exact domain is matched
  if (!isRefDomain(domainSeg)) {
    const f = domainSeg.toLowerCase()
    return REF_DOMAINS
      .filter(d => d.label.toLowerCase().includes(f) || d.key.includes(f))
      .map(d => ({ kind: 'domain', key: d.key, label: d.label }))
  }
  const domain = domainSeg // narrowed to RefDomain

  // Exact domain and nothing else typed → show its sections
  if (segs.length === 1) {
    return REF_SECTIONS[domain].map(s => ({ kind: 'section', domain, key: s.key, label: s.label }))
  }

  const sectionSeg = segs[1] ?? ''

  // Level 2 — sections, until an exact section is matched
  if (!isRefSection(domain, sectionSeg)) {
    const f = sectionSeg.toLowerCase()
    return REF_SECTIONS[domain]
      .filter(s => s.label.toLowerCase().includes(f) || s.key.includes(f))
      .map(s => ({ kind: 'section', domain, key: s.key, label: s.label }))
  }
  const section = sectionSeg // narrowed to RefSection

  // Level 3 — elements (exact section → recent; `/term` → filtered)
  const term = segs.slice(2).join('/')
  const results = await searchReferences(domain, section, term)
  return results.map(r => ({ kind: 'element', result: r }))
}

const ReferenceList = forwardRef<RefListHandle, RefListProps>(
  function ReferenceList({ items, onSelect }, ref) {
    const [index, setIndex] = useState(0)
    const listRef = useRef<HTMLDivElement>(null)
    useEffect(() => setIndex(0), [items])
    useEffect(() => {
      ;(listRef.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'nearest' })
    }, [index])

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: e => {
          if (items.length === 0) return false
          if (e.key === 'ArrowUp') { setIndex(i => (i + items.length - 1) % items.length); return true }
          if (e.key === 'ArrowDown') { setIndex(i => (i + 1) % items.length); return true }
          if (e.key === 'Enter') { onSelect(items[index]); return true }
          return false
        },
      }),
      [index, items, onSelect],
    )

    if (items.length === 0) return null
    return (
      <ScrollArea className="max-h-72 w-72 rounded-md border border-border bg-popover shadow-md">
        <div ref={listRef} className="py-1">
          {items.map((item, i) => (
          <button
            key={refItemKey(item)}
            type="button"
            onClick={() => onSelect(item)}
            onMouseEnter={() => setIndex(i)}
            className={cn(
              'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs',
              i === index ? 'bg-muted' : '',
            )}
          >
            {item.kind === 'element' ? (
              <>
                <span className="shrink-0 rounded bg-muted px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                  {TYPE_LABEL[item.result.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{item.result.title}</span>
                  {item.result.subtitle && (
                    <span className="block truncate text-[10px] text-muted-foreground">{item.result.subtitle}</span>
                  )}
                </span>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 font-medium text-foreground">{item.label}</span>
                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
              </>
            )}
          </button>
          ))}
        </div>
      </ScrollArea>
    )
  },
)

function createReferenceSuggestion(
  setOpen: (open: boolean) => void,
): Omit<SuggestionOptions<RefItem, RefAttrs>, 'editor'> {
  return {
    char: '/',
    // Keep the suggestion alive across the path separators (`/papel/inventario/…`).
    allowToIncludeChar: true,
    items: ({ query }) => resolveRefItems(query),
    render: () => {
      let component: ReactRenderer<RefListHandle, RefListProps> | null = null
      let el: HTMLDivElement | null = null

      const place = (clientRect?: (() => DOMRect | null) | null) => {
        if (el) placePopup(el, clientRect)
      }

      // Domain/section advance the path; an element inserts the reference node.
      const buildSelect = (props: SuggestionProps<RefItem, RefAttrs>) => (item: RefItem) => {
        if (item.kind === 'element') {
          props.command({
            id: item.result.id,
            label: item.result.title,
            url: item.result.url,
            q: item.result.q ?? item.result.title,
          })
        } else {
          // Complete just the word (no trailing slash); the menu advances on exact match.
          const path = item.kind === 'domain' ? item.key : `${item.domain}/${item.key}`
          props.editor.chain().focus().insertContentAt(props.range, `/${path}`).run()
        }
      }

      return {
        onStart: (props: SuggestionProps<RefItem, RefAttrs>) => {
          setOpen(true)
          component = new ReactRenderer(ReferenceList, {
            props: { items: props.items, onSelect: buildSelect(props) },
            editor: props.editor,
          })
          el = document.createElement('div')
          el.style.position = 'fixed'
          el.style.zIndex = '80'
          document.body.appendChild(el)
          el.appendChild(component.element)
          place(props.clientRect)
        },
        onUpdate: (props: SuggestionProps<RefItem, RefAttrs>) => {
          component?.updateProps({ items: props.items, onSelect: buildSelect(props) })
          place(props.clientRect)
        },
        onKeyDown: ({ event }) => {
          if (event.key === 'Escape') return true
          return component?.ref?.onKeyDown(event) ?? false
        },
        onExit: () => {
          setOpen(false)
          el?.remove()
          el = null
          component?.destroy()
          component = null
        },
      }
    },
  }
}

// ── Composer ────────────────────────────────────────────────────────────────

const HINTS = [
  'Escribe un mensaje…',
  'Escribe @ para mencionar a alguien',
  'Escribe / para referenciar (tinta, papel…)',
  'Enter envía · Shift+Enter salto de línea',
]

type Props = {
  onSend: (content: string, contentText: string, priority?: ChatPriority | null) => void | Promise<void>
  disabled?: boolean
  mentionUsers: ChatUser[]
  /** When set, the editor starts with this HTML (edit mode): no priority picker, shows cancel. */
  initialContent?: string
  onCancel?: () => void
}

export function MessageEditor({ onSend, disabled, mentionUsers, initialContent, onCancel }: Props) {
  const [empty, setEmpty] = useState(!initialContent)
  const [priority, setPriority] = useState<ChatPriority | null>(null)
  const [hintIdx, setHintIdx] = useState(0)
  const isEdit = !!onCancel

  // Rotate the placeholder hint so the actions stay discoverable without crowding.
  useEffect(() => {
    if (isEdit) return
    const id = setInterval(() => setHintIdx(i => (i + 1) % HINTS.length), 3500)
    return () => clearInterval(id)
  }, [isEdit])
  const sendRef = useRef(onSend)
  sendRef.current = onSend
  const usersRef = useRef(mentionUsers)
  usersRef.current = mentionUsers
  const priorityRef = useRef(priority)
  priorityRef.current = priority
  const mentionOpenRef = useRef(false)
  const referenceOpenRef = useRef(false)
  const submitRef = useRef<() => void>(() => {})

  const editor = useEditor({
    immediatelyRender: false, // required under Next.js SSR
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: { class: 'mention' },
        suggestion: createMentionSuggestion(() => usersRef.current, v => { mentionOpenRef.current = v }),
      }),
      Reference.configure({
        HTMLAttributes: { class: 'chat-ref' },
        suggestion: createReferenceSuggestion(v => { referenceOpenRef.current = v }) as unknown as MentionOptions['suggestion'],
      }),
    ],
    editorProps: {
      attributes: {
        class: 'chat-content text-sm min-h-[2.5rem] max-h-40 overflow-y-auto px-3 py-2 focus:outline-none',
      },
      handleKeyDown: (_view, event) => {
        const suggesting = mentionOpenRef.current || referenceOpenRef.current
        if (event.key === 'Enter' && !event.shiftKey && !suggesting) {
          event.preventDefault()
          submitRef.current()
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor }) => setEmpty(editor.isEmpty),
  })

  // Edit mode: seed content + focus once the editor exists.
  useEffect(() => {
    if (editor && initialContent) {
      editor.commands.setContent(initialContent)
      editor.commands.focus('end')
      setEmpty(editor.isEmpty)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  submitRef.current = () => {
    if (!editor || editor.isEmpty || disabled) return
    const html = editor.getHTML()
    const text = editor.getText()
    if (!text.trim()) return
    void sendRef.current(html, text, priorityRef.current)
    if (!isEdit) {
      editor.commands.clearContent()
      setEmpty(true)
      setPriority(null)
    }
  }

  const canSend = !empty && !disabled
  const prioMeta = priority ? PRIORITY_META[priority] : null

  return (
    <div className="border-t border-border p-2">
      <div className="flex items-end gap-2">
        {!isEdit && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                title="Prioridad del mensaje"
                aria-label="Prioridad del mensaje"
                className={cn(
                  'flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors',
                  prioMeta
                    ? `${prioMeta.badge} border-transparent`
                    : 'border-border text-muted-foreground hover:bg-muted',
                )}
              >
                <Flag className="size-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" style={{ zIndex: 70 }} className="w-44 gap-0 p-1">
              <button
                onClick={() => setPriority(null)}
                className={cn(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted',
                  !priority && 'bg-muted',
                )}
              >
                <span className="size-2 rounded-full border border-muted-foreground" />
                Normal
              </button>
              {PRIORITY_ORDER.map(p => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted',
                    priority === p && 'bg-muted',
                  )}
                >
                  <span className={cn('size-2 rounded-full', PRIORITY_META[p].dot)} />
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        )}

        <div className="relative flex-1 rounded-md border border-border bg-background focus-within:border-foreground/40">
          {!isEdit && empty && (
            <span
              key={hintIdx}
              className="pointer-events-none absolute left-3 top-2 max-w-[calc(100%-1.5rem)] truncate text-sm text-muted-foreground animate-in fade-in duration-700"
            >
              {HINTS[hintIdx]}
            </span>
          )}
          <EditorContent editor={editor} />
        </div>

        <button
          type="button"
          onClick={() => submitRef.current()}
          disabled={!canSend}
          aria-label="Enviar mensaje"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-md transition-colors',
            canSend
              ? 'bg-foreground text-background hover:opacity-90'
              : 'bg-muted text-muted-foreground cursor-not-allowed',
          )}
        >
          <Send className="size-4" />
        </button>
      </div>

      {!isEdit && prioMeta && (
        <div className="mt-1 flex items-center gap-1 text-[10px]">
          <span className={cn('rounded px-1.5 py-0.5 font-bold uppercase tracking-wide', prioMeta.badge)}>
            {prioMeta.label}
          </span>
          <button onClick={() => setPriority(null)} className="text-muted-foreground hover:text-foreground">
            quitar
          </button>
        </div>
      )}

      {isEdit && (
        <button
          onClick={onCancel}
          className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" /> Cancelar edición
        </button>
      )}
    </div>
  )
}
