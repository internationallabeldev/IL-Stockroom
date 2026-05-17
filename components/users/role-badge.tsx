import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-400 border-purple-300 dark:border-purple-700',
  },
  PURCHASER: {
    label: 'Compras',
    className: 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  },
  WAREHOUSE_MANAGER: {
    label: 'Almacén',
    className: 'bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  },
  PRODUCER: {
    label: 'Producción',
    className: 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-400 border-green-300 dark:border-green-700',
  },
  USER: {
    label: 'Usuario',
    className: 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
  },
}

export function RoleBadge({ role }: { role: UserRole }) {
  const { label, className } = ROLE_CONFIG[role]
  return (
    <Badge
      variant="outline"
      className={cn('text-[9px] font-bold uppercase tracking-widest py-0.5', className)}
    >
      {label}
    </Badge>
  )
}
