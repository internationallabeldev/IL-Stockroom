'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'
import { updateQualitySchema, type UpdateQualityValues } from '@/lib/validations/receipt.schema'
import { updateInkReceiptQuality, updatePaperReceiptQuality } from '@/actions/receipts.actions'
import { QualityBadge } from './quality-badge'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  receiptId: number
  materialType: 'INK' | 'PAPER'
  currentQuality: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'
  batchRef: string
}

const OPTIONS: Array<{ value: UpdateQualityValues['quality_certificate']; label: string }> = [
  { value: 'APPROVED',    label: 'Aprobar' },
  { value: 'REJECTED',    label: 'Rechazar' },
  { value: 'CONDITIONAL', label: 'Condicional' },
]

const inputCls = 'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

export function QualityUpdateForm({ open, onClose, receiptId, materialType, currentQuality, batchRef }: Props) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateQualityValues>({
    resolver: zodResolver(updateQualitySchema),
    defaultValues: { quality_certificate: undefined, quality_notes: '' },
  })

  const selected = watch('quality_certificate')

  async function onSubmit(data: UpdateQualityValues) {
    const action = materialType === 'INK' ? updateInkReceiptQuality : updatePaperReceiptQuality
    const res = await action(receiptId, data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Certificado de calidad actualizado')
    reset()
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[#F5F2EA] border border-[#1A1A1A]/15 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1A1A]/10">
          <div>
            <h3 className="font-heading text-lg font-bold tracking-tight">Actualizar calidad</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              Lote {batchRef}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-5 space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">Estado actual</p>
            <QualityBadge value={currentQuality} />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-2">Nuevo estado *</p>
            <div className="flex border border-[#1A1A1A]/20">
              {OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setValue('quality_certificate', o.value, { shouldValidate: true })}
                  className={cn(
                    'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                    selected === o.value
                      ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                      : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] hover:text-[#1A1A1A]'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {errors.quality_certificate && (
              <p className="text-[10px] text-destructive mt-1">{errors.quality_certificate.message}</p>
            )}
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">
              Notas (opcional)
            </label>
            <textarea
              {...register('quality_notes')}
              rows={3}
              placeholder="Observaciones del certificado..."
              className={inputCls + ' resize-none pt-2 h-auto'}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              {isSubmitting ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
