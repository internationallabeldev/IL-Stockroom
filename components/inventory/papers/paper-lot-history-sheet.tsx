'use client'

import { useQuery } from '@tanstack/react-query'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  Package, FileCheck, CheckCircle2, XCircle,
  Truck, Layers, Clock, AlertCircle,
} from 'lucide-react'
import { getPaperLotHistory, type PaperLotHistory } from '@/actions/paper-inventory.actions'
import { LotProgressBar } from '../shared/lot-progress-bar'
import { cn } from '@/lib/utils'

type Props = {
  open:        boolean
  onClose:     () => void
  inventoryId: number | null
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  const [y, m, day] = d.split('T')[0].split('-')
  return `${day}/${m}/${y}`
}

function userName(u: { first_name: string | null; last_name: string | null } | null) {
  if (!u) return '—'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || '—'
}

const QUALITY_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:     { label: 'Pendiente',   cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  APPROVED:    { label: 'Aprobado',    cls: 'text-green-700  bg-green-50  border-green-200'  },
  REJECTED:    { label: 'Rechazado',   cls: 'text-red-700    bg-red-50    border-red-200'    },
  CONDITIONAL: { label: 'Condicional', cls: 'text-orange-700 bg-orange-50 border-orange-200' },
}

export function PaperLotHistorySheet({ open, onClose, inventoryId }: Props) {
  const { data: lot, isLoading } = useQuery({
    queryKey: ['paper-lot-history', inventoryId],
    queryFn:  () => getPaperLotHistory(inventoryId!),
    enabled:  open && inventoryId !== null,
  })

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-lg overflow-y-auto bg-background border-l border-border p-0">
        <SheetHeader className="px-6 py-5 border-b border-border/50">
          <SheetTitle className="font-heading text-xl font-bold tracking-tight">
            Historial de bobina
          </SheetTitle>
          {lot && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {lot.internal_batch} · {lot.paper_catalog?.name}
            </p>
          )}
        </SheetHeader>

        {isLoading && (
          <div className="p-8 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Cargando…
          </div>
        )}

        {lot && <LotHistoryBody lot={lot} />}
      </SheetContent>
    </Sheet>
  )
}

