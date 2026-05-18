'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, X, Info, CheckCircle2, XCircle, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  updateInkReceiptAdminSchema,
  updatePaperReceiptAdminSchema,
  type UpdateInkReceiptAdminValues,
  type UpdatePaperReceiptAdminValues,
} from '@/lib/validations/receipt.schema'
import { updateInkReceiptAdmin, updatePaperReceiptAdmin } from '@/actions/receipts.actions'
import { CorrectLotDialog } from './correct-lot-dialog'

type QualityStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

type Props = {
  open:          boolean
  onClose:       () => void
  receiptId:     number
  materialType:  'INK' | 'PAPER'
  qualityStatus: QualityStatus
  inventoryId:   number | null
  isAdmin:       boolean
  batchRef:      string
  initialValues: UpdateInkReceiptAdminValues | UpdatePaperReceiptAdminValues
}

const inputCls     = 'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
const disabledNote = 'text-[9px] text-muted-foreground mt-1'

export function EditReceiptForm({
  open, onClose, receiptId, materialType, qualityStatus,
  inventoryId, isAdmin, batchRef, initialValues,
}: Props) {
  const isPending  = qualityStatus === 'PENDING'
  const isApproved = qualityStatus === 'APPROVED'
  const isRejected = qualityStatus === 'REJECTED'
  const isInk      = materialType === 'INK'

  const [correctOpen, setCorrectOpen] = useState(false)

  const schema   = isInk ? updateInkReceiptAdminSchema : updatePaperReceiptAdminSchema
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm({
    resolver:      zodResolver(schema),
    defaultValues: initialValues as any,
  })

  useEffect(() => { if (open) reset(initialValues as any) }, [open])

  async function onSubmit(data: UpdateInkReceiptAdminValues | UpdatePaperReceiptAdminValues) {
    const action = isInk ? updateInkReceiptAdmin : updatePaperReceiptAdmin
    const res = await action(receiptId, data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Recibo actualizado')
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

        <div className="relative w-full max-w-md bg-background border border-border flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 shrink-0">
            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight">Editar recibo</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
                Lote {batchRef}
              </p>
            </div>
            <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
              <X className="size-4" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4 overflow-y-auto">
            {/* ── Banner de estado de calidad ──────────────────────────────── */}
            {isPending && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400">
                <Info className="size-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold leading-relaxed">
                    Esta recepción está pendiente de revisión de calidad.
                  </p>
                  <a
                    href={`/dashboard/receipts/${isInk ? 'ink' : 'paper'}`}
                    className="text-[10px] underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200 transition-colors mt-0.5 inline-block"
                  >
                    Ir a revisión de calidad →
                  </a>
                </div>
              </div>
            )}

            {isApproved && (
              <div className="flex items-start gap-2.5 px-3 py-2.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400">
                <CheckCircle2 className="size-3.5 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold leading-relaxed">
                    Calidad aprobada. El material está en inventario.
                  </p>
                  {isAdmin && inventoryId && (
                    <button
                      type="button"
                      onClick={() => setCorrectOpen(true)}
                      className="flex items-center gap-1 text-[10px] underline underline-offset-2 hover:text-green-900 dark:hover:text-green-200 transition-colors mt-0.5"
                    >
                      <Wrench className="size-2.5" />
                      Corregir cantidad del lote
                    </button>
                  )}
                </div>
              </div>
            )}

            {(isRejected || qualityStatus === 'CONDITIONAL') && (
              <div className={cn(
                'flex items-start gap-2.5 px-3 py-2.5 border',
                isRejected
                  ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                  : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
              )}>
                <XCircle className="size-3.5 shrink-0 mt-0.5" />
                <p className="text-[10px] font-bold leading-relaxed">
                  {isRejected
                    ? 'Recepción rechazada. El material no entró al inventario.'
                    : 'Recepción con calidad condicional.'}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Fecha de recibo *
                </label>
                <input type="date" {...register('receipt_date')} className={inputCls} />
                {(errors as any).receipt_date && (
                  <p className="text-[10px] text-destructive mt-1">{(errors as any).receipt_date.message}</p>
                )}
              </div>

              {/* Remisión */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Remisión / Factura *
                </label>
                <input {...register('invoice_remission')} className={inputCls} placeholder="REM-0000" />
                {(errors as any).invoice_remission && (
                  <p className="text-[10px] text-destructive mt-1">{(errors as any).invoice_remission.message}</p>
                )}
              </div>

              {/* Lote proveedor */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Lote proveedor *
                </label>
                <input {...register('provider_batch')} className={inputCls} placeholder="PROV-000" />
                {(errors as any).provider_batch && (
                  <p className="text-[10px] text-destructive mt-1">{(errors as any).provider_batch.message}</p>
                )}
              </div>

              {/* Lote interno — solo editable cuando PENDING */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Lote interno
                </label>
                <input
                  {...register('internal_batch')}
                  disabled={!isPending}
                  className={inputCls}
                  placeholder="INT-000"
                />
                {!isPending && (
                  <p className={disabledNote}>No editable — ya existe lote en inventario con este batch.</p>
                )}
              </div>

              {/* Cantidad — INK */}
              {isInk && (
                <>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Kg recibidos
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      {...register('kg_received', { valueAsNumber: true })}
                      disabled={!isPending}
                      className={inputCls}
                      placeholder="0.000"
                    />
                    {!isPending && (
                      <p className={disabledNote}>No editable — ya existe lote en inventario.</p>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Unidades recibidas
                    </label>
                    <input
                      type="number"
                      {...register('units_received', { valueAsNumber: true })}
                      disabled={!isPending}
                      className={inputCls}
                      placeholder="0"
                    />
                    {!isPending && (
                      <p className={disabledNote}>No editable — ya fue procesada la recepción.</p>
                    )}
                  </div>
                </>
              )}

              {/* Cantidad — PAPER */}
              {!isInk && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                        Longitud (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('length_m', { valueAsNumber: true })}
                        disabled={!isPending}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                        Ancho (m)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        {...register('width_m', { valueAsNumber: true })}
                        disabled={!isPending}
                        className={inputCls}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  {!isPending && (
                    <p className={disabledNote + ' -mt-2'}>Longitud y ancho no editables — ya existe lote en inventario.</p>
                  )}
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Unidades recibidas
                    </label>
                    <input
                      type="number"
                      {...register('units_received', { valueAsNumber: true })}
                      disabled={!isPending}
                      className={inputCls}
                      placeholder="0"
                    />
                    {!isPending && (
                      <p className={disabledNote}>No editable — ya fue procesada la recepción.</p>
                    )}
                  </div>
                </>
              )}

              {/* Notas */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Notas de calidad
                </label>
                <textarea
                  {...register('quality_notes')}
                  rows={3}
                  placeholder="Observaciones..."
                  className={inputCls + ' resize-none pt-2 h-auto'}
                />
              </div>

              {/* URL certificado */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  URL certificado
                </label>
                <input {...register('certificate_url')} className={inputCls} placeholder="https://..." />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !isDirty}
                  className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                  {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Dialog de corrección — solo ADMIN + APPROVED */}
      {isAdmin && inventoryId && (
        <CorrectLotDialog
          open={correctOpen}
          onClose={() => setCorrectOpen(false)}
          onSuccess={onClose}
          materialType={materialType}
          inventoryId={inventoryId}
          currentKg={isInk ? (initialValues as UpdateInkReceiptAdminValues).kg_received : undefined}
          currentLengthM={!isInk ? (initialValues as UpdatePaperReceiptAdminValues).length_m : undefined}
          currentWidthM={!isInk ? (initialValues as UpdatePaperReceiptAdminValues).width_m : undefined}
        />
      )}
    </>
  )
}
