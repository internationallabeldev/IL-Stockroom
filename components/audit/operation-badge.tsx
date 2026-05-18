import { Plus, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuditOperation } from '@/lib/audit-constants'

const CONFIG: Record<AuditOperation, { label: string; icon: typeof Plus; cls: string }> = {
  INSERT: { label: 'Creación', icon: Plus,   cls: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' },
  UPDATE: { label: 'Edición',  icon: Pencil, cls: 'bg-blue-500/15   text-blue-600   dark:text-blue-400   border-blue-500/30'   },
  DELETE: { label: 'Baja',     icon: Trash2, cls: 'bg-red-500/15    text-red-600    dark:text-red-400    border-red-500/30'    },
}

export function OperationBadge({ operation }: { operation: AuditOperation }) {
  const { label, icon: Icon, cls } = CONFIG[operation]
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border', cls)}>
      <Icon className="size-2.5" />
      {label}
    </span>
  )
}
