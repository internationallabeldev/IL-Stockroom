'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEmbedded, toolbarStickyClass } from '@/lib/embedded-context'
import { RoleBadge } from './role-badge'
import { InviteUserForm } from './invite-user-form'
import { UserDetailSheet } from './user-detail-sheet'
import { getUsers, type AppUser } from '@/actions/users.actions'
import { UserAvatar } from '@/components/shared/user-avatar'

const ROLE_FILTERS: { value: string; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PURCHASER', label: 'Compras' },
  { value: 'WAREHOUSE_MANAGER', label: 'Almacén' },
  { value: 'PRODUCER', label: 'Producción' },
  { value: 'USER', label: 'Usuario' },
]

const STATUS_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

function formatLastAccess(iso: string | null) {
  if (!iso) return '—'
  const date = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
}


type Props = {
  initialUsers: AppUser[]
  currentUserId: string
}

export function UsersList({ initialUsers, currentUserId }: Props) {
  const embedded = useEmbedded()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [selected, setSelected] = useState<AppUser | null>(null)

  const { data: users = initialUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => getUsers(),
    initialData: initialUsers,
    refetchInterval: 30_000,
  })

  const filtered = users.filter(u => {
    if (roleFilter && u.role !== roleFilter) return false
    if (statusFilter === 'active' && !u.enabled) return false
    if (statusFilter === 'inactive' && u.enabled) return false
    if (search) {
      const q = search.toLowerCase()
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase()
      if (!fullName.includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })

  useEffect(() => {
    if (selected) {
      const updated = users.find(u => u.id === selected.id)
      if (updated) setSelected(updated)
    }
  }, [users])

  return (
    <>
      {/* Toolbar */}
      <div className={cn('@container sticky z-30 bg-background border-b border-border py-3 mb-6 flex flex-wrap items-center gap-3', toolbarStickyClass(embedded))}>
        <div className={cn('relative min-w-40', embedded ? 'flex-1' : 'flex-1 @2xl:flex-none')}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-foreground/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className={cn(
              'h-8 w-full border border-foreground/20 bg-card pl-8 pr-7 text-xs outline-none focus:border-foreground/50 transition-colors',
              !embedded && '@2xl:w-56',
            )}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex border border-border shrink-0">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                roleFilter === f.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground border-l border-border first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex border border-border shrink-0">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                statusFilter === f.value
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground border-l border-border first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {!embedded && <div className="flex-1" />}

        <button
          onClick={() => setInviteOpen(true)}
          title={embedded ? 'Invitar usuario' : undefined}
          aria-label={embedded ? 'Invitar usuario' : undefined}
          className={cn(
            'flex items-center gap-2 h-8 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity shrink-0',
            embedded ? 'px-2.5' : 'px-4',
          )}
        >
          <UserPlus className="size-3.5" />
          {!embedded && 'Invitar usuario'}
        </button>
      </div>

      {/* Count */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 bg-muted/40">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-10" />
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Último acceso
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`border-b border-border/30 cursor-pointer hover:bg-muted/20 transition-colors ${
                    i % 2 === 0 ? 'bg-background' : 'bg-card'
                  }`}
                >
                  <td className="px-4 py-3">
                    <UserAvatar firstName={u.first_name} lastName={u.last_name} avatarUrl={u.avatar_url} size="sm" />
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.first_name} {u.last_name}
                    {u.id === currentUserId && (
                      <span className="ml-1.5 text-[9px] text-muted-foreground font-normal">(tú)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-[11px]">
                    {formatLastAccess(u.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        u.enabled
                          ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                          : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                      }`}
                    >
                      {u.enabled ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-dashed border-border/50 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {search || roleFilter || statusFilter
              ? 'Sin resultados para los filtros aplicados'
              : 'No hay usuarios'}
          </p>
        </div>
      )}

      <InviteUserForm open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <UserDetailSheet
        user={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        currentUserId={currentUserId}
      />
    </>
  )
}
