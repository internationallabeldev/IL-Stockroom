import { getProviders } from '@/actions/providers.actions'
import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { ProvidersList } from '@/components/providers/providers-list'

export default async function ProvidersPage() {
  const [providers, orders, user] = await Promise.all([
    getProviders(),
    getPurchaseOrders(),
    getSessionUser(),
  ])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return (
    <div className="px-8 pb-8">
      <ProvidersList providers={providers} orders={orders} canEdit={canEdit} />
    </div>
  )
}
