'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { registerMovement } from '@/actions/supplies.actions'
import { getSupplyStatus, type SupplyItem } from '@/lib/supplies/types'
import { registerMovementSchema, type RegisterMovementValues } from '@/lib/validations/supplies.schema'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const STATUS_COLOR: Record<string, string> = {
  ok:       'text-green-600',
  warning:  'text-yellow-600',
  critical: 'text-red-600',
  empty:    'text-foreground',
}

const STATUS_BG: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-500',
  critical: 'bg-red-500',
  empty:    'bg-foreground/80',
}

type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT'

type Props = {
  open: boolean
  onClose: () => void
  item: SupplyItem
  movementType: MovementType
}

const TITLE_MAP: Record<MovementType, string> = {
  IN:         'Registrar entrada',
  OUT:        'Registrar uso',
  ADJUSTMENT: 'Ajuste de inventario',
}

export function MovementForm({ open, onClose, item, movementType }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const queryClient = useQueryClient()

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<RegisterMovementValues>({
    resolver: zodResolver(registerMovementSchema),
    defaultValues: {
      item_id:       item.id,
      movement_type: movementType,
      quantity:      undefined,
      notes:         '',
    },
  })

  const quantityValue = watch('quantity')

  // Compute preview
  const qty = Number.isFinite(quantityValue) && quantityValue > 0 ? quantityValue : 0
  let previewQty: number
  if (movementType === 'IN')         previewQty = item.quantity_current + qty
  else if (movementType === 'OUT')   previewQty = Math.max(item.quantity_current - qty, 0)
  else                               previewQty = qty  // ADJUSTMENT

  const previewStatus = getSupplyStatus({ ...item, quantity_current: previewQty })
  const willGoRed     = previewStatus === 'critical' || previewStatus === 'empty'

  async function onSubmit(values: RegisterMovementValues) {
    setSubmitting(true)
    const res = await registerMovement(values)
    setSubmitting(false)

    if (res.error) { toast.error(res.error); return }
    queryClient.invalidateQueries({ queryKey: ['supply-categories'] })
    toast.success('Movimiento registrado')
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">
            {TITLE_MAP[movementType]}
          </DialogTitle>
        </DialogHeader>

        {/* Current stock */}
        <div className="bg-muted px-4 py-3 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Stock actual</span>
          <span className="text-2xl font-bold tabular-nums">
            {item.quantity_current} <span className="text-sm font-normal text-foreground/50">{item.unit}</span>
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('item_id', { valueAsNumber: true })} />
          <input type="hidden" {...register('movement_type')} />

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
              {movementType === 'ADJUSTMENT' ? 'Nuevo valor absoluto' : 'Cantidad'} ({item.unit}) *
            </label>
            <input
              {...register('quantity', { valueAsNumber: true })}
              type="number"
              min={1}
              max={movementType === 'OUT' ? item.quantity_current : undefined}
              className="w-full h-10 border border-border bg-background px-3 text-lg font-bold outline-none focus:border-foreground/40 transition-colors tabular-nums"
              placeholder={movementType === 'ADJUSTMENT' ? `Ej. ${item.quantity_minimum}` : '0'}
            />
            {errors.quantity && <p className="text-[10px] text-destructive mt-1">{errors.quantity.message}</p>}
            {movementType === 'OUT' && (
              <p className="text-[9px] text-foreground/40 mt-1">Máximo: {item.quantity_current} {item.unit}</p>
            )}
            {movementType === 'ADJUSTMENT' && (
              <p className="text-[9px] text-foreground/40 mt-1">
                Este valor reemplazará el stock actual directamente.
              </p>
            )}
          </div>

          {/* Preview */}
          {qty > 0 && (
            <div className={cn(
              'border px-4 py-3 space-y-1',
              willGoRed ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : 'border-border'
            )}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Stock quedará en</span>
                <span className={cn('text-xl font-bold tabular-nums', STATUS_COLOR[previewStatus])}>
                  {previewQty} {item.unit}
                </span>
              </div>
              <div className="w-full h-1.5 bg-muted overflow-hidden">
                <div
                  className={cn('h-full transition-all', STATUS_BG[previewStatus])}
                  style={{
                    width: `${Math.min(100, Math.round(
                      (previewQty / Math.max(item.quantity_warning ?? Math.ceil(item.quantity_minimum * 1.5), 1)) * 100
                    ))}%`
                  }}
                />
              </div>
              {willGoRed && (
                <div className="flex items-start gap-1.5 pt-1">
                  <AlertTriangle className="size-3 shrink-0 text-red-500 mt-0.5" />
                  <p className="text-[10px] text-red-600 dark:text-red-400">
                    Este movimiento dejará el stock bajo el mínimo. Se enviará una alerta automáticamente.
                  </p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
              Notas {movementType === 'ADJUSTMENT' && '*'}
            </label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40 transition-colors resize-none"
              placeholder={
                movementType === 'ADJUSTMENT'
                  ? 'Describe el motivo del ajuste (requerido)'
                  : 'Notas opcionales...'
              }
            />
            {errors.notes && <p className="text-[10px] text-destructive mt-1">{errors.notes.message}</p>}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { reset(); onClose() }}
              className="flex-1 h-9 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-9 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Registrando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
