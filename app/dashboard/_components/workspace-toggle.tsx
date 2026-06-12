'use client'

import { Columns2, Square } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

const WORKSPACE_PATH = '/dashboard/workspace'
const RETURN_KEY = 'workspace-return-path'

// Toggle estilo "negrita de Word": un solo botón que se queda presionado mientras
// estás en el espacio dual. Al activarlo recuerda de dónde venías para devolverte
// ahí al desactivarlo. El icono cambia según el estado (un panel ↔ dos columnas).
export function WorkspaceToggle() {
  const pathname = usePathname()
  const router   = useRouter()
  const active   = pathname === WORKSPACE_PATH
  const Icon     = active ? Columns2 : Square

  function toggle() {
    if (active) {
      const back = sessionStorage.getItem(RETURN_KEY) || '/dashboard'
      router.push(back)
    } else {
      sessionStorage.setItem(RETURN_KEY, pathname)
      router.push(WORKSPACE_PATH)
    }
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggle}
            aria-pressed={active}
            aria-label="Espacio dual"
            className={cn(
              'flex size-8 items-center justify-center transition-colors',
              active
                ? 'bg-foreground text-background'
                : 'text-foreground/60 hover:bg-[#E5E1D8] dark:hover:bg-white/10',
            )}
          >
            <Icon className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-56 items-stretch py-2">
          <div className="w-full">
            <p className="text-[10px] font-bold uppercase tracking-widest">
              Espacio dual {active && <span className="text-background/60">· activo</span>}
            </p>
            <p className="mt-1 text-[11px] leading-snug text-background/70">
              Abre dos vistas lado a lado para comparar o trabajar en paralelo.
              {active
                ? ' Vuelve a tu pantalla anterior al desactivarlo.'
                : ' Oculta el menú lateral para aprovechar todo el ancho.'}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
