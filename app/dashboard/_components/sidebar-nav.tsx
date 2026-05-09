'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/actions/auth.actions'
import {
  LayoutDashboard, Package, ClipboardList,
  Truck, BookOpen, ClipboardCheck, ShoppingCart, LogOut,
  PackagePlus, Users, Settings, ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useMaterial, MATERIAL_ROUTES, getMaterialFromPath } from './material-context'
import { Separator } from '@/components/ui/separator'

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'PURCHASER' | 'PRODUCER' | 'USER'

type StaticItem = { kind: 'static'; href: string; label: string; icon: LucideIcon }
type MaterialItem = { kind: 'material'; base: string; label: string; icon: LucideIcon }
type AnyItem = StaticItem | MaterialItem

type NavSection = { label: string; items: AnyItem[] }

// ── Item definitions ──────────────────────────────────────────────────────────

const I = {
  dashboard: { kind: 'static' as const, href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  providers: { kind: 'static' as const, href: '/dashboard/providers', label: 'Proveedores', icon: Truck },
  users: { kind: 'static' as const, href: '/dashboard/users', label: 'Usuarios', icon: Users },
  settings: { kind: 'static' as const, href: '/dashboard/settings', label: 'Configuración', icon: Settings },
  audit: { kind: 'static' as const, href: '/dashboard/audit', label: 'Auditoría', icon: ShieldCheck },
  requisitions: { kind: 'material' as const, base: '/dashboard/requisitions', label: 'Requisiciones', icon: ClipboardList },
  inventory: { kind: 'material' as const, base: '/dashboard/inventory', label: 'Inventario', icon: Package },
  complement: { kind: 'material' as const, base: '/dashboard/complement', label: 'Complemento', icon: PackagePlus },
  receipts: { kind: 'material' as const, base: '/dashboard/receipts', label: 'Recepciones', icon: ClipboardCheck },
  orders: { kind: 'material' as const, base: '/dashboard/orders', label: 'Órdenes', icon: ShoppingCart },
  catalog: { kind: 'material' as const, base: '/dashboard/catalog', label: 'Catálogo', icon: BookOpen },
}

// ── Sections per role ─────────────────────────────────────────────────────────

const NAV_SECTIONS: Record<Role, NavSection[]> = {
  ADMIN: [
    { label: 'General', items: [I.dashboard, I.providers] },
    { label: 'Inventario', items: [I.inventory, I.complement, I.catalog] },
    { label: 'Flujo', items: [I.requisitions, I.receipts, I.orders] },
    { label: 'Sistema', items: [I.users, I.settings, I.audit] },
  ],
  WAREHOUSE_MANAGER: [
    { label: 'General', items: [I.dashboard] },
    { label: 'Inventario', items: [I.inventory, I.complement, I.catalog] },
    { label: 'Flujo', items: [I.requisitions, I.receipts] },
    { label: 'Sistema', items: [I.audit] },
  ],
  PURCHASER: [
    { label: 'General', items: [I.dashboard, I.providers] },
    { label: 'Compras', items: [I.orders, I.receipts] },
  ],
  PRODUCER: [
    { label: 'General', items: [I.dashboard] },
    { label: 'Operaciones', items: [I.requisitions, I.inventory] },
  ],
  USER: [
    { label: 'General', items: [I.dashboard] },
    { label: 'Consulta', items: [I.inventory] },
  ],
}

// ── Uptime ────────────────────────────────────────────────────────────────────

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

// ── Nav link ──────────────────────────────────────────────────────────────────

function NavLink({
  href, label, icon: Icon, isActive, expanded,
}: {
  href: string; label: string; icon: LucideIcon; isActive: boolean; expanded: boolean
}) {
  const cls = cn(
    'transition-colors duration-150',
    isActive
      ? 'bg-[#1A1A1A] text-[#F5F2EA]'
      : 'text-[#1A1A1A]/60 hover:bg-[#D1CDC1] hover:text-[#1A1A1A]'
  )

  if (!expanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} className={cn(cls, 'flex justify-center items-center h-10 w-full')}>
            <Icon className="size-4 shrink-0" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <Link href={href} className={cn(cls, 'flex items-center gap-4 px-6 py-2.5 text-[10px] font-bold uppercase tracking-widest')}>
      <Icon className="size-3.75 shrink-0" />
      {label}
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function SidebarNav({ role = 'USER' }: { role?: Role }) {
  const pathname = usePathname()
  const { material, setMaterial } = useMaterial()
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const fromPath = getMaterialFromPath(pathname)
    if (fromPath && fromPath !== material) setMaterial(fromPath)
  }, [pathname])

  const sections = NAV_SECTIONS[role]

  function resolveHref(item: AnyItem): string {
    return item.kind === 'static'
      ? item.href
      : MATERIAL_ROUTES[item.base][material]
  }

  function isActive(item: AnyItem): boolean {
    if (item.kind === 'static') {
      return item.href === '/dashboard'
        ? pathname === '/dashboard'
        : pathname.startsWith(item.href)
    }
    return pathname.startsWith(item.base)
  }

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
            <h2 className="font-heading text-base font-black uppercase tracking-tight whitespace-nowrap">
              Operaciones
            </h2>
          ) : (
            <div className="size-8 bg-[#1A1A1A] flex items-center justify-center shrink-0">
              <span className="font-heading text-[9px] font-black text-[#F5F2EA] tracking-tight">IL</span>
            </div>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────────── */}
        <nav className="flex-1 pt-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {sections.map((section, si) => (
            <div key={section.label}>
              {/* Section divider + label */}
              {si > 0 && <Separator className="my-2" />}

              <ul>
                {section.items.map(item => (
                  <li key={item.kind === 'static' ? item.href : item.base}>
                    <NavLink
                      href={resolveHref(item)}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive(item)}
                      expanded={expanded}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
            <p className="text-[8px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">Uptime</p>
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
