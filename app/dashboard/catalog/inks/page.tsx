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
    <div className="px-8 pb-8">
      <InkCatalogList items={items} providers={providers} canEdit={canEdit} />
    </div>
  )
}
