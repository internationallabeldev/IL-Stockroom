'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Bell, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard',              label: 'Dashboard' },
  { href: '/dashboard/orders',       label: 'Órdenes' },
  { href: '/dashboard/inventory',    label: 'Inventario' },
  { href: '/dashboard/requisitions', label: 'Requisiciones' },
]

export function TopNav({ userName }: { userName: string }) {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 z-50 h-16 w-full bg-[#F5F2EA] border-b border-[#1A1A1A]/15 flex items-center justify-between px-8">
      <div className="flex items-center gap-8">
        <span className="font-heading font-bold text-xl tracking-tighter select-none">
          IL_STOCKROOM
        </span>
        <nav className="hidden md:flex gap-6">
          {navLinks.map(({ href, label }) => {
            const isActive =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'font-heading text-base tracking-tight transition-colors duration-75',
                  isActive
                    ? 'border-b-2 border-[#1A1A1A] text-[#1A1A1A]'
                    : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/40" />
          <input
            type="search"
            placeholder="Buscar operaciones..."
            className="h-8 w-56 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-8 pr-3 text-xs outline-none transition-colors focus:border-[#1A1A1A]/40 placeholder:text-[#1A1A1A]/40"
          />
        </div>
        <button className="flex size-8 items-center justify-center hover:bg-[#E5E1D8] transition-colors">
          <Bell className="size-4 text-[#1A1A1A]/60" />
        </button>
        <div className="flex items-center gap-2 border-l border-[#1A1A1A]/15 pl-3">
          <User className="size-4 text-[#1A1A1A]/70" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-[#1A1A1A]">
            {userName}
          </span>
        </div>
      </div>
    </header>
  )
}
