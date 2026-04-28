import { notFound } from 'next/navigation'
import { getPurchaseOrderById } from '@/actions/purchase-orders.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { OrderDetail } from '@/components/orders/order-detail'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, user] = await Promise.all([
    getPurchaseOrderById(Number(id)),
    getSessionUser(),
  ])

  if (!order) notFound()

  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'

  return (
    <div className="px-8 pt-8 pb-16">
      <OrderDetail order={order} canEdit={canEdit} />
    </div>
  )
}
