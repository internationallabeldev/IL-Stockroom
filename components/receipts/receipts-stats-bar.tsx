'use client'

import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Activity, CheckCircle2, XCircle, ShieldAlert, Clock, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAllReceipts,
  type InkReceiptWithContext,
  type PaperReceiptWithContext,
} from '@/actions/receipts.actions'

type ReceiptForStats = {
  quality_certificate: string
  receipt_date: string
  updated_at: string | null
  purchase_order_item: {
    purchase_order: { providers: { name: string } | null } | null
  } | null
}

type Props = {
  initialInk:   InkReceiptWithContext[]
  initialPaper: PaperReceiptWithContext[]
  material:     'INK' | 'PAPER'
}

export function ReceiptsStatsBar({ initialInk, initialPaper, material }: Props) {
  const { data } = useQuery({
    queryKey:    ['all-receipts'],
    queryFn:     getAllReceipts,
    initialData: { inkReceipts: initialInk, paperReceipts: initialPaper },
    refetchInterval: 30_000,
  })

  const receipts = (
    material === 'INK' ? data.inkReceipts : data.paperReceipts
  ) as ReceiptForStats[]

  const todayStr = new Date().toISOString().slice(0, 10)
  const monthStr = new Date().toISOString().slice(0, 7)

  const pending   = receipts.filter(r => r.quality_certificate === 'PENDING').length
  const today     = receipts.filter(r => r.receipt_date.slice(0, 10) === todayStr).length

  const evaluated = receipts.filter(r => r.quality_certificate !== 'PENDING')
  const approved  = evaluated.filter(r => r.quality_certificate === 'APPROVED').length
  const approvalRate = evaluated.length > 0
    ? Math.round((approved / evaluated.length) * 100)
    : null

  const rejectedMonth    = receipts.filter(r =>
    r.quality_certificate === 'REJECTED' && r.receipt_date.slice(0, 7) === monthStr
  ).length
  const conditionalTotal = receipts.filter(r => r.quality_certificate === 'CONDITIONAL').length

  const evalTimes = evaluated
    .filter(r => !!r.updated_at)
    .map(r => (new Date(r.updated_at!).getTime() - new Date(r.receipt_date).getTime()) / 3_600_000)
    .filter(h => h > 0 && h < 720)
  const avgHours = evalTimes.length > 0
    ? evalTimes.reduce((a, b) => a + b, 0) / evalTimes.length
    : null

  const incidents: Record<string, number> = {}
  receipts
    .filter(r => r.quality_certificate === 'REJECTED' || r.quality_certificate === 'CONDITIONAL')
    .forEach(r => {
      const name = r.purchase_order_item?.purchase_order?.providers?.name
      if (name) incidents[name] = (incidents[name] ?? 0) + 1
    })
  const topIncident = Object.entries(incidents).sort((a, b) => b[1] - a[1])[0]

  const stats = [
    {
      icon: AlertTriangle,
      label: 'Pendientes',
      value: pending,
      accent: pending > 0 ? 'amber' as const : null,
    },
    {
      icon: Activity,
      label: 'Recepciones hoy',
      value: today,
      accent: null,
    },
    ...(approvalRate !== null ? [{
      icon: CheckCircle2,
      label: 'Tasa aprobación',
      value: `${approvalRate}%`,
      accent: approvalRate < 80 ? 'red' as const : null,
    }] : []),
    {
      icon: XCircle,
      label: 'Rechazos mes',
      value: rejectedMonth,
      accent: rejectedMonth > 0 ? 'red' as const : null,
    },
    {
      icon: ShieldAlert,
      label: 'Condicionales',
      value: conditionalTotal,
      accent: conditionalTotal > 0 ? 'amber' as const : null,
    },
    ...(avgHours !== null ? [{
      icon: Clock,
      label: 'T. prom. eval.',
      value: avgHours < 24
        ? `${avgHours.toFixed(1)} h`
        : `${(avgHours / 24).toFixed(1)} d`,
      accent: null,
    }] : []),
  ] as const

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      {stats.map(({ icon: Icon, label, value, accent }, i) => (
        <div key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-border/60 select-none hidden @2xl:inline">·</span>}
          <Icon className={cn(
            'size-3 shrink-0',
            accent === 'red'   ? 'text-red-500'  :
            accent === 'amber' ? 'text-amber-400' :
            'text-muted-foreground/50',
          )} />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            {label}
          </span>
          <span className={cn(
            'text-[11px] font-bold tabular-nums',
            accent === 'red'   ? 'text-red-500'  :
            accent === 'amber' ? 'text-amber-400' :
            'text-foreground/80',
          )}>
            {value}
          </span>
        </div>
      ))}

      {topIncident && (
        <div className="flex items-center gap-2">
          <span className="text-border/60 select-none hidden @2xl:inline">·</span>
          <Building2 className="size-3 shrink-0 text-muted-foreground/50" />
          <span className="text-[10px] text-muted-foreground/60 uppercase tracking-widest font-medium">
            Mayor incidencias
          </span>
          <span className="text-[11px] font-bold tabular-nums text-foreground/80 max-w-[140px] truncate">
            {topIncident[0]}
          </span>
          <span className="text-[10px] text-muted-foreground/50 tabular-nums">
            {topIncident[1]}
          </span>
        </div>
      )}
    </div>
  )
}
