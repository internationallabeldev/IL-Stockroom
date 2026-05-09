import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ROLE_CONFIG: Record<UserRole, { label: string; className: string }> = {
  ADMIN: {
    label: 'Admin',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  PURCHASER: {
    label: 'Compras',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  WAREHOUSE_MANAGER: {
    label: 'Almacén',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  PRODUCER: {
    label: 'Producción',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  USER: {
    label: 'Usuario',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
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
