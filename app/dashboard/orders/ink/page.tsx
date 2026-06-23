import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getProviders } from '@/actions/providers.actions'
import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { getPublicSettings } from '@/actions/app-settings.actions'
import { OrdersList } from '@/components/orders/orders-list'

export default async function InkOrdersPage() {
  const [orders, providers, inkCatalog, paperCatalog, user, settings] = await Promise.all([
    getPurchaseOrders({ material_type: 'INK' }),
    getProviders(),
    getInkCatalog(),
    getPaperCatalog(),
    getSessionUser(),
    getPublicSettings(),
  ])

  const canCreate  = user?.role === 'ADMIN' || user?.role === 'PURCHASER'
  const canReceive = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pb-8">
      <OrdersList
        initialOrders={orders}
        materialType="INK"
        providers={providers}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        canCreate={canCreate}
        canReceive={canReceive}
        companyAddress={settings.company.address}
      />
    </div>
  )
}
