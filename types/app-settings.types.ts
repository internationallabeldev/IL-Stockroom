export type AppSettings = {
  company: {
    name: string
    logo_url: string | null
    address: string
    phone: string
    rfc: string
    fiscal_address: string
    warehouse_address: string
  }
  pdf: {
    footer_legal: string
    reception_notes: string
    revision: string
  }
  alerts: {
    quality_pending_days: number
    order_overdue_days: number
    low_stock_percentage: number
  }
  orders: {
    number_sequence_start: number
    default_payment_method: string
    default_delivery_place: string
  }
  requisitions: {
    max_response_hours: number
    rejection_placeholder: string
  }
}
