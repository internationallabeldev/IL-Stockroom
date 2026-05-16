'use client'

import { Bell, User, Droplet, FileText, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMaterial } from './material-context'
import { usePathname } from 'next/navigation'
import { useCommandPalette } from '@/hooks/use-command-palette'
import { CommandPalette } from '@/components/search/command-palette'

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
  '/dashboard/settings':           'Configuración',
  '/dashboard/audit':              'Auditoría',
  '/dashboard/historial-salidas':  'Salidas de material',
}

export function TopNav({ userName }: { userName: string }) {
  const { material, setMaterial } = useMaterial()
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] ?? null
  const showMaterialToggle = pathname !== '/dashboard/providers'
  const { isOpen, open, close } = useCommandPalette()

  return (
    <>
    <CommandPalette isOpen={isOpen} onClose={close} />
    <header className="fixed top-0 z-50 h-16 w-full bg-[#F5F2EA] border-b border-[#1A1A1A]/15 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
        <span className="font-heading font-bold text-xl tracking-tighter select-none">
          IL - STOCKROOM
        </span>

        {pageTitle && (
          <>
            <div className="w-px h-5 bg-[#1A1A1A]/15" />
            <span className="text-sm text-[#1A1A1A]/60 tracking-tight">
              {pageTitle}
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">

        {/* Material toggle */}
        {showMaterialToggle && <div className="flex h-8 bg-[#1A1A1A]/8 p-0.5">
          <button
            onClick={() => setMaterial('ink')}
            className={cn(
              'flex items-center gap-1.5 px-4 text-[9px] font-bold uppercase tracking-widest transition-all duration-150',
              material === 'ink'
                ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
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
                ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                : 'text-[#1A1A1A]/50 hover:text-[#1A1A1A]'
            )}
          >
            <FileText className="size-3" />
            Papel
          </button>
        </div>}

        {/* Search trigger */}
        <button
          onClick={open}
          className="relative flex h-8 w-56 cursor-text items-center gap-2 border border-[#1A1A1A]/20 bg-[#fdf9f0] pl-2.5 pr-2 text-left transition-colors hover:border-[#1A1A1A]/40"
        >
          <Search className="size-3.5 shrink-0 text-[#1A1A1A]/40" />
          <span className="flex-1 text-xs text-[#1A1A1A]/40">Buscar...</span>
          <kbd className="hidden shrink-0 rounded border border-[#1A1A1A]/15 bg-[#1A1A1A]/6 px-1 py-0.5 text-[10px] font-medium text-[#1A1A1A]/40 sm:block">
            Ctrl K
          </kbd>
        </button>

        <div className="w-px h-5 bg-[#1A1A1A]/15" />

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
    </>
  )
}
