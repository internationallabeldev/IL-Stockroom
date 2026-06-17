'use client'

import { BarChart3, ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded } from '@/lib/embedded-context'

export type StatItem = {
  icon:   LucideIcon
  label:  string
  value:  string
  accent: 'amber' | 'red' | null
  /** Render the value in monospace (e.g. lot codes) instead of tabular nums. */
  mono?:  boolean
}

function accentText(accent: StatItem['accent']) {
  return accent === 'red' ? 'text-red-500' : accent === 'amber' ? 'text-amber-400' : null
}

/** A single KPI: icon · LABEL · value. Shared by the inline bar and the dropdown. */
function StatRow({ stat, withDivider }: { stat: StatItem; withDivider?: boolean }) {
  const { icon: Icon, label, value, accent, mono } = stat
  return (
    <div className="flex items-center gap-2 min-w-0">
      {withDivider && <span className="text-border/60 select-none hidden @2xl:inline">·</span>}
      <Icon className={cn('size-3 shrink-0', accentText(accent) ?? 'text-muted-foreground/50')} />
      <span className="text-[10px] text-muted-foreground/60 font-medium">
        {label}
      </span>
      <span
        className={cn(
          'text-[11px] font-bold',
          mono ? 'font-mono' : 'tabular-nums',
          accentText(accent) ?? 'text-foreground/80',
        )}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * Renders the inventory KPI bar.
 *
 * On a full page it lays the stats out inline (flex row that wraps to a 2-col
 * grid on narrow widths). When embedded in a workspace split pane the pane is
 * too narrow for that — the stats stack and eat scarce vertical space — so we
 * collapse them into a compact "Resumen" chip that reveals the full list on
 * hover / focus. Any critical (amber/red) stat is surfaced on the chip so
 * alerts stay visible while collapsed.
 */
export function InventoryStatsBar({ stats, iconOnly = false }: { stats: StatItem[]; iconOnly?: boolean }) {
  const embedded = useEmbedded()

  if (!embedded) {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 @2xl:flex @2xl:flex-wrap @2xl:items-center @2xl:justify-between">
        {stats.map((stat, i) => (
          <StatRow key={stat.label} stat={stat} withDivider={i > 0} />
        ))}
      </div>
    )
  }

  const alert = stats.find(s => s.accent !== null)

  return (
    <div className="relative inline-block group shrink-0">
      {/* Trigger — also opens on focus-within for keyboard / touch */}
      <button
        type="button"
        title={iconOnly ? 'Resumen' : undefined}
        aria-label={iconOnly ? 'Resumen' : undefined}
        className={cn(
          'flex items-center border border-border text-muted-foreground hover:border-foreground/40 group-focus-within:border-foreground/40 transition-colors',
          iconOnly ? 'gap-1 h-8 px-2' : 'gap-1.5 h-7 px-2.5',
        )}
      >
        <BarChart3 className="size-3 shrink-0" />
        {!iconOnly && <span className="text-[9px] font-bold uppercase tracking-widest">Resumen</span>}
        {alert && (
          <span className={cn('flex items-center gap-0.5 text-[10px] font-bold tabular-nums', accentText(alert.accent))}>
            <alert.icon className="size-3" />
            {alert.value}
          </span>
        )}
        <ChevronDown className="size-3 shrink-0 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
      </button>

      {/* Panel — pt-1 (not mt-1) keeps the hover area contiguous with the trigger */}
      <div className={cn(
        'absolute top-full z-40 pt-1 hidden group-hover:block group-focus-within:block',
        iconOnly ? 'right-0' : 'left-0',
      )}>
        <div className="flex flex-col gap-2 p-3 min-w-48 border border-border bg-popover shadow-xl">
          {stats.map(stat => (
            <StatRow key={stat.label} stat={stat} />
          ))}
        </div>
      </div>
    </div>
  )
}
