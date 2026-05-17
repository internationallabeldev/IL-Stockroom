'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft, CheckCircle, XCircle, Truck,
  Droplet, FileText, User,
  CalendarClock, Hash,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  getRequisitionById,
  approveRequisition,
  rejectRequisition,
  type Requisition,
} from '@/actions/requisitions.actions'
import { RequisitionStatusBadge } from './requisition-status-badge'
import { RequisitionProgress }    from '@/components/outputs/requisition-progress'
import { OutputsHistory }         from '@/components/outputs/outputs-history'
import { InkOutputForm }          from '@/components/outputs/ink-output-form'
import { PaperOutputForm }        from '@/components/outputs/paper-output-form'
import type { Database }          from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

type Props = {
  requisition: Requisition
  userRole:    UserRole
  userId:      string
}

export function RequisitionDetail({ requisition: initial, userRole }: Props) {
  const { data: req, refetch } = useQuery({
    queryKey:        ['requisition', initial.id],
    queryFn:         () => getRequisitionById(initial.id),
    initialData:     initial,
    refetchInterval: 30_000,
  })

  const [fulfillOpen,   setFulfillOpen]   = useState(false)
  const [rejectOpen,    setRejectOpen]    = useState(false)
  const [rejectReason,  setRejectReason]  = useState('')
  const [submitting,    setSubmitting]    = useState(false)

  if (!req) return null

  const isManager   = userRole === 'ADMIN' || userRole === 'WAREHOUSE_MANAGER'
  const canSurtir   = isManager && (req.status === 'APPROVED' || req.status === 'PARTIAL')

  async function handleApprove() {
    setSubmitting(true)
    const res = await approveRequisition(req!.id)
    if (res.error) toast.error(res.error)
    else { toast.success('Requisición aprobada'); refetch() }
    setSubmitting(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('El motivo es requerido'); return }
    setSubmitting(true)
    const res = await rejectRequisition(req!.id, rejectReason)
    if (res.error) toast.error(res.error)
    else { toast.success('Requisición rechazada'); setRejectOpen(false); setRejectReason(''); refetch() }
    setSubmitting(false)
  }

  const inkItems   = req.ink_items   ?? []
  const paperItems = req.paper_items ?? []
  const inkOuts    = req.ink_outputs    ?? []
  const paperOuts  = req.paper_outputs  ?? []

  return (
    <>
      {/* Back + header */}
      <div className="mb-6 flex items-start gap-4">
        <Link
          href="/dashboard/requisitions"
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>

        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="font-heading text-3xl font-bold tracking-tight">
              Req. #{req.requisition_number}
            </h1>
            <RequisitionStatusBadge status={req.status} />
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest border',
              req.material_type === 'INK'
                ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600',
            )}>
              {req.material_type === 'INK'
                ? <Droplet  className="size-3" />
                : <FileText className="size-3" />}
              {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{req.production_order}</p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {isManager && req.status === 'PENDING' && (
            <>
              <button
                disabled={submitting}
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                <CheckCircle className="size-3.5" />
                Aprobar
              </button>
              <button
                disabled={submitting}
                onClick={() => setRejectOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 border border-red-400 text-red-600 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40"
              >
                <XCircle className="size-3.5" />
                Rechazar
              </button>
            </>
          )}

          {canSurtir && (
            <button
              disabled={submitting}
              onClick={() => setFulfillOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              <Truck className="size-3.5" />
              Surtir
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Info + Items + Progress */}
        <div className="lg:col-span-2 space-y-6">

          {/* Meta info */}
          <section className="border border-border bg-muted/20 p-4">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
              Información general
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetaItem icon={User} label="Solicitó" value={
                req.requester
                  ? `${req.requester.first_name} ${req.requester.last_name}`
                  : '—'
              } />
              <MetaItem icon={CalendarClock} label="Fecha solicitud" value={fmtDateTime(req.request_date)} />
              <MetaItem icon={Hash} label="Orden de producción" value={req.production_order} mono />

              {req.approver && (
                <MetaItem icon={User} label="Atendida por" value={
                  `${req.approver.first_name ?? ''} ${req.approver.last_name ?? ''}`.trim()
                } />
              )}
              {req.approved_at && (
                <MetaItem icon={CalendarClock} label="Aprobada" value={fmtDateTime(req.approved_at)} />
              )}
              {req.fulfilled_at && (
                <MetaItem icon={CalendarClock} label="Completada" value={fmtDateTime(req.fulfilled_at)} />
              )}
            </div>

            {req.notes && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Notas</p>
                <p className="text-sm">{req.notes}</p>
              </div>
            )}
          </section>

          {/* Delivery progress */}
          <RequisitionProgress inkItems={inkItems} paperItems={paperItems} />

          {/* Items — INK */}
          {inkItems.length > 0 && (
            <section className="border border-border">
              <div className="px-4 py-2.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <Droplet className="size-3.5 text-muted-foreground" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Tintas solicitadas
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {inkItems.map(item => {
                  const kgDel = item.kg_delivered ?? 0
                  const pct = item.kg_requested > 0
                    ? Math.min(100, (kgDel / item.kg_requested) * 100)
                    : 0
                  return (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-bold">
                            {item.ink_catalog?.name ?? '—'}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {item.ink_catalog?.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">
                            {kgDel.toFixed(2)} / {item.kg_requested.toFixed(2)} kg
                          </p>
                          {item.is_fulfilled
                            ? <p className="text-[9px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Completo</p>
                            : <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                Pendiente {(item.kg_requested - kgDel).toFixed(2)} kg
                              </p>
                          }
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted w-full">
                        <div
                          className={cn('h-full transition-all', item.is_fulfilled ? 'bg-green-500' : 'bg-foreground')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Items — PAPER */}
          {paperItems.length > 0 && (
            <section className="border border-border">
              <div className="px-4 py-2.5 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                <FileText className="size-3.5 text-muted-foreground" />
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                  Papeles solicitados
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {paperItems.map(item => {
                  const m2Req = item.m2_requested ?? 0
                  const m2Del = item.m2_delivered ?? 0
                  const pct = m2Req > 0
                    ? Math.min(100, (m2Del / m2Req) * 100)
                    : 0
                  return (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="text-sm font-bold">
                            {item.paper_catalog?.name ?? '—'}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground">
                            {item.paper_catalog?.code}
                            {' · '}
                            {item.length_m_requested.toFixed(3)} × {item.width_m_requested.toFixed(3)} m
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono font-bold">
                            {m2Del.toFixed(3)} / {m2Req.toFixed(3)} m²
                          </p>
                          {item.is_fulfilled
                            ? <p className="text-[9px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Completo</p>
                            : <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                                Pendiente {(m2Req - m2Del).toFixed(3)} m²
                              </p>
                          }
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted w-full">
                        <div
                          className={cn('h-full transition-all', item.is_fulfilled ? 'bg-green-500' : 'bg-foreground')}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right: Outputs history */}
        <div className="space-y-4">
          <OutputsHistory
            inkOutputs={inkOuts}
            paperOutputs={paperOuts}
            canManage={isManager}
            onReturnDone={refetch}
          />
        </div>
      </div>

      {/* Reject dialog */}
      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background border border-border p-6 w-full max-w-md space-y-4">
            <h2 className="font-heading text-base font-bold uppercase tracking-tight">
              Rechazar requisición
            </h2>
            <div>
              <label className="block text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
                Motivo *
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Describe el motivo del rechazo…"
                className="w-full px-3 py-2 border border-foreground/20 bg-card text-sm outline-none focus:border-foreground/50 resize-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { setRejectOpen(false); setRejectReason('') }}
                className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                disabled={!rejectReason.trim() || submitting}
                onClick={handleReject}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40"
              >
                <XCircle className="size-3.5" />
                {submitting ? 'Rechazando…' : 'Rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output forms */}
      {req.material_type === 'INK' ? (
        <InkOutputForm
          open={fulfillOpen}
          onClose={() => { setFulfillOpen(false); refetch() }}
          requisition={req}
        />
      ) : (
        <PaperOutputForm
          open={fulfillOpen}
          onClose={() => { setFulfillOpen(false); refetch() }}
          requisition={req}
        />
      )}
    </>
  )
}

// ── Small helpers ────────────────────────────────────────────────────────────

function MetaItem({
  icon: Icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="size-3 text-muted-foreground" />
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('es-MX', {
    day:    '2-digit',
    month:  'short',
    year:   '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
  })
}
