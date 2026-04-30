import { getPendingQualityReceipts, getAllReceipts, getReceivableOrders } from '@/actions/receipts.actions'
import { getSessionUser } from '@/actions/auth.actions'
import { redirect } from 'next/navigation'
import { PendingQualityList } from '@/components/receipts/pending-quality-list'
import { ReceiptsHistory } from '@/components/receipts/receipts-history'
import { PendingOrdersList } from '@/components/receipts/pending-orders-list'
import { AlertTriangle } from 'lucide-react'
import { ReceiptsPageTabs } from './_components/receipts-page-tabs'

export const dynamic = 'force-dynamic'

export default async function ReceiptsPage() {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const canEdit = ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role)

  const [pending, history, receivable] = await Promise.all([
    getPendingQualityReceipts(),
    getAllReceipts(),
    getReceivableOrders(),
  ])

  const pendingCount    = pending.inkReceipts.length + pending.paperReceipts.length
  const receivableCount = receivable.inkOrders.length + receivable.paperOrders.length

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Recepciones</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-1">
            Registro de material recibido y control de calidad
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 text-yellow-700">
            <AlertTriangle className="size-4 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''} de calidad
            </span>
          </div>
        )}
      </div>

      <ReceiptsPageTabs
        receivableCount={receivableCount}
        pendingCount={pendingCount}
        receivablePanel={
          <PendingOrdersList
            initialInk={receivable.inkOrders}
            initialPaper={receivable.paperOrders}
          />
        }
        pendingPanel={
          <PendingQualityList
            initialInk={pending.inkReceipts}
            initialPaper={pending.paperReceipts}
          />
        }
        historyPanel={
          <ReceiptsHistory
            initialInk={history.inkReceipts}
            initialPaper={history.paperReceipts}
            canEdit={canEdit}
          />
        }
      />
    </div>
  )
}
