'use client'

import { PDFDownloadLink } from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'
import { OrderPDF } from './order-pdf'
import type { PurchaseOrderDetail } from '@/actions/purchase-orders.actions'
import type { AppSettings } from '@/types/app-settings.types'

type Props = {
  order:       PurchaseOrderDetail
  settings?:   AppSettings | null
  logoBase64?: string | null
}

export function OrderPdfButton({ order, settings, logoBase64 }: Props) {
  const filename = `OC-${order.order_number}.pdf`

  return (
    <PDFDownloadLink document={<OrderPDF order={order} settings={settings} logoBase64={logoBase64} />} fileName={filename}>
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
