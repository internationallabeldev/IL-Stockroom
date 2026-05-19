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
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -mb-10">
      <AppSettingsForm settings={settings} />
    </div>
  )
}
