'use client'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="ml-16 pt-16 min-h-screen pb-10">
      <div className="relative">
        {children}
      </div>
    </main>
  )
}
