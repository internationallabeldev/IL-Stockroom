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
    <div className="px-8 pt-6 pb-8">
      <header className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-[#1A1A1A]">
          Órdenes de compra — Papel
        </h1>
        <p className="text-sm text-[#5f5e59] mt-0.5">
          {orders.length} orden{orders.length !== 1 ? 'es' : ''} registrada{orders.length !== 1 ? 's' : ''}
        </p>
      </header>

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
