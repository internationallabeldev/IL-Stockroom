'use client'

import type { ReactNode } from 'react'
import { ChevronDown, BarChart3 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * A compact toolbar chip that reveals its children in a dropdown on hover /
 * focus. Used in embedded (workspace split-pane) mode to collapse secondary
 * toolbar controls into a single row when horizontal space is scarce.
 *
 * Opens on `group-hover` *and* `group-focus-within` so it also works with the
 * keyboard and touch (the panel may hold interactive controls). The panel uses
 * `pt-1` rather than a margin so the hover area stays contiguous with the chip.
 */
export function ToolbarHoverMenu({
  label,
  icon: Icon,
  children,
  align = 'right',
  iconOnly = false,
}: {
  label:    string
  icon?:    LucideIcon
  children: ReactNode
  align?:   'left' | 'right'
  iconOnly?: boolean
}) {
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        title={iconOnly ? label : undefined}
        aria-label={iconOnly ? label : undefined}
        className={cn(
          'flex items-center h-8 border border-border text-muted-foreground hover:border-foreground/40 group-focus-within:border-foreground/40 transition-colors',
          iconOnly ? 'gap-0.5 px-2' : 'gap-1.5 px-3',
        )}
      >
        {Icon && <Icon className="size-3 shrink-0" />}
        {!iconOnly && <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>}
        <ChevronDown className="size-3 shrink-0 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>

      <div
        className={cn(
          'absolute top-full z-40 pt-1 hidden group-hover:block group-focus-within:block',
          align === 'right' ? 'right-0' : 'left-0',
        )}
      >
        <div className="p-3 border border-border bg-popover shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * Icon-only summary chip for embedded mode. Reveals an arbitrary stats/KPI bar
 * (passed as `children`) in a hover/focus dropdown so it collapses to a single
 * `BarChart3` icon on the toolbar instead of eating its own row. The panel is
 * right-aligned and given a sensible min-width so wrapped stat rows stay legible.
 */
export function EmbeddedSummaryChip({
  children,
  label = 'Resumen',
}: {
  children: ReactNode
  label?:   string
}) {
  return (
    <div className="relative group shrink-0">
      <button
        type="button"
        title={label}
        aria-label={label}
        className="flex items-center gap-1 h-8 px-2 border border-border text-muted-foreground hover:border-foreground/40 group-focus-within:border-foreground/40 transition-colors"
      >
        <BarChart3 className="size-3 shrink-0" />
        <ChevronDown className="size-3 shrink-0 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>

      <div className="absolute top-full right-0 z-40 pt-1 hidden group-hover:block group-focus-within:block">
        <div className="p-3 min-w-56 max-w-80 border border-border bg-popover shadow-xl">
          {children}
        </div>
      </div>
    </div>
  )
}
