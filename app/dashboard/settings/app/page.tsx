import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { getAppSettings } from '@/actions/app-settings.actions'
import { AppSettingsForm } from '@/components/settings/app/app-settings-form'

export const metadata = { title: 'Configuración del Sistema — IL Stockroom' }

export default async function AppSettingsPage() {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') redirect('/dashboard')

  const settings = await getAppSettings()
  if (!settings) redirect('/dashboard')

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-black uppercase tracking-tight">
          Configuración del Sistema
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Identidad de la empresa, documentos PDF, alertas y valores por defecto
        </p>
      </div>

      <AppSettingsForm settings={settings} />
    </div>
  )
}
