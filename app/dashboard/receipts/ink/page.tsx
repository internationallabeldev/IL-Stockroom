import { getPendingQualityReceipts, getAllReceipts } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect } from 'next/navigation'
import { PendingQualityList } from '@/components/receipts/pending-quality-list'
import { ReceiptsHistory } from '@/components/receipts/receipts-history'
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
    <div className="p-8">
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
  )
}
