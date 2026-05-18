import { notFound } from 'next/navigation'
import { getPurchaseOrderById } from '@/actions/purchase-orders.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { getPublicSettings } from '@/actions/app-settings.actions'
import { fetchLogoAsBase64 } from '@/lib/utils/fetch-logo-base64'
import { OrderDetail } from '@/components/orders/order-detail'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, user, settings] = await Promise.all([
    getPurchaseOrderById(Number(id)),
    getSessionUser(),
    getPublicSettings(),
  ])

  if (!order) notFound()

  const canEdit    = user?.role === 'ADMIN' || user?.role === 'PURCHASER'
  const logoBase64 = settings.company.logo_url
    ? await fetchLogoAsBase64(settings.company.logo_url)
    : null

  return (
    <div className="px-8 pt-8 pb-16">
      <OrderDetail order={order} canEdit={canEdit} settings={settings} logoBase64={logoBase64} />
    </div>
  )
}