function LotHistoryBody({ lot }: { lot: PaperLotHistory }) {
  const r = lot.receipt
  const q = QUALITY_LABELS[(r as any)?.quality_certificate ?? 'PENDING'] ?? QUALITY_LABELS.PENDING

  return (
    <div className="px-6 py-5 space-y-6">

      {/* ── Stock summary ───────────────────────────────────────────────────── */}
      <div className="border border-border/50 p-4 space-y-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Estado de la bobina</p>
        <LotProgressBar initial={lot.initial_m2 ?? 0} used={lot.used_m2 ?? 0} unit="m²" />
        <div className="grid grid-cols-2 gap-2 text-center">
          {[
            { label: 'Largo inicial',    val: `${lot.initial_length_m.toFixed(2)} m`         },
            { label: 'Ancho inicial',    val: `${lot.initial_width_m.toFixed(2)} m`           },
            { label: 'M² iniciales',     val: `${(lot.initial_m2 ?? 0).toFixed(2)} m²`       },
            { label: 'M² restantes',     val: `${(lot.remaining_m2 ?? 0).toFixed(2)} m²`     },
          ].map(({ label, val }) => (
            <div key={label} className="bg-muted/40 px-2 py-2">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="font-mono text-sm font-bold mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        {lot.location && (
          <p className="text-[10px] text-muted-foreground font-mono">Ubicación: {lot.location}</p>
        )}
        {!lot.enabled && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-600">Bobina deshabilitada</p>
        )}
      </div>

      {/* ── Receipt details ─────────────────────────────────────────────────── */}
      {r && (
        <div className="border border-border/50 p-4 space-y-3">
          <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Recepción</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
            <DataRow label="Remisión/Factura" value={(r as any).invoice_remission ?? '—'} />
            <DataRow label="Lote proveedor"   value={(r as any).provider_batch ?? '—'} />
            <DataRow label="Fecha recepción"  value={fmtDate((r as any).receipt_date)} />
            <DataRow label="Recibido por"     value={userName((r as any).receiver)} />
            <DataRow label="Largo recibido"   value={`${(r as any).length_m ?? '—'} m`} />
            <DataRow label="Ancho"            value={`${(r as any).width_m ?? '—'} m`} />
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border', q.cls)}>
              {q.label}
            </span>
            {(r as any).certificate_url && (
              <a
                href={(r as any).certificate_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[10px] font-bold text-green-700 underline underline-offset-2 hover:text-green-900 transition-colors"
              >
                <FileCheck className="size-3" />
                Ver certificado
              </a>
            )}
          </div>
          {(r as any).quality_notes && (
            <p className="text-[10px] text-muted-foreground italic">{(r as any).quality_notes}</p>
          )}
        </div>
      )}

      {/* ── Timeline ────────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Línea de tiempo</p>
        <ol className="relative border-l border-border space-y-5 ml-1">

          <TimelineItem
            icon={Truck}
            color="bg-foreground"
            label="Recibida"
            date={fmtDate((r as any)?.receipt_date)}
            detail={r ? `${(r as any).length_m}m × ${(r as any).width_m}m` : undefined}
          />

          {(r as any)?.quality_certificate === 'APPROVED' && (
            <TimelineItem icon={CheckCircle2} color="bg-green-600" label="Aprobada" date={fmtDate((r as any)?.receipt_date)} />
          )}
          {(r as any)?.quality_certificate === 'REJECTED' && (
            <TimelineItem icon={XCircle} color="bg-red-600" label="Rechazada" date={fmtDate((r as any)?.receipt_date)} />
          )}
          {(r as any)?.quality_certificate === 'CONDITIONAL' && (
            <TimelineItem icon={AlertCircle} color="bg-orange-500" label="Condicional" date={fmtDate((r as any)?.receipt_date)} />
          )}
          {(r as any)?.quality_certificate === 'PENDING' && (
            <TimelineItem icon={Clock} color="bg-yellow-500" label="Pendiente de calidad" date="—" />
          )}

          {lot.outputs.map(o => (
            <TimelineItem
              key={o.id}
              icon={Layers}
              color="bg-blue-600"
              label={`Salida — ${(o.m2_delivered ?? 0).toFixed(2)} m²`}
              date={fmtDate(o.output_date)}
              detail={
                o.requisition
                  ? `REQ-${String(o.requisition.requisition_number).padStart(4, '0')} · ${o.requisition.production_order}`
                  : undefined
              }
              sub={(o.m2_returned ?? 0) > 0 ? `${o.m2_returned} m² devueltos` : undefined}
            />
          ))}

          <TimelineItem
            icon={Package}
            color={lot.enabled ? 'bg-foreground' : 'bg-muted-foreground'}
            label={lot.enabled ? 'En inventario' : 'Deshabilitada'}
            date="Ahora"
            detail={`${(lot.remaining_m2 ?? 0).toFixed(2)} m² restantes`}
          />
        </ol>
      </div>
    </div>
  )
}

function TimelineItem({
  icon: Icon, color, label, date, detail, sub,
}: {
  icon:    React.ElementType
  color:   string
  label:   string
  date:    string
  detail?: string
  sub?:    string
}) {
  return (
    <li className="ml-5">
      <span className={cn('absolute -left-2.5 flex size-5 items-center justify-center rounded-full', color)}>
        <Icon className="size-2.5 text-white" />
      </span>
      <p className="text-[11px] font-bold text-foreground">{label}</p>
      <p className="text-[10px] font-mono text-muted-foreground">{date}</p>
      {detail && <p className="text-[10px] text-muted-foreground">{detail}</p>}
      {sub    && <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">{sub}</p>}
    </li>
  )
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="font-mono mt-0.5">{value}</p>
    </div>
  )
}
