import { notFound }           from 'next/navigation'
import { getRequisitionById } from '@/actions/requisitions.actions'
import { getSessionUser }     from '@/actions/auth.actions'
import { RequisitionDetail }  from '@/components/requisitions/requisition-detail'

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

  return (
    <div className="px-8 pt-8 pb-16">
      <RequisitionDetail
        requisition={requisition}
        userRole={user.role}
        userId={user.id}
      />
    </div>
  )
}
