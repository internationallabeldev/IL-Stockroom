'use client'

import { useState } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { RoleBadge } from '@/components/users/role-badge'
import { UserAvatar } from '@/components/shared/user-avatar'
import { ProfileForm } from './profile-form'
import { NotificationPreferences } from './notification-preferences'
import { ChangePasswordForm } from './change-password-form'
import type { AppUser } from '@/actions/users.actions'

type ExtUser = AppUser & {
  nickname?:  string | null
  job_title?: string | null
}

type Props = {
  open:    boolean
  onClose: () => void
  user:    AppUser
}

type Tab = 'perfil' | 'notificaciones' | 'contrasena'

const TABS: { id: Tab; label: string }[] = [
  { id: 'perfil',         label: 'Perfil' },
  { id: 'notificaciones', label: 'Notificaciones' },
  { id: 'contrasena',     label: 'Contraseña' },
]

export function SettingsDrawer({ open, onClose, user }: Props) {
  const u = user as ExtUser
  const [tab, setTab] = useState<Tab>('perfil')

  const displayName = u.nickname
    ? u.nickname
    : `${user.first_name} ${user.last_name}`

  return (
    <Sheet open={open} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-0 border-b border-border shrink-0">
          <div className="flex items-center gap-4 mb-4">
            <UserAvatar
              firstName={user.first_name}
              lastName={user.last_name}
              avatarUrl={user.avatar_url}
              size="md"
            />
            <div className="min-w-0">
              <SheetTitle className="text-sm font-bold truncate">{displayName}</SheetTitle>
              {u.job_title && (
                <p className="text-[10px] text-muted-foreground truncate">{u.job_title}</p>
              )}
              <div className="mt-1">
                <RoleBadge role={user.role} />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mx-6 px-6">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`pb-3 px-1 mr-5 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8">
          {tab === 'perfil' && <ProfileForm user={user} />}

          {tab === 'notificaciones' && <NotificationPreferences user={user} />}

          {tab === 'contrasena' && (
            <>
              <div className="mb-5 pb-3 border-b border-border">
                <h2 className="text-sm font-bold uppercase tracking-widest">Cambiar contraseña</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Actualiza tu contraseña de acceso
                </p>
              </div>
              <ChangePasswordForm />
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
