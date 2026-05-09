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

  const paperReqs = requisitions.filter(r => r.material_type === 'PAPER')
  const pending   = paperReqs.filter(r => r.status === 'PENDING').length

  return (
    <div className="px-8 pt-6 pb-8">
      <header className="mb-5">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-[#1A1A1A]">
          Requisiciones — Papel
        </h1>
        <p className="text-sm text-[#5f5e59] mt-0.5">
          {paperReqs.length} total
          {pending > 0 && ` · ${pending} pendiente${pending !== 1 ? 's' : ''} de atender`}
        </p>
      </header>

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
