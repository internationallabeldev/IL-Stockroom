'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/actions/auth.actions'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  BarChart2,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',                label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/orders',         label: 'Órdenes',       icon: ShoppingCart },
  { href: '/dashboard/inventory',      label: 'Inventario',    icon: Package },
  { href: '/dashboard/requisitions',   label: 'Requisiciones', icon: ClipboardList },
  { href: '/dashboard/reports',        label: 'Reportes',      icon: BarChart2 },
]

function SystemUptime() {
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])

  const h = String(Math.floor(secs / 3600)).padStart(3, '0')
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, '0')
  const s = String(secs % 60).padStart(2, '0')

  return <span className="font-mono text-lg tracking-wider">{h}:{m}:{s}</span>
}

export function SidebarNav({ userName }: { userName?: string | null }) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#E5E1D8] border-r border-[#1A1A1A]/15 flex flex-col pt-18 pb-8">
      <div className="px-6 py-5 border-b border-[#1A1A1A]/10">
        <h2 className="font-heading text-base font-black uppercase tracking-tight">
          Operaciones
        </h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 mt-0.5">
          {userName ? userName.split('@')[0] : 'Sistema'} — Activo
        </p>
      </div>

      <nav className="flex-1 pt-2">
        <ul>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href)

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-150',
                    isActive
                      ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                      : 'text-[#1A1A1A]/60 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
                  )}
                >
                  <Icon className="size-3.75 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="px-6 pt-6 border-t border-[#1A1A1A]/10 space-y-3">
        <div className="bg-[#1A1A1A] text-[#F5F2EA] p-4 text-center">
          <p className="text-[9px] font-bold uppercase tracking-widest text-[#F5F2EA]/50 mb-1.5">
            Uptime del sistema
          </p>
          <SystemUptime />
        </div>

        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:bg-[#D1CDC1] hover:text-[#1A1A1A] transition-colors"
          >
            <LogOut className="size-3.5 shrink-0" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
