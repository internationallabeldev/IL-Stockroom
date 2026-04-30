import { getOrderWithReceipts } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect, notFound } from 'next/navigation'
import { OrderReceiptDetail } from '@/components/receipts/order-receipt-detail'

export const dynamic = 'force-dynamic'

export default async function OrderReceiptPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const id = parseInt(orderId)
  if (isNaN(id)) notFound()

  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canReceive = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canEdit    = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)

  const order = await getOrderWithReceipts(id)
  if (!order) notFound()

  return (
    <div className="p-8">
      <OrderReceiptDetail
        initialOrder={order}
        canReceive={canReceive}
        canEdit={canEdit}
      />
    </div>
  )
}
