import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Quality = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

const CONFIG: Record<Quality, { label: string; icon: typeof Clock; cls: string }> = {
  PENDING:     { label: 'Pendiente',    icon: Clock,        cls: 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800' },
  APPROVED:    { label: 'Aprobado',     icon: CheckCircle,  cls: 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'       },
  REJECTED:    { label: 'Rechazado',    icon: XCircle,      cls: 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'                   },
  CONDITIONAL: { label: 'Condicional',  icon: AlertCircle,  cls: 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800' },
}

export function QualityBadge({ value, size = 'sm' }: { value: Quality; size?: 'xs' | 'sm' }) {
  const { label, icon: Icon, cls } = CONFIG[value] ?? CONFIG.PENDING
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-bold uppercase tracking-widest',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-1 text-[10px]',
        cls
      )}
    >
      <Icon className={size === 'xs' ? 'size-2.5' : 'size-3'} />
      {label}
    </span>
  )
}
