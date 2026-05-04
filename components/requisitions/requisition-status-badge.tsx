import { cn } from '@/lib/utils'
import { Clock, CheckCircle, PackageCheck, XCircle } from 'lucide-react'
import type { RequisitionStatus } from '@/actions/requisitions.actions'

const CONFIG: Record<RequisitionStatus, { label: string; cls: string; Icon: React.ComponentType<{ className?: string }> }> = {
  PENDING:   { label: 'Pendiente', cls: 'bg-amber-50 text-amber-800 border-amber-300',  Icon: Clock        },
  APPROVED:  { label: 'Aprobada',  cls: 'bg-blue-50  text-blue-800  border-blue-300',   Icon: CheckCircle  },
  FULFILLED: { label: 'Surtida',   cls: 'bg-green-50 text-green-800 border-green-300',  Icon: PackageCheck },
  REJECTED:  { label: 'Rechazada', cls: 'bg-red-50   text-red-800   border-red-300',    Icon: XCircle      },
}

export function RequisitionStatusBadge({
  status,
  size = 'sm',
}: {
  status: RequisitionStatus | null | undefined
  size?: 'xs' | 'sm'
}) {
  const cfg = CONFIG[(status ?? 'PENDING') as RequisitionStatus] ?? CONFIG.PENDING
  const { Icon } = cfg

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border font-bold uppercase tracking-widest',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        cfg.cls,
      )}
    >
      <Icon className={size === 'xs' ? 'size-2.5' : 'size-3'} />
      {cfg.label}
    </span>
  )
}
