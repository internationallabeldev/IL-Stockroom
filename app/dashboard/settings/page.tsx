import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'

export default async function SettingsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  // Profile & account settings live in the avatar drawer (top nav).
  // ADMIN system config lives at /dashboard/settings/app.
  if (user.role === 'ADMIN') redirect('/dashboard/settings/app')
  redirect('/dashboard')
}
