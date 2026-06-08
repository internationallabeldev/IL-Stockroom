import { getPendingQualityReceipts, getAllReceipts } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { ReceiptsStatsBar } from '@/components/receipts/receipts-stats-bar'
import { ReceiptsPageTabs } from '../_components/receipts-page-tabs'

export const dynamic = 'force-dynamic'

export default async function PaperReceiptsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canEdit = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)

  const [pending, history] = await Promise.all([
    getPendingQualityReceipts(),
    getAllReceipts(),
  ])

  const pendingCount = pending.paperReceipts.length

  return (
    <div className="px-8 pb-8">
      <ReceiptsPageTabs
        defaultMaterial="PAPER"
        canEdit={canEdit}
        initialPending={pending}
        initialHistory={history}
        statsBar={
          <ReceiptsStatsBar
            initialInk={history.inkReceipts}
            initialPaper={history.paperReceipts}
            material="PAPER"
          />
        }
        alert={pendingCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 mb-5 bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de calidad
            </span>
          </div>
        ) : undefined}
      />
    </div>
  )
}
