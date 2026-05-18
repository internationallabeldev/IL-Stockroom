import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { ProfileForm } from '@/components/settings/profile-form'
import { ChangePasswordForm } from '@/components/settings/change-password-form'
import { NotificationPreferences } from '@/components/settings/notification-preferences'
import { RoleBadge } from '@/components/users/role-badge'

export const metadata = { title: 'Configuración — IL Stockroom' }

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight">Configuración</h1>
        <p className="text-xs text-muted-foreground mt-1">Tu perfil y preferencias de cuenta</p>
      </div>

      <div className="space-y-10">
        {/* Role info */}
        <div className="flex items-center gap-3 p-4 border border-border bg-muted">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Tu rol en el sistema
            </p>
            <RoleBadge role={user.role} />
          </div>
        </div>

        {/* Profile */}
        <section>
          <div className="mb-5 pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-widest">Perfil</h2>
          </div>
          <ProfileForm user={user} />
        </section>

        {/* Notifications */}
        <section>
          <div className="mb-5 pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-widest">Notificaciones</h2>
          </div>
          <NotificationPreferences user={user} />
        </section>

        {/* Password */}
        <section>
          <div className="mb-5 pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-widest">Contraseña</h2>
          </div>
          <ChangePasswordForm />
        </section>
      </div>
    </div>
  )
}
