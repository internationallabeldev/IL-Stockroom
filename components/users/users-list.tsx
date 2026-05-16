'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, UserPlus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RoleBadge } from './role-badge'
import { InviteUserForm } from './invite-user-form'
import { UserDetailSheet } from './user-detail-sheet'
import { getUsers, type AppUser } from '@/actions/users.actions'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

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

function UserAvatar({ user }: { user: AppUser }) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt=""
        className="size-7 object-cover rounded-none"
      />
    )
  }
  return (
    <div className="size-7 bg-[#1A1A1A] flex items-center justify-center shrink-0">
      <span className="text-[#F5F2EA] text-[9px] font-bold">{initials}</span>
    </div>
  )
}

type Props = {
  initialUsers: AppUser[]
  currentUserId: string
}

export function UsersList({ initialUsers, currentUserId }: Props) {
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
      <div className="sticky top-16 z-30 bg-[#F5F2EA] border-b border-[#1A1A1A]/10 -mx-8 px-8 py-3 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40 pointer-events-none" />
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="h-8 w-56 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-7 text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5f5e59] hover:text-[#1A1A1A]">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex border border-[#1A1A1A]/20">
          {ROLE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setRoleFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                roleFilter === f.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex border border-[#1A1A1A]/20">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 h-8 text-[10px] font-bold uppercase tracking-widest transition-colors',
                statusFilter === f.value
                  ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                  : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A] border-l border-[#1A1A1A]/20 first:border-l-0',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-2 h-8 px-4 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
        >
          <UserPlus className="size-3.5" />
          Invitar usuario
        </button>
      </div>

      {/* Count */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-4">
        {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="border border-[#1A1A1A]/15 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1A1A1A]/10 bg-[#E5E1D8]">
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] w-10" />
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Nombre
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Rol
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Último acceso
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`border-b border-[#1A1A1A]/8 cursor-pointer hover:bg-[#E5E1D8] transition-colors ${
                    i % 2 === 0 ? 'bg-white' : 'bg-[#fdf9f0]'
                  }`}
                >
                  <td className="px-4 py-3">
                    <UserAvatar user={u} />
                  </td>
                  <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                    {u.first_name} {u.last_name}
                    {u.id === currentUserId && (
                      <span className="ml-1.5 text-[9px] text-[#5f5e59] font-normal">(tú)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#5f5e59]">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3 text-[#5f5e59] text-[11px]">
                    {formatLastAccess(u.last_sign_in_at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                        u.enabled
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
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
        <div className="border border-dashed border-[#1A1A1A]/20 p-16 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
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
