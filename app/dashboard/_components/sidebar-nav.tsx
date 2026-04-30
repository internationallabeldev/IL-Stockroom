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
  Truck,
  Droplet,
  FileText,
  BookOpen,
  ClipboardCheck,
  ChevronRight,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/dashboard/inventory',    label: 'Inventario',    icon: Package },
  { href: '/dashboard/requisitions', label: 'Requisiciones', icon: ClipboardList },
  { href: '/dashboard/providers',    label: 'Proveedores',   icon: Truck },
  { href: '/dashboard/reports',      label: 'Reportes',      icon: BarChart2 },
]

const receiptItems = [
  { href: '/dashboard/receipts/ink',   label: 'Tintas', icon: Droplet },
  { href: '/dashboard/receipts/paper', label: 'Papel',  icon: FileText },
]

const orderItems = [
  { href: '/dashboard/orders/ink',   label: 'Tintas', icon: Droplet },
  { href: '/dashboard/orders/paper', label: 'Papel',  icon: FileText },
]

const catalogItems = [
  { href: '/dashboard/catalog/inks',   label: 'Tintas', icon: Droplet },
  { href: '/dashboard/catalog/papers', label: 'Papel',  icon: FileText },
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

type SubItem = { href: string; label: string; icon: LucideIcon }

function CollapsibleNavItem({
  label,
  icon: Icon,
  items,
  pathname,
  baseHref,
}: {
  label: string
  icon: LucideIcon
  items: SubItem[]
  pathname: string
  baseHref?: string
}) {
  const [open, setOpen] = useState(false)
  const isActive = baseHref
    ? pathname.startsWith(baseHref)
    : items.some(i => pathname.startsWith(i.href))

  return (
    <li
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className={cn(
          'flex items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 cursor-default select-none',
          isActive
            ? 'bg-[#1A1A1A] text-[#F5F2EA]'
            : 'text-[#1A1A1A]/60 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
        )}
      >
        <Icon className="size-3.75 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronRight
          className={cn(
            'size-3 shrink-0 transition-transform duration-200',
            open && 'rotate-90'
          )}
        />
      </div>

      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          open ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <ul className="border-l-2 border-[#1A1A1A]/15 ml-6">
          {items.map(({ href, label: subLabel, icon: SubIcon }) => {
            const isSubActive = pathname.startsWith(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all duration-150',
                    isSubActive
                      ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                      : 'text-[#1A1A1A]/55 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
                  )}
                >
                  <SubIcon className="size-3.5 shrink-0" />
                  {subLabel}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </li>
  )
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

          <CollapsibleNavItem
            label="Recepciones"
            icon={ClipboardCheck}
            items={receiptItems}
            pathname={pathname}
            baseHref="/dashboard/receipts"
          />

          <CollapsibleNavItem
            label="Órdenes"
            icon={ShoppingCart}
            items={orderItems}
            pathname={pathname}
          />

          <CollapsibleNavItem
            label="Catálogo"
            icon={BookOpen}
            items={catalogItems}
            pathname={pathname}
          />
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
