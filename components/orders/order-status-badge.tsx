import { cn } from '@/lib/utils'
import type { OrderStatus } from '@/actions/purchase-orders.actions'

const CONFIG: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING:   { label: 'Pendiente',  cls: 'bg-amber-100 text-amber-800 border-amber-300' },
  PARTIAL:   { label: 'Parcial',    cls: 'bg-blue-100  text-blue-800  border-blue-300'  },
  COMPLETED: { label: 'Completada', cls: 'bg-green-100 text-green-800 border-green-300' },
  CANCELLED: { label: 'Cancelada',  cls: 'bg-red-100   text-red-800   border-red-300'   },
}

export function OrderStatusBadge({
  status,
  size = 'sm',
}: {
  status: OrderStatus | null
  size?: 'xs' | 'sm'
}) {
  const cfg = CONFIG[status ?? 'PENDING']
  return (
    <span
      className={cn(
        'inline-flex items-center border font-bold uppercase tracking-widest',
        size === 'xs' ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]',
        cfg.cls
      )}
    >
      {cfg.label}
    </span>
  )
}
