import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { TopNav } from './_components/top-nav'
import { SidebarNav } from './_components/sidebar-nav'
import { StatusBar } from './_components/status-bar'
import { SidebarProvider, DashboardShell } from './_components/sidebar-context'
import { MaterialProvider } from './_components/material-context'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const displayName = user.email ?? 'Operador'

  return (
    <MaterialProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-[#F5F2EA]">
          <TopNav userName={displayName} />
          <SidebarNav role={user.role} />
          <DashboardShell>{children}</DashboardShell>
          <StatusBar />
        </div>
      </SidebarProvider>
    </MaterialProvider>
  )
}
