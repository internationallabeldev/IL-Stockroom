import { getRequisitions, getInkCatalogWithStock, getPaperCatalogWithStock } from '@/actions/requisitions.actions'
import { getSessionUser }   from '@/actions/auth.actions'
import { RequisitionsList } from '@/components/requisitions/requisitions-list'

export default async function InkRequisitionsPage() {
  const [requisitions, user, inkCatalog, paperCatalog] = await Promise.all([
    getRequisitions(),
    getSessionUser(),
    getInkCatalogWithStock(),
    getPaperCatalogWithStock(),
  ])

  const canCreate = user?.role !== 'USER'
  const canManage = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE_MANAGER'

  const inkReqs  = requisitions.filter(r => r.material_type === 'INK')
  const pending  = inkReqs.filter(r => r.status === 'PENDING').length

  return (
    <div className="px-8 pt-8 pb-16">
      <header className="mb-8">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-[#1A1A1A]">
          Requisiciones — Tintas
        </h1>
        <p className="text-lg text-[#5f5e59] mt-1">
          {inkReqs.length} total
          {pending > 0 && ` · ${pending} pendiente${pending !== 1 ? 's' : ''} de atender`}
        </p>
      </header>

      <RequisitionsList
        initialRequisitions={requisitions}
        canCreate={canCreate}
        canManage={canManage}
        inkCatalog={inkCatalog}
        paperCatalog={paperCatalog}
        materialType="INK"
      />
    </div>
  )
}
