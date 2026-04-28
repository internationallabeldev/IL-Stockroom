import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { getProviders } from '@/actions/providers.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { PaperCatalogList } from '@/components/catalog/papers/paper-catalog-list'

export default async function PaperCatalogPage() {
  const [items, providers, user] = await Promise.all([
    getPaperCatalog(),
    getProviders(),
    getSessionUser(),
  ])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pt-8 pb-16">
      <header className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#1A1A1A]">
          Catálogo de Papel
        </h1>
        <p className="text-lg text-[#5f5e59] mt-1">
          {items.length} papel{items.length !== 1 ? 'es' : ''} registrado{items.length !== 1 ? 's' : ''}
        </p>
      </header>

      <PaperCatalogList items={items} providers={providers} canEdit={canEdit} />
    </div>
  )
}
