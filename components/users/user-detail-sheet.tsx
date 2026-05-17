'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Mail, Phone, Clock, Shield } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { RoleBadge } from './role-badge'
import {
  updateUserRole,
  updateUserProfile,
  disableUser,
  enableUser,
  resetUserPassword,
  type AppUser,
} from '@/actions/users.actions'
import {
  resetPasswordSchema,
  updateProfileSchema,
  type ResetPasswordValues,
  type UpdateProfileValues,
} from '@/lib/validations/user.schema'
import type { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PURCHASER', label: 'Compras' },
  { value: 'WAREHOUSE_MANAGER', label: 'Almacén' },
  { value: 'PRODUCER', label: 'Producción' },
  { value: 'USER', label: 'Usuario' },
]

function formatDate(iso: string | null) {
  if (!iso) return 'Nunca'
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function UserAvatar({ user }: { user: AppUser }) {
  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()
  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={`${user.first_name} ${user.last_name}`}
        className="size-16 object-cover"
      />
    )
  }
  return (
    <div className="size-16 bg-foreground flex items-center justify-center shrink-0">
      <span className="text-background text-xl font-bold">{initials}</span>
    </div>
  )
}

type Props = {
  user: AppUser | null
  open: boolean
  onClose: () => void
  currentUserId: string
}

