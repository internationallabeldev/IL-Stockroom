import { notFound }                 from 'next/navigation'
import { getRequisitionById }       from '@/actions/requisitions.actions'
import { getSessionUser }           from '@/actions/auth.actions'
import { RequisitionSheetPage }     from '@/components/requisitions/requisition-sheet-page'

export default async function RequisitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [requisition, user] = await Promise.all([
    getRequisitionById(Number(id)),
    getSessionUser(),
  ])

  if (!requisition || !user) notFound()

  return <RequisitionSheetPage requisition={requisition} userRole={user.role} />
}
