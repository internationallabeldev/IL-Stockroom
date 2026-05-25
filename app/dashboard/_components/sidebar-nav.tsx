'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/actions/auth.actions'
import {
  LayoutDashboard, Package, ClipboardList,
  Truck, BookOpen, ClipboardCheck, ShoppingCart, LogOut,
  PackagePlus, Users, Settings, ShieldCheck, History,
  type LucideIcon,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useMaterial, MATERIAL_ROUTES, getMaterialFromPath } from './material-context'
import { Separator } from '@/components/ui/separator'
import type { AppUser } from '@/actions/users.actions'

// ── Types ─────────────────────────────────────────────────────────────────────

type Role = 'ADMIN' | 'WAREHOUSE_MANAGER' | 'PURCHASER' | 'PRODUCER' | 'USER'

type StaticItem = { kind: 'static'; href: string; label: string; icon: LucideIcon }
type MaterialItem = { kind: 'material'; base: string; label: string; icon: LucideIcon }
type AnyItem = StaticItem | MaterialItem

type NavSection = { label: string; items: AnyItem[] }

// ── Item definitions ──────────────────────────────────────────────────────────

const I = {
  dashboard:      { kind: 'static'   as const, href: '/dashboard',              label: 'Dashboard',    icon: LayoutDashboard },
  providers:      { kind: 'static'   as const, href: '/dashboard/providers',    label: 'Proveedores',  icon: Truck           },
  users:          { kind: 'static'   as const, href: '/dashboard/users',        label: 'Usuarios',     icon: Users           },
  appSettings:    { kind: 'static'   as const, href: '/dashboard/settings/app', label: 'Configuración', icon: Settings },
  audit:          { kind: 'static'   as const, href: '/dashboard/audit',        label: 'Auditoría',    icon: ShieldCheck     },
  requisitions:   { kind: 'material' as const, base: '/dashboard/requisitions', label: 'Requisiciones',icon: ClipboardList   },
  inventory:      { kind: 'material' as const, base: '/dashboard/inventory',    label: 'Inventario',   icon: Package         },
  complement:     { kind: 'material' as const, base: '/dashboard/complement',   label: 'Complemento',  icon: PackagePlus     },
  receipts:       { kind: 'material' as const, base: '/dashboard/receipts',     label: 'Recepciones',  icon: ClipboardCheck  },
  orders:         { kind: 'material' as const, base: '/dashboard/orders',       label: 'Órdenes',      icon: ShoppingCart    },
  catalog:        { kind: 'material' as const, base: '/dashboard/catalog',      label: 'Catálogo',     icon: BookOpen        },
  outputsHistory: { kind: 'static'   as const, href: '/dashboard/outputs/history', label: 'Salidas',   icon: History         },
}

// ── Sections per role ─────────────────────────────────────────────────────────

const NAV_SECTIONS: Record<Role, NavSection[]> = {
  // Flujo completo: Proveedores → Catálogo → Órdenes → Recepciones → Inventario → Complemento → Requisiciones → Salidas
  ADMIN: [
    { label: 'General',  items: [I.dashboard] },
    { label: 'Flujo',    items: [I.providers, I.catalog, I.orders, I.receipts, I.inventory, I.requisitions, I.outputsHistory, I.complement] },
    { label: 'Sistema',  items: [I.users, I.appSettings, I.audit] },
  ],
  // Lado almacén: desde que llega el material hasta que sale
  WAREHOUSE_MANAGER: [
    { label: 'General',  items: [I.dashboard] },
    { label: 'Flujo',    items: [I.catalog, I.receipts, I.inventory, I.requisitions, I.outputsHistory, I.complement] },
    { label: 'Sistema',  items: [I.audit] },
  ],
  // Lado compras: desde el proveedor hasta la recepción
  PURCHASER: [
    { label: 'General',  items: [I.dashboard] },
    { label: 'Compras',  items: [I.providers, I.catalog, I.orders, I.receipts] },
  ],
  // Lado producción: consulta inventario, hace requisición, ve sus salidas
  PRODUCER: [
    { label: 'General',      items: [I.dashboard] },
    { label: 'Producción',   items: [I.inventory, I.requisitions, I.outputsHistory] },
  ],
  USER: [
    { label: 'General',  items: [I.dashboard] },
    { label: 'Consulta', items: [I.inventory] },
  ],
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
      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
      : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
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
      <Icon className="size-4.5 shrink-0" />
      {label}
    </Link>
  )
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function SidebarNav({ user, companyName }: { user: AppUser; companyName?: string }) {
  const role = user.role as Role
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
          'fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border flex flex-col pt-18 pb-8',
          'transition-[width] duration-300 ease-in-out overflow-x-hidden',
          expanded ? 'w-64' : 'w-16'
        )}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >

        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <div className={cn(
          'shrink-0 border-b border-sidebar-border',
          expanded ? 'px-6 py-5' : 'px-2 py-4 flex justify-center'
        )}>
          {expanded ? (
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50 whitespace-nowrap truncate">
              {companyName ?? 'Operaciones'}
            </h2>
          ) : (
            <>
              <Image src="/logo.svg" alt="IL" width={32} height={32} className="shrink-0 dark:hidden" />
              <Image src="/LogoDark.svg" alt="IL" width={32} height={32} className="shrink-0 hidden dark:block" />
            </>
          )}
        </div>

        {/* ── Navigation ──────────────────────────────────────────────────────── */}
        <nav className="flex-1 pt-2 overflow-y-auto overflow-x-hidden no-scrollbar">
          {sections.map((section, si) => (
            <div key={section.label}>
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
          'shrink-0 pt-4 border-t border-sidebar-border',
          expanded ? 'px-6' : 'px-2'
        )}>
          <form action={logoutAction}>
            {expanded ? (
              <button
                type="submit"
                className="w-full flex items-center gap-2 px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <LogOut className="size-3 shrink-0" />
                Cerrar sesión
              </button>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="submit"
                    className="flex justify-center items-center h-8 w-full text-sidebar-foreground/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  >
                    <LogOut className="size-3 shrink-0" />
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
