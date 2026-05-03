import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Quality = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

const CONFIG: Record<Quality, { label: string; icon: typeof Clock; cls: string }> = {
  PENDING:     { label: 'Pendiente',    icon: Clock,        cls: 'bg-yellow-50  text-yellow-700  border-yellow-200' },
  APPROVED:    { label: 'Aprobado',     icon: CheckCircle,  cls: 'bg-green-50   text-green-700   border-green-200'  },
  REJECTED:    { label: 'Rechazado',    icon: XCircle,      cls: 'bg-red-50     text-red-700     border-red-200'    },
  CONDITIONAL: { label: 'Condicional',  icon: AlertCircle,  cls: 'bg-orange-50  text-orange-700  border-orange-200' },
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
