'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  CheckCircle, XCircle, Truck, RotateCcw,
  Droplet, FileText, Package, User, CalendarClock, Hash,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getRequisitionById,
  approveRequisition,
  rejectRequisition,
  type Requisition,
} from '@/actions/requisitions.actions'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { RequisitionStatusBadge } from './requisition-status-badge'
import { FulfillForm }            from './fulfill-form'
import type { Database }          from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

type Props = {
  open:                boolean
  onClose:             () => void
  requisitionId:       number | null
  initialRequisition:  Requisition | null
  userRole:            UserRole
}

export function RequisitionSheet({ open, onClose, requisitionId, initialRequisition, userRole }: Props) {
  const queryClient = useQueryClient()
  const { data: req, refetch } = useQuery({
    queryKey:    ['requisition', requisitionId],
    queryFn:     () => getRequisitionById(requisitionId!),
    initialData: initialRequisition ?? undefined,
    enabled:     !!requisitionId,
  })

  const [fulfillOpen,  setFulfillOpen]  = useState(false)
  const [rejectOpen,   setRejectOpen]   = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  const isManager = userRole === 'ADMIN' || userRole === 'WAREHOUSE_MANAGER'

  async function handleApprove() {
    setSubmitting(true)
    const res = await approveRequisition(req!.id)
    if (res.error) toast.error(res.error)
    else { toast.success('Requisición aprobada'); refetch(); void queryClient.invalidateQueries({ queryKey: ['requisitions'] }) }
    setSubmitting(false)
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error('El motivo es requerido'); return }
    setSubmitting(true)
    const res = await rejectRequisition(req!.id, rejectReason)
    if (res.error) toast.error(res.error)
    else { toast.success('Requisición rechazada'); setRejectOpen(false); setRejectReason(''); refetch(); void queryClient.invalidateQueries({ queryKey: ['requisitions'] }) }
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-[30vw] flex flex-col p-0 bg-background border-l border-border gap-0"
      >
        {!req ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cargando…</p>
          </div>
        ) : (
          <>
            {/* ── Header ──────────────────────────────────────────────────────── */}
            <SheetHeader className="px-6 py-4 border-b border-border/50 shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <SheetTitle className="font-heading text-2xl font-bold tracking-tight">
                      Req. #{req.requisition_number}
                    </SheetTitle>
                    <RequisitionStatusBadge status={req.status} />
                    <span className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border',
                      req.material_type === 'INK'
                        ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-600',
                    )}>
                      {req.material_type === 'INK'
                        ? <Droplet className="size-2.5" />
                        : <FileText className="size-2.5" />}
                      {req.material_type === 'INK' ? 'Tinta' : 'Papel'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">{req.production_order}</p>
                </div>
              </div>

              {/* Actions */}
              {isManager && (
                <div className="flex items-center gap-2 pt-1">
                  {req.status === 'PENDING' && (
                    <>
                      <button
                        disabled={submitting}
                        onClick={handleApprove}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40"
                      >
                        <CheckCircle className="size-3" />
                        Aprobar
                      </button>
                      <button
                        disabled={submitting}
                        onClick={() => setRejectOpen(v => !v)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400 text-red-600 text-[9px] font-bold uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-40"
                      >
                        <XCircle className="size-3" />
                        Rechazar
                      </button>
                    </>
                  )}
                  {(req.status === 'APPROVED' || req.status === 'PARTIAL') && (
                    <button
                      disabled={submitting}
                      onClick={() => setFulfillOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40"
                    >
                      <Truck className="size-3" />
                      Surtir
                    </button>
                  )}
                </div>
              )}

              {/* Inline reject input */}
              {rejectOpen && (
                <div className="pt-2 space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Motivo del rechazo…"
                    className="w-full px-3 py-2 border border-foreground/20 bg-card text-xs outline-none focus:border-foreground/50 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      disabled={!rejectReason.trim() || submitting}
                      onClick={handleReject}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-40"
                    >
                      <XCircle className="size-3" />
                      {submitting ? 'Rechazando…' : 'Confirmar rechazo'}
                    </button>
                    <button
                      onClick={() => { setRejectOpen(false); setRejectReason('') }}
                      className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </SheetHeader>

            {/* ── Scrollable body ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Meta */}
              <section className="border border-border bg-muted/20 p-4">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Información general
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <MetaItem icon={User} label="Solicitó" value={
                    req.requester
                      ? `${req.requester.first_name} ${req.requester.last_name}`
                      : '—'
                  } />
                  <MetaItem icon={CalendarClock} label="Fecha" value={fmtDateTime(req.request_date)} />
                  <MetaItem icon={Hash} label="Orden producción" value={req.production_order} mono />
                  {req.approver && (
                    <MetaItem icon={User} label="Atendida por" value={
                      `${req.approver.first_name ?? ''} ${req.approver.last_name ?? ''}`.trim()
                    } />
                  )}
                  {req.approved_at && (
                    <MetaItem icon={CalendarClock} label="Aprobada" value={fmtDateTime(req.approved_at)} />
                  )}
                  {req.fulfilled_at && (
                    <MetaItem icon={CalendarClock} label="Surtida" value={fmtDateTime(req.fulfilled_at)} />
                  )}
                </div>
                {req.notes && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Notas</p>
                    <p className="text-xs">{req.notes}</p>
                  </div>
                )}
              </section>

              {/* Ink items */}
              {(req.ink_items ?? []).length > 0 && (
                <section className="border border-border">
                  <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                    <Droplet className="size-3 text-muted-foreground" />
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Tintas solicitadas</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {(req.ink_items ?? []).map(item => {
                      const del    = (req.ink_outputs ?? [])
                        .filter(o => o.ink_inventory?.ink_catalog_id === item.ink_catalog_id)
                        .reduce((s, o) => s + o.kg_delivered, 0)
                      const kgReq  = parseFloat(String(item.kg_requested)) || 0
                      const pct    = kgReq > 0 ? Math.min(100, (del / kgReq) * 100) : 0
                      const filled = kgReq > 0 && del >= kgReq
                      return (
                        <div key={item.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <p className="text-xs font-bold">{item.ink_catalog?.name ?? '—'}</p>
                              <p className="text-[9px] font-mono text-muted-foreground">{item.ink_catalog?.code}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold">{del.toFixed(2)} / {kgReq.toFixed(2)} kg</p>
                              {filled
                                ? <p className="text-[8px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Completo</p>
                                : <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Pendiente {(kgReq - del).toFixed(2)} kg</p>
                              }
                            </div>
                          </div>
                          <div className="h-1 bg-muted w-full">
                            <div className={cn('h-full', filled ? 'bg-green-500' : 'bg-foreground')} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Paper items */}
              {(req.paper_items ?? []).length > 0 && (
                <section className="border border-border">
                  <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                    <FileText className="size-3 text-muted-foreground" />
                    <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Papeles solicitados</p>
                  </div>
                  <div className="divide-y divide-border/30">
                    {(req.paper_items ?? []).map(item => {
                      const del    = (req.paper_outputs ?? [])
                        .filter(o => o.paper_inventory?.paper_catalog_id === item.paper_catalog_id)
                        .reduce((s, o) => s + (o.m2_delivered ?? 0), 0)
                      const m2Req  = parseFloat(String(item.m2_requested ?? '0')) || 0
                      const lenReq = parseFloat(String(item.length_m_requested)) || 0
                      const widReq = parseFloat(String(item.width_m_requested)) || 0
                      const pct    = m2Req > 0 ? Math.min(100, (del / m2Req) * 100) : 0
                      const filled = m2Req > 0 && del >= m2Req
                      return (
                        <div key={item.id} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <div>
                              <p className="text-xs font-bold">{item.paper_catalog?.name ?? '—'}</p>
                              <p className="text-[9px] font-mono text-muted-foreground">
                                {item.paper_catalog?.code} · {lenReq.toFixed(3)} × {widReq.toFixed(3)} m
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-mono font-bold">{del.toFixed(3)} / {m2Req.toFixed(3)} m²</p>
                              {filled
                                ? <p className="text-[8px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Completo</p>
                                : <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Pendiente {(m2Req - del).toFixed(3)} m²</p>
                              }
                            </div>
                          </div>
                          <div className="h-1 bg-muted w-full">
                            <div className={cn('h-full', filled ? 'bg-green-500' : 'bg-foreground')} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}

              {/* Outputs */}
              <section className="border border-border">
                <div className="px-4 py-2 border-b border-border/50 bg-muted/30 flex items-center gap-2">
                  <Package className="size-3 text-muted-foreground" />
                  <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">Historial de salidas</p>
                </div>
                {(req.ink_outputs ?? []).length === 0 && (req.paper_outputs ?? []).length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">Sin salidas registradas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {(req.ink_outputs ?? []).map(out => (
                      <div key={out.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-bold">{out.ink_inventory?.ink_catalog?.name ?? 'Tinta'}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">Lote: {out.ink_inventory?.internal_batch ?? '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-mono font-bold">{out.kg_delivered.toFixed(2)} kg</p>
                            {(out.kg_returned ?? 0) > 0 && (
                              <p className="text-[9px] font-bold text-green-700 dark:text-green-400 flex items-center gap-0.5">
                                <RotateCcw className="size-2.5" />
                                {(out.kg_returned ?? 0).toFixed(2)} kg devueltos
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {fmtDateTime(out.output_date)} · {out.delivered_by_user
                            ? `${out.delivered_by_user.first_name} ${out.delivered_by_user.last_name}`
                            : '—'}
                        </p>
                      </div>
                    ))}
                    {(req.paper_outputs ?? []).map(out => (
                      <div key={out.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-bold">{out.paper_inventory?.paper_catalog?.name ?? 'Papel'}</p>
                            <p className="text-[9px] font-mono text-muted-foreground">Lote: {out.paper_inventory?.internal_batch ?? '—'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[11px] font-mono font-bold">{(out.m2_delivered ?? 0).toFixed(3)} m²</p>
                            {(out.m2_returned ?? 0) > 0 && (
                              <p className="text-[9px] font-bold text-green-700 dark:text-green-400 flex items-center gap-0.5">
                                <RotateCcw className="size-2.5" />
                                {(out.m2_returned ?? 0).toFixed(3)} m² devueltos
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-0.5">
                          {fmtDateTime(out.output_date)} · {out.delivered_by_user
                            ? `${out.delivered_by_user.first_name} ${out.delivered_by_user.last_name}`
                            : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </SheetContent>

      {req && (
        <FulfillForm
          open={fulfillOpen}
          onClose={() => { setFulfillOpen(false); refetch(); void queryClient.invalidateQueries({ queryKey: ['requisitions'] }) }}
          requisition={req!}
        />
      )}
    </Sheet>
  )
}

function MetaItem({ icon: Icon, label, value, mono = false }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; mono?: boolean
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Icon className="size-2.5 text-muted-foreground" />
        <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      </div>
      <p className={cn('text-xs', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
  })
}
