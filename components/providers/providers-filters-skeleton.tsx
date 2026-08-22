import { CmykSkeleton } from '@/components/ui/cmyk-skeleton'

/**
 * Replica la barra de búsqueda + filtros de ProvidersList mientras carga:
 * input de búsqueda (shimmer), píldoras del filtro de tipo (pulse-cmyk),
 * control "por página", botón "nuevo" y la línea de estadísticas.
 */
export function ProvidersFiltersSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando filtros de proveedores"
      className="border-b border-border mb-6"
    >
      <div className="@container">
        <div className="py-3 flex flex-col @2xl:flex-row @2xl:flex-wrap @2xl:justify-between @2xl:items-center gap-3">
          {/* Búsqueda */}
          <CmykSkeleton className="h-8 w-full @2xl:w-100" />

          <div className="flex flex-row flex-wrap items-center gap-2">
            {/* Píldoras del filtro de tipo */}
            <div className="flex gap-0.5 bg-black/4 dark:bg-black/25 p-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <CmykSkeleton key={i} variant="pulse-cmyk" className="h-7 w-16" />
              ))}
            </div>
            {/* Por página */}
            <CmykSkeleton className="h-8 w-28" />
            {/* Nuevo proveedor */}
            <CmykSkeleton className="h-8 w-36" />
          </div>
        </div>

        {/* Línea de estadísticas */}
        <div className="py-3 flex flex-wrap gap-x-6 gap-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CmykSkeleton key={i} variant="pulse-cmyk" className="h-3 w-24" />
          ))}
        </div>
      </div>
    </div>
  )
}
