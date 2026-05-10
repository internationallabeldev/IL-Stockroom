import { getSessionUser }              from '@/actions/auth.actions'
import { getInkInventory }             from '@/actions/ink-inventory.actions'
import { getInkCatalogWithStock }      from '@/actions/requisitions.actions'
import { InkInventoryView }            from '@/components/inventory/inks/ink-inventory-view'
import { redirect }                    from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function InkInventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canManage  = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canRequest = user.role !== 'USER'

  const [lots, inkCatalog] = await Promise.all([
    getInkInventory(),
    getInkCatalogWithStock(),
  ])

  return (
    <div className="p-8">
      <InkInventoryView
        initialLots={lots}
        canManage={canManage}
        canRequest={canRequest}
        inkCatalog={inkCatalog}
      />
    </div>
  )
}
