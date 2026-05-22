import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getProviders } from '@/actions/providers.actions'
import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { OrdersList } from '@/components/orders/orders-list'

export default async function PaperOrdersPage() {
  const [orders, providers, inkCatalog, paperCatalog, user] = await Promise.all([
    getPurchaseOrders({ material_type: 'PAPER' }),
    getProviders(),
    getInkCatalog(),
    getPaperCatalog(),
    getSessionUser(),
  ])

  const canCreate  = user?.role === 'ADMIN' || user?.role === 'PURCHASER'
  const canReceive = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pb-8">
      <OrdersList
        initialOrders={orders}
        materialType="PAPER"
        providers={providers}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        canCreate={canCreate}
        canReceive={canReceive}
      />
    </div>
  )
}
