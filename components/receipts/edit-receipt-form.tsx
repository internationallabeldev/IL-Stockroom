'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { updateReceiptAdminSchema, type UpdateReceiptAdminValues } from '@/lib/validations/receipt.schema'
import { updateInkReceiptAdmin, updatePaperReceiptAdmin } from '@/actions/receipts.actions'

type Props = {
  open:         boolean
  onClose:      () => void
  receiptId:    number
  materialType: 'INK' | 'PAPER'
  initialValues: UpdateReceiptAdminValues
  batchRef:     string
}

const QUALITY_OPTIONS: Array<{ value: UpdateReceiptAdminValues['quality_certificate']; label: string }> = [
  { value: 'PENDING',     label: 'Pendiente'   },
  { value: 'APPROVED',    label: 'Aprobado'    },
  { value: 'REJECTED',    label: 'Rechazado'   },
  { value: 'CONDITIONAL', label: 'Condicional' },
]

const inputCls = 'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors'

export function EditReceiptForm({ open, onClose, receiptId, materialType, initialValues, batchRef }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateReceiptAdminValues>({
    resolver: zodResolver(updateReceiptAdminSchema),
    defaultValues: initialValues,
  })

  useEffect(() => {
    if (open) reset(initialValues)
  }, [open])

  const selected = watch('quality_certificate')

  async function onSubmit(data: UpdateReceiptAdminValues) {
    const action = materialType === 'INK' ? updateInkReceiptAdmin : updatePaperReceiptAdmin
    const res = await action(receiptId, data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Recibo actualizado')
    onClose()
  }

  if (!open) return null

  return (
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

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4 overflow-y-auto">
          {/* Fecha */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Fecha de recibo *
            </label>
            <input type="date" {...register('receipt_date')} className={inputCls} />
            {errors.receipt_date && (
              <p className="text-[10px] text-destructive mt-1">{errors.receipt_date.message}</p>
            )}
          </div>

          {/* Remisión / Factura */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Remisión / Factura *
            </label>
            <input {...register('invoice_remission')} className={inputCls} placeholder="REM-0000" />
            {errors.invoice_remission && (
              <p className="text-[10px] text-destructive mt-1">{errors.invoice_remission.message}</p>
            )}
          </div>

          {/* Lote proveedor */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
              Lote proveedor *
            </label>
            <input {...register('provider_batch')} className={inputCls} placeholder="PROV-000" />
            {errors.provider_batch && (
              <p className="text-[10px] text-destructive mt-1">{errors.provider_batch.message}</p>
            )}
          </div>

          {/* Calidad */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Estado de calidad *</p>
            <div className="grid grid-cols-2 border border-border">
              {QUALITY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setValue('quality_certificate', o.value, { shouldValidate: true })}
                  className={cn(
                    'py-2 text-[10px] font-bold uppercase tracking-widest transition-colors border-b border-r border-border/30 last:border-r-0',
                    selected === o.value
                      ? 'bg-foreground text-background'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

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
  )
}
