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
    <div className="px-8 pt-6 pb-8">
      <header className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-[#1A1A1A]">
          Catálogo de Papel
        </h1>
        <p className="text-sm text-[#5f5e59] mt-0.5">
          {items.length} papel{items.length !== 1 ? 'es' : ''} registrado{items.length !== 1 ? 's' : ''}
        </p>
      </header>

      <PaperCatalogList items={items} providers={providers} canEdit={canEdit} />
    </div>
  )
}
