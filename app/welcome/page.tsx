import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { getWelcomeData } from '@/actions/onboarding.actions'
import { WelcomeExperience } from '@/components/welcome/welcome-experience'

export const metadata = { title: 'Bienvenido — IL Stockroom' }

export default async function WelcomePage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const data = await getWelcomeData()
  if (!data) redirect('/dashboard')

  return <WelcomeExperience data={data} />
}
