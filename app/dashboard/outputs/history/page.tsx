import { getRequisitions } from '@/actions/requisitions.actions'
import { getSessionUser }   from '@/actions/auth.actions'
import { redirect }         from 'next/navigation'
import { OutputsHistoryList } from '@/components/outputs-history/outputs-history-list'

export default async function OutputsHistoryPage() {
  const [fulfilled, user] = await Promise.all([
    getRequisitions({ statuses: ['FULFILLED', 'PARTIAL'] }),
    getSessionUser(),
  ])

  if (!user) redirect('/login')

  return (
    <div className="px-8 pb-8">
      <OutputsHistoryList
        initialRequisitions={fulfilled}
        userRole={user.role}
      />
    </div>
  )
}
