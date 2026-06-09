'use client'

import { RETENTION_OPTIONS } from '@/lib/chat/constants'
import { cn } from '@/lib/utils'

/** Segmented control for a channel's message retention. A plain button group
 *  (not shadcn Select) so it works inside the floating chat widget without the
 *  portal/z-index issues a Radix popover would have here. */
export function RetentionSelect({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (value: number | null) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {RETENTION_OPTIONS.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={String(opt.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md border px-2 py-1 text-[11px] transition-colors disabled:opacity-50',
              active
                ? 'border-transparent bg-foreground text-background'
                : 'border-border text-muted-foreground hover:bg-muted',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
