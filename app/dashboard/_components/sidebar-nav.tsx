'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/actions/auth.actions'
import {
  LayoutDashboard, ShoppingCart, Package, ClipboardList, BarChart2,
  Truck, Droplet, FileText, BookOpen, ClipboardCheck,
  ChevronRight, LogOut,
  type LucideIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',           label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/dashboard/providers', label: 'Proveedores', icon: Truck },
  { href: '/dashboard/reports',   label: 'Reportes',   icon: BarChart2 },
]

const requisitionItems = [
  { href: '/dashboard/requisitions/inks',  label: 'Tintas', icon: Droplet  },
  { href: '/dashboard/requisitions/paper', label: 'Papel',  icon: FileText },
]

const inventoryItems = [
  { href: '/dashboard/inventory/inks',  label: 'Tintas', icon: Droplet  },
  { href: '/dashboard/inventory/paper', label: 'Papel',  icon: FileText },
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
  return <span className="font-mono text-xs tracking-wider">{h}:{m}:{s}</span>
}

type SubItem = { href: string; label: string; icon: LucideIcon }

function CollapsibleNavItem({
  label, icon: Icon, items, pathname, baseHref, expanded,
}: {
  label:     string
  icon:      LucideIcon
  items:     SubItem[]
  pathname:  string
  baseHref?: string
  expanded:  boolean
}) {
  const [open, setOpen] = useState(false)

  const isActive = baseHref
    ? pathname.startsWith(baseHref)
    : items.some(i => pathname.startsWith(i.href))

  if (!expanded) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex justify-center items-center h-10 w-full cursor-default select-none',
              isActive ? 'bg-[#1A1A1A] text-[#F5F2EA]' : 'text-[#1A1A1A]/60'
            )}>
              <Icon className="size-4 shrink-0" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      </li>
    )
  }

  return (
    <li onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <div className={cn(
        'flex items-center gap-4 px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-150 cursor-default select-none',
        isActive
          ? 'bg-[#1A1A1A] text-[#F5F2EA]'
          : 'text-[#1A1A1A]/60 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
      )}>
        <Icon className="size-3.75 shrink-0" />
        <span className="flex-1">{label}</span>
        <ChevronRight className={cn('size-3 shrink-0 transition-transform duration-200', open && 'rotate-90')} />
      </div>

      <div className={cn(
        'overflow-hidden transition-all duration-200',
        open ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
      )}>
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
  const [expanded, setExpanded] = useState(false)

  return (
    <TooltipProvider>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-[#E5E1D8] border-r border-[#1A1A1A]/15 flex flex-col pt-18 pb-8',
          'transition-[width] duration-300 ease-in-out overflow-x-hidden',
          expanded ? 'w-64' : 'w-16'
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className={cn(
          'shrink-0 border-b border-[#1A1A1A]/10',
          expanded ? 'px-6 py-5' : 'px-2 py-4 flex justify-center'
        )}>
          {expanded ? (
            <>
              <h2 className="font-heading text-base font-black uppercase tracking-tight whitespace-nowrap">
                Operaciones
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 mt-0.5 whitespace-nowrap">
                {userName ? userName.split('@')[0] : 'Sistema'} — Activo
              </p>
            </>
          ) : (
            <div className="size-8 bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <span className="font-heading text-[9px] font-black text-[#F5F2EA] tracking-tight">IL</span>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────────── */}
        <nav className="flex-1 pt-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          <ul>
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(href)

              if (!expanded) {
                return (
                  <li key={href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link
                          href={href}
                          className={cn(
                            'flex justify-center items-center h-10 w-full transition-colors duration-150',
                            isActive
                              ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                              : 'text-[#1A1A1A]/60 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right">{label}</TooltipContent>
                    </Tooltip>
                  </li>
                )
              }

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

            <CollapsibleNavItem label="Requisiciones" icon={ClipboardList}  items={requisitionItems} pathname={pathname} baseHref="/dashboard/requisitions" expanded={expanded} />
            <CollapsibleNavItem label="Inventario"   icon={Package}        items={inventoryItems}  pathname={pathname} baseHref="/dashboard/inventory"   expanded={expanded} />
            <CollapsibleNavItem label="Recepciones"  icon={ClipboardCheck} items={receiptItems}    pathname={pathname} baseHref="/dashboard/receipts"    expanded={expanded} />
            <CollapsibleNavItem label="Órdenes"      icon={ShoppingCart}   items={orderItems}      pathname={pathname} expanded={expanded} />
            <CollapsibleNavItem label="Catálogo"     icon={BookOpen}       items={catalogItems}    pathname={pathname} expanded={expanded} />
          </ul>
        </nav>

        {/* ── Bottom ──────────────────────────────────────────────────────────── */}
        <div className={cn(
          'shrink-0 pt-4 border-t border-[#1A1A1A]/10',
          expanded ? 'px-6 space-y-3' : 'px-2 space-y-1'
        )}>
          <div className={cn(
            'bg-[#1A1A1A] text-[#F5F2EA] px-3 py-2 flex items-center justify-between',
            !expanded && 'hidden'
          )}>
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">
              Uptime
            </p>
            <SystemUptime />
          </div>

          <form action={logoutAction}>
            {expanded ? (
              <button
                type="submit"
                className="w-full flex items-center gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:bg-[#D1CDC1] hover:text-[#1A1A1A] transition-colors"
              >
                <LogOut className="size-3.5 shrink-0" />
                Cerrar sesión
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    className="flex justify-center items-center h-10 w-full text-[#1A1A1A]/50 hover:bg-[#D1CDC1] hover:text-[#1A1A1A] transition-colors"
                  >
                    <LogOut className="size-4 shrink-0" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar sesión</TooltipContent>
              </Tooltip>
            )}
          </form>
        </div>
      </aside>
    </TooltipProvider>
  )
}
