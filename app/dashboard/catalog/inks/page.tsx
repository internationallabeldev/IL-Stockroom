import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getProviders } from '@/actions/providers.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { InkCatalogList } from '@/components/catalog/inks/ink-catalog-list'

export default async function InkCatalogPage() {
  const [items, providers, user] = await Promise.all([
    getInkCatalog(),
    getProviders(),
    getSessionUser(),
  ])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pt-8 pb-16">
      <header className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#1A1A1A]">
          Catálogo de Tintas
        </h1>
        <p className="text-lg text-[#5f5e59] mt-1">
          {items.length} tinta{items.length !== 1 ? 's' : ''} registrada{items.length !== 1 ? 's' : ''}
        </p>
      </header>

      <InkCatalogList items={items} providers={providers} canEdit={canEdit} />
    </div>
  )
}
