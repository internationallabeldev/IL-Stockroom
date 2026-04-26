import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { TopNav } from './_components/top-nav'
import { SidebarNav } from './_components/sidebar-nav'
import { StatusBar } from './_components/status-bar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const displayName = user.email ?? 'Operador'

  return (
    <div className="min-h-screen bg-[#F5F2EA]">
      <TopNav userName={displayName} />
      <SidebarNav userName={displayName} />
      <main className="ml-64 pt-16 min-h-screen pb-10">
        {children}
      </main>
      <StatusBar />
    </div>
  )
}
