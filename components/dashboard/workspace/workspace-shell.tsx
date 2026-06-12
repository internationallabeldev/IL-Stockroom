'use client'

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { EmbeddedProvider } from '@/lib/embedded-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  workspaceSectionsForRole,
  WORKSPACE_SECTION_MAP,
  MATERIAL_META,
  parsePaneValue,
  paneValue,
  type Role,
  type WorkspaceSectionDef,
  type WorkspaceMaterial,
} from './view-registry'

type Side = 'left' | 'right'

const SPLIT_KEY = 'workspace-split'
const MIN_PCT = 20
const MAX_PCT = 80

export function WorkspaceShell({ role, userId }: { role: Role; userId: string }) {
  const router = useRouter()
  const params = useSearchParams()

  const sections = workspaceSectionsForRole(role)

  // Each pane is encoded in the URL as a `section-material` token so views stay
  // shareable. Fall back so a fresh /dashboard/workspace always renders something
  // (left = first section · tintas, right = first section · papel).
  const left  = parsePaneValue(params.get('left'),  sections)
  const right = parsePaneValue(params.get('right') ?? paneValue(sections[0]?.key ?? '', 'paper'), sections)

  const setPane = (side: Side, value: string) => {
    const next = new URLSearchParams(params.toString())
    next.set(side, value)
    router.replace(`/dashboard/workspace?${next.toString()}`, { scroll: false })
  }

  const swap = () => {
    const next = new URLSearchParams(params.toString())
    next.set('left',  paneValue(right.section, right.material))
    next.set('right', paneValue(left.section,  left.material))
    router.replace(`/dashboard/workspace?${next.toString()}`, { scroll: false })
  }

  // ── Resizable split ─────────────────────────────────────────────────────────
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pctRef       = useRef(50)
  const [leftPct, setLeftPct] = useState(50)

  useEffect(() => {
    const stored = Number(localStorage.getItem(SPLIT_KEY))
    if (stored >= MIN_PCT && stored <= MAX_PCT) {
      pctRef.current = stored
      setLeftPct(stored)
    }
  }, [])

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const move = (ev: PointerEvent) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const pct  = ((ev.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(MAX_PCT, Math.max(MIN_PCT, pct))
      pctRef.current = clamped
      setLeftPct(clamped)
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
      localStorage.setItem(SPLIT_KEY, String(Math.round(pctRef.current)))
    }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }, [])

  return (
    <div className="h-[calc(100vh-6.5rem)] px-1.5 py-1.5">
      <div ref={containerRef} className="flex h-full">
        <Pane
          side="left" pane={left} role={role} userId={userId} sections={sections} onChange={setPane} onSwap={swap}
          style={{ flexBasis: `${leftPct}%`, flexGrow: 0, flexShrink: 0 }}
        />

        <div
          onPointerDown={startDrag}
          className="group relative w-2 shrink-0 cursor-col-resize flex items-center justify-center touch-none"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="h-full w-px bg-border group-hover:bg-foreground/40 transition-colors" />
        </div>

        <Pane
          side="right" pane={right} role={role} userId={userId} sections={sections} onChange={setPane} onSwap={swap}
          className="flex-1"
        />
      </div>
    </div>
  )
}

function Pane({
  side, pane, role, userId, sections, onChange, onSwap, className, style,
}: {
  side: Side
  pane: { section: string; material: WorkspaceMaterial }
  role: Role
  userId: string
  sections: WorkspaceSectionDef[]
  onChange: (side: Side, value: string) => void
  onSwap: () => void
  className?: string
  style?: CSSProperties
}) {
  const def        = WORKSPACE_SECTION_MAP[pane.section]
  const isMaterial = !!def?.panes
  const Comp       = def?.panes ? def.panes[pane.material] : def?.pane

  return (
    <section
      style={style}
      className={cn('min-w-0 flex flex-col border border-border bg-background', className)}
    >
      <header className="shrink-0 flex items-center justify-between gap-2 border-b border-border px-3 py-2 bg-card">
        <Select value={pane.section} onValueChange={v => onChange(side, paneValue(v, pane.material))}>
          <SelectTrigger size="sm" className="max-w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sections.map(s => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2 shrink-0">
          {side === 'left' && (
            <button
              type="button"
              onClick={onSwap}
              className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 hover:text-foreground transition-colors"
            >
              Intercambiar
            </button>
          )}

          {/* Per-pane material toggle — round on purpose, breaking the sharp grid.
              Hidden for single-pane sections (providers, supplies, …). */}
          {isMaterial && (
          <div className="flex items-center gap-0.5 rounded-full bg-foreground/8 p-0.5">
            {(['inks', 'paper'] as const).map(m => {
              const Icon   = MATERIAL_META[m].icon
              const active = pane.material === m
              return (
                <button
                  key={m}
                  type="button"
                  title={MATERIAL_META[m].label}
                  aria-label={MATERIAL_META[m].label}
                  aria-pressed={active}
                  onClick={() => onChange(side, paneValue(pane.section, m))}
                  className={cn(
                    'flex items-center justify-center size-6 rounded-full transition-colors',
                    active ? 'bg-foreground text-background' : 'text-foreground/40 hover:text-foreground',
                  )}
                >
                  <Icon className="size-3" />
                </button>
              )
            })}
          </div>
          )}
        </div>
      </header>

      {/* No top padding: the sticky toolbar sits flush at top-0 so scrolled rows
          can't peek through a gap above it. Horizontal/bottom padding stays for
          the toolbar's `-mx-3 px-3` bleed. */}
      <div className="flex-1 min-w-0 overflow-auto px-3 pb-3">
        <EmbeddedProvider value={true}>
          {Comp ? <Comp role={role} userId={userId} /> : <p className="text-xs text-muted-foreground">Vista no disponible.</p>}
        </EmbeddedProvider>
      </div>
    </section>
  )
}