export function UserDetailSheet({ user, open, onClose, currentUserId }: Props) {
  const [confirmDisable, setConfirmDisable] = useState(false)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(user?.role ?? 'USER')
  const isSelf = user?.id === currentUserId

  const profileForm = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      first_name: user?.first_name ?? '',
      last_name: user?.last_name ?? '',
      phone: user?.phone ?? '',
    },
  })

  const passwordForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirm: '' },
  })

  async function handleRoleSave() {
    if (!user) return
    const result = await updateUserRole(user.id, selectedRole)
    if (result.error) toast.error(result.error)
    else toast.success('Rol actualizado')
  }

  async function handleProfileSave(values: UpdateProfileValues) {
    if (!user) return
    const result = await updateUserProfile(user.id, values)
    if (result.error) toast.error(result.error)
    else toast.success('Perfil actualizado')
  }

  async function handlePasswordReset(values: ResetPasswordValues) {
    if (!user) return
    const result = await resetUserPassword(user.id, values.password)
    if (result.error) toast.error(result.error)
    else {
      toast.success('Contraseña actualizada')
      passwordForm.reset()
    }
  }

  async function handleToggleStatus() {
    if (!user) return
    setLoadingToggle(true)
    const action = user.enabled ? disableUser : enableUser
    const result = await action(user.id)
    setLoadingToggle(false)
    setConfirmDisable(false)
    if (result.error) toast.error(result.error)
    else toast.success(user.enabled ? 'Usuario desactivado' : 'Usuario activado')
  }

  if (!user) return null

  const inputCls = 'w-full h-9 border border-foreground/20 bg-card px-3 text-xs outline-none focus:border-foreground/50 transition-colors'
  const labelCls = 'block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5'
  const sectionHeadingCls = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4'

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-background border-l border-border overflow-y-auto p-0"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-border">
          <SheetHeader>
            <SheetTitle className="sr-only">Detalle de usuario</SheetTitle>
          </SheetHeader>
          <div className="flex items-start gap-4">
            <UserAvatar user={user} />
            <div className="min-w-0">
              <h2 className="font-heading text-lg font-black uppercase tracking-tight leading-tight">
                {user.first_name} {user.last_name}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5 text-muted-foreground">
                <Mail className="size-3 shrink-0" />
                <span className="text-[11px] truncate">{user.email}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <RoleBadge role={user.role} />
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border ${
                    user.enabled
                      ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                  }`}
                >
                  {user.enabled ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {user.phone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-3 shrink-0" />
                <span className="text-[11px]">{user.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="size-3 shrink-0" />
              <span className="text-[11px]">{formatDate(user.last_sign_in_at)}</span>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-8">
          {/* Info básica */}
          <section>
            <h3 className={sectionHeadingCls}>Información</h3>
            <form onSubmit={profileForm.handleSubmit(handleProfileSave)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre</label>
                  <input
                    {...profileForm.register('first_name')}
                    className={inputCls}
                  />
                  {profileForm.formState.errors.first_name && (
                    <p className="mt-1 text-[10px] text-red-600">
                      {profileForm.formState.errors.first_name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Apellido</label>
                  <input
                    {...profileForm.register('last_name')}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  {...profileForm.register('phone')}
                  className={inputCls}
                  placeholder="Opcional"
                />
              </div>
              <button
                type="submit"
                disabled={profileForm.formState.isSubmitting}
                className="h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {profileForm.formState.isSubmitting && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                Guardar
              </button>
            </form>
          </section>

          {/* Rol */}
          <section>
            <h3 className={sectionHeadingCls}>
              <span className="flex items-center gap-1.5">
                <Shield className="size-3" />
                Rol
              </span>
            </h3>
            <div className="flex gap-2">
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                disabled={isSelf}
                className={inputCls + ' appearance-none disabled:opacity-50 disabled:cursor-not-allowed'}
              >
                {ROLE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleRoleSave}
                disabled={isSelf || selectedRole === user.role}
                className="h-9 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
            {isSelf && (
              <p className="mt-2 text-[10px] text-muted-foreground">
                No puedes cambiar tu propio rol.
              </p>
            )}
          </section>

          {/* Contraseña */}
          <section>
            <h3 className={sectionHeadingCls}>Nueva contraseña</h3>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordReset)} className="space-y-3">
              <div>
                <label className={labelCls}>Contraseña</label>
                <input
                  {...passwordForm.register('password')}
                  type="password"
                  className={inputCls}
                  placeholder="Mínimo 8 caracteres"
                />
                {passwordForm.formState.errors.password && (
                  <p className="mt-1 text-[10px] text-red-600">
                    {passwordForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>Confirmar</label>
                <input
                  {...passwordForm.register('confirm')}
                  type="password"
                  className={inputCls}
                />
                {passwordForm.formState.errors.confirm && (
                  <p className="mt-1 text-[10px] text-red-600">
                    {passwordForm.formState.errors.confirm.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={passwordForm.formState.isSubmitting}
                className="h-8 px-4 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
              >
                {passwordForm.formState.isSubmitting && (
                  <Loader2 className="size-3 animate-spin" />
                )}
                Actualizar contraseña
              </button>
            </form>
          </section>

          {/* Estado */}
          <section>
            <h3 className={sectionHeadingCls}>Estado de la cuenta</h3>
            {isSelf ? (
              <p className="text-[11px] text-muted-foreground">No puedes desactivar tu propia cuenta.</p>
            ) : confirmDisable ? (
              <div className="border border-border p-4 bg-card">
                <p className="text-xs text-foreground mb-3">
                  ¿Confirmas que deseas{' '}
                  <strong>{user.enabled ? 'desactivar' : 'activar'}</strong> la cuenta de{' '}
                  <strong>{user.first_name} {user.last_name}</strong>?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDisable(false)}
                    className="flex-1 h-8 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleToggleStatus}
                    disabled={loadingToggle}
                    className={`flex-1 h-8 text-[10px] font-bold uppercase tracking-widest transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      user.enabled
                        ? 'bg-red-600 text-white hover:opacity-80'
                        : 'bg-green-600 text-white hover:opacity-80'
                    }`}
                  >
                    {loadingToggle && <Loader2 className="size-3 animate-spin" />}
                    {user.enabled ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDisable(true)}
                className={`h-9 px-4 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                  user.enabled
                    ? 'border-red-300 dark:border-red-800 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40'
                }`}
              >
                {user.enabled ? 'Desactivar cuenta' : 'Activar cuenta'}
              </button>
            )}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
