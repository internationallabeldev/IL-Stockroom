import { ProvidersFiltersSkeleton } from '@/components/providers/providers-filters-skeleton'
import { ProvidersListSkeleton } from '@/components/providers/providers-list-skeleton'

// Loading automático de navegación de Next.js: se muestra mientras se navega
// HACIA /dashboard/providers (nivel adicional al Suspense interno de page.tsx).
export default function Loading() {
  return (
    <div className="px-8 pb-16">
      <ProvidersFiltersSkeleton />
      <ProvidersListSkeleton />
    </div>
  )
}
