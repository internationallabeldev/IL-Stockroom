'use client'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="ml-16 pt-16 min-h-screen pb-10">
      {/* position: relative sin overflow para que NextStepJS calcule coords correctamente con scroll */}
      <div id="dashboard-viewport" className="relative">
        {children}
      </div>
    </main>
  )
}
