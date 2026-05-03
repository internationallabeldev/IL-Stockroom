'use client'

import { useEffect } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Layers } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createPaperRequisition, type PaperLot } from '@/actions/paper-inventory.actions'
import type { Database } from '@/types/database.types'

type PaperCatalogRow = Database['public']['Tables']['paper_catalog']['Row']

type Props = {
  open:              boolean
  onClose:           () => void
  preselectedPaper?: Pick<PaperCatalogRow, 'id' | 'name' | 'code' | 'weight_gsm'> | null
  availableLots:     PaperLot[]
}

const schema = z.object({
  paper_catalog_id:   z.number().int().positive('Selecciona un papel'),
  length_m_requested: z.number().positive('Debe ser mayor a 0'),
  width_m_requested:  z.number().positive('Debe ser mayor a 0'),
  production_order:   z.string().min(1, 'Requerido'),
  notes:              z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const inputCls = 'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5'
const errCls   = 'text-[10px] text-red-600 mt-1'

export function PaperRequisitionSheet({ open, onClose, preselectedPaper, availableLots }: Props) {
  const { register, handleSubmit, watch, setValue, reset, control, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { length_m_requested: 0, width_m_requested: 0, production_order: '', notes: '' },
    })

  const catalogId = watch('paper_catalog_id')
  const lengthReq = watch('length_m_requested')
  const widthReq  = watch('width_m_requested')

  useEffect(() => {
    if (preselectedPaper) setValue('paper_catalog_id', preselectedPaper.id)
  }, [preselectedPaper, setValue])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const activeLots = availableLots.filter(
    l => l.paper_catalog_id === catalogId && l.enabled && (l.remaining_m2 ?? 0) > 0
  )
  const availableM2  = activeLots.reduce((s, l) => s + (l.remaining_m2 ?? 0), 0)
  const maxWidthM    = activeLots.reduce((m, l) => Math.max(m, l.initial_width_m), 0)
  const requestedM2  = (lengthReq || 0) * (widthReq || 0)
  const widthWarning = widthReq > 0 && maxWidthM > 0 && widthReq > maxWidthM
  const stockLow     = requestedM2 > 0 && requestedM2 > availableM2

  const uniqueCatalogs = Array.from(
    new Map(
      availableLots
        .filter(l => l.enabled && (l.remaining_m2 ?? 0) > 0 && l.paper_catalog)
        .map(l => [l.paper_catalog_id, l.paper_catalog!])
    ).values()
  )

  async function onSubmit(data: FormValues) {
    const res = await createPaperRequisition(data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Requisición creada')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto bg-[#F5F2EA] border-l border-[#1A1A1A]/15 p-0">
        <SheetHeader className="px-6 py-5 border-b border-[#1A1A1A]/10">
          <SheetTitle className="font-heading text-xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="size-5" />
            Solicitar material
          </SheetTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            Requisición de papel para producción
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          {/* Papel */}
          <div>
            <label className={labelCls}>Papel *</label>
            {preselectedPaper ? (
              <div className="h-9 border border-[#1A1A1A]/20 bg-[#E5E1D8]/40 px-3 flex items-center text-sm font-medium gap-2">
                <span>{preselectedPaper.code} — {preselectedPaper.name}</span>
                {preselectedPaper.weight_gsm && (
                  <span className="text-[10px] font-mono text-[#5f5e59]">{preselectedPaper.weight_gsm} g/m²</span>
                )}
              </div>
            ) : (
              <select
                {...register('paper_catalog_id', { valueAsNumber: true })}
                className={inputCls}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar papel…</option>
                {uniqueCatalogs.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}{c.weight_gsm ? ` (${c.weight_gsm} g/m²)` : ''}
                  </option>
                ))}
              </select>
            )}
            {errors.paper_catalog_id && <p className={errCls}>{errors.paper_catalog_id.message}</p>}
          </div>

          {/* Stock info */}
          {catalogId > 0 && (
            <div className="border border-[#1A1A1A]/10 bg-[#E5E1D8]/30 px-3 py-2 text-[11px] font-mono text-[#5f5e59] space-y-0.5">
              <p>Stock disponible: <span className="font-bold text-[#1A1A1A]">{availableM2.toFixed(2)} m²</span></p>
              {maxWidthM > 0 && (
                <p>Ancho máx. disponible: <span className="font-bold text-[#1A1A1A]">{maxWidthM.toFixed(2)} m</span></p>
              )}
            </div>
          )}

          {/* Dimensiones */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Largo solicitado (m) *</label>
              <input
                {...register('length_m_requested', { valueAsNumber: true })}
                type="number" step="0.01" min="0.01"
                className={inputCls}
              />
              {errors.length_m_requested && <p className={errCls}>{errors.length_m_requested.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Ancho solicitado (m) *</label>
              <input
                {...register('width_m_requested', { valueAsNumber: true })}
                type="number" step="0.01" min="0.01"
                className={inputCls}
              />
              {errors.width_m_requested && <p className={errCls}>{errors.width_m_requested.message}</p>}
            </div>
          </div>

          {/* M² en tiempo real */}
          {requestedM2 > 0 && (
            <div className={`px-3 py-2 border text-[11px] font-mono space-y-1 ${stockLow ? 'border-red-200 bg-red-50' : 'border-[#1A1A1A]/10 bg-[#E5E1D8]/20'}`}>
              <p className={stockLow ? 'text-red-700' : 'text-[#5f5e59]'}>
                M² solicitados: <span className="font-bold text-[#1A1A1A]">{requestedM2.toFixed(2)} m²</span>
                {stockLow && ' — stock insuficiente'}
              </p>
              {widthWarning && (
                <p className="text-yellow-700 text-[10px]">
                  ⚠ El ancho solicitado supera el máximo disponible ({maxWidthM.toFixed(2)} m).
                  Considera el corte físico.
                </p>
              )}
            </div>
          )}

          {/* Orden de producción */}
          <div>
            <label className={labelCls}>Orden de producción *</label>
            <input
              {...register('production_order')}
              placeholder="OP-2025-001"
              className={inputCls}
            />
            {errors.production_order && <p className={errCls}>{errors.production_order.message}</p>}
          </div>

          {/* Notas */}
          <div>
            <label className={labelCls}>Notas (opcional)</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Observaciones…"
              className={inputCls + ' resize-none pt-2 h-auto'}
            />
          </div>

          <div className="flex gap-3 pt-2">
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
              className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              {isSubmitting && <Loader2 className="size-3 animate-spin" />}
              {isSubmitting ? 'Enviando…' : 'Solicitar'}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
