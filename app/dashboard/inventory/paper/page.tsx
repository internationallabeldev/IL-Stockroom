import { getSessionUser }              from '@/actions/auth.actions'
import { getPaperInventory }           from '@/actions/paper-inventory.actions'
import { getPaperCatalogWithStock }    from '@/actions/requisitions.actions'
import { PaperInventoryView }          from '@/components/inventory/papers/paper-inventory-view'
import { redirect }                    from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function PaperInventoryPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canManage  = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)
  const canRequest = user.role !== 'USER'

  const [lots, paperCatalog] = await Promise.all([
    getPaperInventory(),
    getPaperCatalogWithStock(),
  ])

  return (
    <div className="px-8 pb-8">
      <PaperInventoryView
        initialLots={lots}
        canManage={canManage}
        canRequest={canRequest}
        paperCatalog={paperCatalog}
      />
    </div>
  )
}
