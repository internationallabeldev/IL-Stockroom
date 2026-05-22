'use client'

import { useState } from 'react'
import { Bell, Droplet, FileText, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMaterial } from './material-context'
import { usePathname } from 'next/navigation'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { CommandPalette } from '@/components/search/command-palette'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { UserAvatar } from '@/components/shared/user-avatar'
import { SettingsDrawer } from '@/components/settings/settings-drawer'
import type { AppUser } from '@/actions/users.actions'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard/orders/ink':         'Órdenes de compra — Tintas',
  '/dashboard/orders/paper':       'Órdenes de compra — Papel',
  '/dashboard/requisitions':       'Requisiciones de producción',
  '/dashboard/requisitions/inks':  'Requisiciones — Tintas',
  '/dashboard/requisitions/paper': 'Requisiciones — Papel',
  '/dashboard/catalog/inks':       'Catálogo de Tintas',
  '/dashboard/catalog/papers':     'Catálogo de Papel',
  '/dashboard/providers':          'Proveedores',
  '/dashboard/inventory/inks':     'Inventario — Tintas',
  '/dashboard/inventory/paper':    'Inventario — Papel',
  '/dashboard/receipts/ink':       'Recepciones — Tintas',
  '/dashboard/receipts/paper':     'Recepciones — Papel',
  '/dashboard/users':              'Usuarios',
  '/dashboard/settings/app':       'Configuración del Sistema',
  '/dashboard/audit':              'Auditoría',
  '/dashboard/outputs/history':    'Salidas de material',
}

type ExtUser = AppUser & { nickname?: string | null }

export function TopNav({ user }: { user: AppUser }) {
  const u = user as ExtUser
  const { material, setMaterial } = useMaterial()
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] ?? null
  const showMaterialToggle = pathname !== '/dashboard/providers'
  const { isOpen, open, close } = useCommandPalette()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const displayName = u.nickname || user.first_name

  return (
    <>
    <CommandPalette isOpen={isOpen} onClose={close} />
    <SettingsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} user={user} />

    <header className="fixed top-0 z-50 h-16 w-full bg-background border-b border-border flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <span className="font-heading font-bold text-xl tracking-tighter select-none">
          IL - STOCKROOM
        </span>

        {pageTitle && (
          <>
            <div className="w-px h-5 bg-border" />
            <span className="text-sm text-foreground/60 tracking-tight">
              {pageTitle}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">

        {/* Material toggle */}
        {showMaterialToggle && <div className="flex h-8 bg-foreground/8 p-0.5">
          <button
            onClick={() => setMaterial('ink')}
            className={cn(
              'flex items-center gap-1.5 px-4 text-[9px] font-bold uppercase tracking-widest transition-all duration-150',
              material === 'ink'
                ? 'bg-foreground text-background'
                : 'text-foreground/50 hover:text-foreground'
            )}
          >
            <Droplet className="size-3" />
            Tinta
          </button>
          <button
            onClick={() => setMaterial('paper')}
            className={cn(
              'flex items-center gap-1.5 px-4 text-[9px] font-bold uppercase tracking-widest transition-all duration-150',
              material === 'paper'
                ? 'bg-foreground text-background'
                : 'text-foreground/50 hover:text-foreground'
            )}
          >
            <FileText className="size-3" />
            Papel
          </button>
        </div>}

        {/* Search trigger */}
        <button
          onClick={open}
          className="relative flex h-8 w-100 cursor-text items-center gap-2 border border-border bg-card pl-2.5 pr-2 text-left transition-colors hover:border-foreground/40"
        >
          <Search className="size-3.5 shrink-0 text-foreground/40" />
          <span className="flex-1 text-xs text-foreground/40">Buscar...</span>
          <kbd className="hidden shrink-0 rounded border border-border bg-foreground/6 px-1 py-0.5 text-[10px] font-medium text-foreground/40 sm:block">
            Ctrl K
          </kbd>
        </button>

        <div className="w-px h-5 bg-border" />

        <ThemeToggle />

        <button className="flex size-8 items-center justify-center hover:bg-muted transition-colors">
          <Bell className="size-4 text-foreground/60" />
        </button>

        {/* User section → opens SettingsDrawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 border-l border-border pl-3 hover:opacity-70 transition-opacity"
        >
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            avatarUrl={user.avatar_url}
            size="sm"
          />
          <span className="text-[10px] font-bold tracking-widest uppercase text-foreground">
            {displayName}
          </span>
        </button>
      </div>
    </header>
    </>
  )
}
