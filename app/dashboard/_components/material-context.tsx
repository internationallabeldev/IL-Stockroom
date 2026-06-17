'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export type Material = 'ink' | 'paper'

export const MATERIAL_ROUTES: Record<string, Record<Material, string>> = {
  '/dashboard/requisitions': { ink: '/dashboard/requisitions/inks',  paper: '/dashboard/requisitions/paper'  },
  '/dashboard/inventory':    { ink: '/dashboard/inventory/inks',     paper: '/dashboard/inventory/paper'     },
  '/dashboard/receipts':     { ink: '/dashboard/receipts/ink',       paper: '/dashboard/receipts/paper'      },
  '/dashboard/orders':       { ink: '/dashboard/orders/ink',         paper: '/dashboard/orders/paper'        },
  '/dashboard/catalog':      { ink: '/dashboard/catalog/inks',       paper: '/dashboard/catalog/papers'      },
}

export function getMaterialFromPath(pathname: string): Material | null {
  for (const routes of Object.values(MATERIAL_ROUTES)) {
    if (pathname.startsWith(routes.ink))   return 'ink'
    if (pathname.startsWith(routes.paper)) return 'paper'
  }
  return null
}

export function getBaseFromPath(pathname: string): string | null {
  for (const base of Object.keys(MATERIAL_ROUTES)) {
    if (pathname.startsWith(base)) return base
  }
  return null
}

type MaterialContextValue = {
  material:    Material
  setMaterial: (m: Material) => void
}

const MaterialContext = createContext<MaterialContextValue>({
  material:    'ink',
  setMaterial: () => {},
})

export function MaterialProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [material, setMaterialState] = useState<Material>('ink')

  useEffect(() => {
    const fromPath = getMaterialFromPath(pathname)
    if (fromPath) setMaterialState(fromPath)
  }, [pathname])

  function setMaterial(next: Material) {
    setMaterialState(next)
    const base = getBaseFromPath(pathname)
    if (base) router.push(MATERIAL_ROUTES[base][next])
  }

  return (
    <MaterialContext.Provider value={{ material, setMaterial }}>
      {children}
    </MaterialContext.Provider>
  )
}

export function useMaterial() {
  return useContext(MaterialContext)
}
