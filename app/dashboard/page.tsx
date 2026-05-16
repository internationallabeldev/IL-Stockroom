import { getSessionUser } from '@/actions/auth.actions'
import { AdminDashboard }     from '@/components/dashboard/admin-dashboard'
import { PurchaserDashboard } from '@/components/dashboard/purchaser-dashboard'
import { WarehouseDashboard } from '@/components/dashboard/warehouse-dashboard'
import { ProducerDashboard }  from '@/components/dashboard/producer-dashboard'
import { UserDashboard }      from '@/components/dashboard/user-dashboard'

export default async function DashboardPage() {
  const user = await getSessionUser()
  const name = user
    ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || (user.email?.split('@')[0] ?? '')
    : ''

  switch (user?.role) {
    case 'ADMIN':
      return <AdminDashboard userName={name} />
    case 'PURCHASER':
      return <PurchaserDashboard userName={name} />
    case 'WAREHOUSE_MANAGER':
      return <WarehouseDashboard userName={name} />
    case 'PRODUCER':
      return <ProducerDashboard userName={name} />
    default:
      return <UserDashboard userName={name} />
  }
}
