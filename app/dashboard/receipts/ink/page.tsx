import { getPendingQualityReceipts, getAllReceipts } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect } from 'next/navigation'
import { ReceiptsStatsBar } from '@/components/receipts/receipts-stats-bar'
import { ReceiptsPageTabs } from '../_components/receipts-page-tabs'

export const dynamic = 'force-dynamic'

export default async function InkReceiptsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canEdit = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)

  const [pending, history] = await Promise.all([
    getPendingQualityReceipts(),
    getAllReceipts(),
  ])

  return (
    <div className="px-8 pb-8">
      <ReceiptsPageTabs
        defaultMaterial="INK"
        canEdit={canEdit}
        initialPending={pending}
        initialHistory={history}
        statsBar={
          <ReceiptsStatsBar
            initialInk={history.inkReceipts}
            initialPaper={history.paperReceipts}
            material="INK"
          />
        }
      />
    </div>
  )
}
