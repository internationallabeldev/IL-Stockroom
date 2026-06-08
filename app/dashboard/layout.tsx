import { redirect } from 'next/navigation'
import { getSessionUser } from '@/actions/auth.actions'
import { getPublicSettings } from '@/actions/app-settings.actions'
import { TopNav } from './_components/top-nav'
import { SidebarNav } from './_components/sidebar-nav'
import { StatusBar } from './_components/status-bar'
import { SidebarProvider, DashboardShell } from './_components/sidebar-context'
import { MaterialProvider } from './_components/material-context'
import { ChatWidget } from '@/components/chat/chat-widget'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const settings = await getPublicSettings()

  return (
    <MaterialProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-background">
          <TopNav user={user} />
          <SidebarNav user={user} companyName={settings.company.name} />
          <DashboardShell>{children}</DashboardShell>
          <StatusBar />
          <ChatWidget userId={user.id} userRole={user.role} />
        </div>
      </SidebarProvider>
    </MaterialProvider>
  )
}
