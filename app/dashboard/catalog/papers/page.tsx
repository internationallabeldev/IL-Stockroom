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
      <PaperCatalogList items={items} providers={providers} canEdit={canEdit} />
    </div>
  )
}
