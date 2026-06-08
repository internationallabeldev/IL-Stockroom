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
