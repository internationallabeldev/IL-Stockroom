import type { InkLot } from '@/actions/ink-inventory.actions'

/** kg consumed per day since reception. null when data is insufficient (<3 days or no consumption). */
export function getLotDailyRate(lot: InkLot): number | null {
  const receiptDate = lot.receipt?.receipt_date
  if (!receiptDate) return null
  const daysAgo = (Date.now() - new Date(receiptDate).getTime()) / 86_400_000
  if (daysAgo < 3) return null
  const used = lot.used_kg ?? 0
  if (used <= 0) return null
  return used / daysAgo
}

/** estimated days of stock remaining at current consumption rate. */
export function getLotDaysCoverage(lot: InkLot): number | null {
  const rate = getLotDailyRate(lot)
  if (!rate) return null
  const remaining = lot.remaining_kg ?? 0
  if (remaining <= 0) return 0
  return remaining / rate
}

export type LotStatusInfo = { label: string; cls: string }

export function getLotStatusInfo(lot: InkLot): LotStatusInfo {
  if (!lot.enabled)
    return { label: 'Deshabilitado', cls: 'border-border text-muted-foreground bg-muted/40' }

  const remaining = lot.remaining_kg ?? 0
  const initial   = lot.initial_kg   ?? 0
  const pct       = initial > 0 ? remaining / initial : 0
  const minStock  = lot.ink_catalog?.min_stock_kg ?? 0
  const coverage  = getLotDaysCoverage(lot)

  if (remaining <= 0)
    return { label: 'Agotado',    cls: 'border-red-300 text-red-700 bg-red-50' }
  if (coverage !== null && coverage < 2)
    return { label: '< 48H',     cls: 'border-red-300 text-red-700 bg-red-50' }
  if (pct < 0.1)
    return { label: 'Crítico',   cls: 'border-red-200 text-red-700 bg-red-50' }
  if (minStock > 0 && remaining < minStock)
    return { label: 'Bajo stock', cls: 'border-yellow-200 text-yellow-700 bg-yellow-50' }
  return { label: 'Activo', cls: 'border-green-200 text-green-700 bg-green-50' }
}
