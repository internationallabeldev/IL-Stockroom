import { getProviders } from '@/actions/providers.actions'
import { getPurchaseOrders } from '@/actions/purchase-orders.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { ProvidersList } from './providers-list'

/**
 * Componente async aislado para el límite de Suspense de la página de
 * proveedores. Hace el mismo fetch que hacía page.tsx y, mientras resuelve, el
 * boundary muestra los skeletons temáticos. La lógica de ProvidersList no se
 * toca: solo se movió el fetch aquí para que Suspense pueda suspender sobre él.
 */
export async function ProvidersListServer() {
  const [providers, orders, user] = await Promise.all([
    getProviders(),
    getPurchaseOrders(),
    getSessionUser(),
  ])
  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return <ProvidersList providers={providers} orders={orders} canEdit={canEdit} />
}
