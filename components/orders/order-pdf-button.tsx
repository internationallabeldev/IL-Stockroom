'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import { OrderPDF } from './order-pdf'
import type { PurchaseOrderDetail } from '@/actions/purchase-orders.actions'

type Props = { order: PurchaseOrderDetail }

export function OrderPdfButton({ order }: Props) {
  const filename = `OC-${order.order_number}.pdf`

  return (
    <PDFDownloadLink document={<OrderPDF order={order} />} fileName={filename}>
      {({ loading }) => (
        <span className="flex items-center gap-1.5 px-3 py-1.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors cursor-pointer select-none">
          {loading
            ? <Loader2 className="size-3 animate-spin" />
            : <Download className="size-3" />
          }
          {loading ? 'Generando...' : 'Descargar PDF'}
        </span>
      )}
    </PDFDownloadLink>
  )
}
