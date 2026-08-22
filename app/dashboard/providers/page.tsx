import { Suspense } from 'react'
import { ProvidersListServer } from '@/components/providers/providers-list-server'
import { ProvidersFiltersSkeleton } from '@/components/providers/providers-filters-skeleton'
import { ProvidersListSkeleton } from '@/components/providers/providers-list-skeleton'

// El fetch vive ahora en ProvidersListServer para que el Suspense boundary
// pueda mostrar los skeletons temáticos mientras resuelve. Un solo boundary:
// la barra de filtros vive dentro de ProvidersList y depende de los mismos
// datos, así que no se puede suspender por separado.
export default function ProvidersPage() {
  return (
    <div className="px-8 pb-16">
      <Suspense
        fallback={
          <>
            <ProvidersFiltersSkeleton />
            <ProvidersListSkeleton />
          </>
        }
      >
        <ProvidersListServer />
      </Suspense>
    </div>
  )
}
