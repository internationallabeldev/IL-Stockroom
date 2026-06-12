// ── Channel message retention ────────────────────────────────────────────────
// `null` = keep forever. Used by the channel form/settings and to label channels.

export const RETENTION_OPTIONS: { value: number | null; label: string }[] = [
  { value: 30, label: '30 días' },
  { value: 60, label: '60 días' },
  { value: 90, label: '90 días' },
  { value: 180, label: '180 días' },
  { value: null, label: 'Sin límite' },
]

export function retentionLabel(days: number | null): string {
  if (days == null) return 'Sin límite'
  return RETENTION_OPTIONS.find(o => o.value === days)?.label ?? `${days} días`
}

export type ChatPriority = 'important' | 'warning' | 'urgent'

export const PRIORITY_ORDER: ChatPriority[] = ['important', 'warning', 'urgent']

/** Visual treatment per priority: message left-border, badge colours, and dot. */
export const PRIORITY_META: Record<
  ChatPriority,
  { label: string; border: string; badge: string; dot: string }
> = {
  important: {
    label: 'Importante',
    border: 'border-l-sky-500',
    badge: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500',
  },
  warning: {
    label: 'Advertencia',
    border: 'border-l-amber-500',
    badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  urgent: {
    label: 'Urgente',
    border: 'border-l-red-500',
    badge: 'bg-red-500/15 text-red-600 dark:text-red-400',
    dot: 'bg-red-500',
  },
}
