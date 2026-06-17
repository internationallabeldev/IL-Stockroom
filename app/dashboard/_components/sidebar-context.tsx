'use client'

import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  // El espacio dual oculta el sidebar, así que el contenido va a ancho completo.
  const fullWidth = usePathname() === '/dashboard/workspace'
  return (
    <main className={cn('surface-recessed pt-16 min-h-screen pb-10', fullWidth ? 'ml-0' : 'ml-16')}>
      <div className="relative">
        {children}
      </div>
    </main>
  )
}
