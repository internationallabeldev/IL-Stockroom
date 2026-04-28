import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getProviders } from '@/actions/providers.actions'
import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { OrdersList } from '@/components/orders/orders-list'

export default async function InkOrdersPage() {
  const [orders, providers, inkCatalog, paperCatalog, user] = await Promise.all([
    getPurchaseOrders({ material_type: 'INK' }),
    getProviders(),
    getInkCatalog(),
    getPaperCatalog(),
    getSessionUser(),
  ])

  const canCreate = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return (
    <div className="px-8 pt-8 pb-16">
      <header className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#1A1A1A]">
          Órdenes de compra — Tintas
        </h1>
        <p className="text-lg text-[#5f5e59] mt-1">
          {orders.length} orden{orders.length !== 1 ? 'es' : ''} registrada{orders.length !== 1 ? 's' : ''}
        </p>
      </header>

      <OrdersList
        initialOrders={orders}
        materialType="INK"
        providers={providers}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        canCreate={canCreate}
      />
    </div>
  )
}
