import { notFound, redirect } from 'next/navigation'
import { getPurchaseOrderById } from '@/actions/purchase-orders.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { getInkCatalog } from '@/actions/ink-catalog.actions'
import { getPaperCatalog } from '@/actions/paper-catalog.actions'
import { OrderEditForm } from '@/components/orders/order-edit-form'

export default async function OrderEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, user, inkCatalog, paperCatalog] = await Promise.all([
    getPurchaseOrderById(Number(id)),
    getSessionUser(),
    getInkCatalog(),
    getPaperCatalog(),
  ])

  if (!order) notFound()

  const canEdit = user?.role === 'ADMIN' || user?.role === 'PURCHASER'
  if (!canEdit || order.status !== 'PENDING') redirect(`/dashboard/orders/${id}`)

  return (
    <div className="px-8 pt-8 pb-16">
      <OrderEditForm order={order} inkCatalog={inkCatalog} paperCatalog={paperCatalog} />
    </div>
  )
}
