import { getRequisitions, getInkCatalogWithStock, getPaperCatalogWithStock } from '@/actions/requisitions.actions'
import { getSessionUser }   from '@/actions/auth.actions'
import { RequisitionsList } from '@/components/requisitions/requisitions-list'

export default async function PaperRequisitionsPage() {
  const [requisitions, user, inkCatalog, paperCatalog] = await Promise.all([
    getRequisitions(),
    getSessionUser(),
    getInkCatalogWithStock(),
    getPaperCatalogWithStock(),
  ])

  const canCreate = user?.role !== 'USER'
  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  return (
    <div className="px-8 pt-6 pb-8">
      <RequisitionsList
        initialRequisitions={requisitions}
        canCreate={canCreate}
        canManage={canManage}
        userRole={user?.role ?? 'USER'}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        materialType="PAPER"
      />
    </div>
  )
}
