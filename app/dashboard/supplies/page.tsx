import { getSupplyCategories } from '@/actions/supplies.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { SuppliesView } from '@/components/supplies/supplies-view'

export default async function SuppliesPage() {
  const [categories, user] = await Promise.all([
    getSupplyCategories(),
    getSessionUser(),
  ])

  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pb-8">
      <SuppliesView categories={categories} canEdit={canEdit} />
    </div>
  )
}
