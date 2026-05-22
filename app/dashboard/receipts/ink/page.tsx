import { getPendingQualityReceipts, getAllReceipts } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect } from 'next/navigation'
import { PendingQualityList } from '@/components/receipts/pending-quality-list'
import { ReceiptsHistory } from '@/components/receipts/receipts-history'
import { ReceiptsStatsBar } from '@/components/receipts/receipts-stats-bar'
import { AlertTriangle } from 'lucide-react'
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

  const pendingCount = pending.inkReceipts.length

  return (
    <div className="px-8 pb-8">
      <div className="sticky top-16 z-30 bg-background border-b border-border -mx-8 px-8">
        <div className="py-3">
          <ReceiptsStatsBar
            initialInk={history.inkReceipts}
            initialPaper={history.paperReceipts}
            material="INK"
          />
        </div>
      </div>

      <div className="mt-6">
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 mb-5 bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de calidad
            </span>
          </div>
        )}

        <ReceiptsPageTabs
          pendingCount={pendingCount}
          pendingPanel={
            <PendingQualityList
              initialInk={pending.inkReceipts}
              initialPaper={pending.paperReceipts}
              defaultMaterial="INK"
            />
          }
          historyPanel={
            <ReceiptsHistory
              initialInk={history.inkReceipts}
              initialPaper={history.paperReceipts}
              canEdit={canEdit}
              defaultMaterial="INK"
            />
          }
        />
      </div>
    </div>
  )
}
