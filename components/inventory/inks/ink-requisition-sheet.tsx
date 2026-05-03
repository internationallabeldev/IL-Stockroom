'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, FlaskConical } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createRequisition, type InkLot } from '@/actions/ink-inventory.actions'
import type { Database } from '@/types/database.types'

type InkCatalogRow = Database['public']['Tables']['ink_catalog']['Row']

type Props = {
  open:            boolean
  onClose:         () => void
  preselectedInk?: Pick<InkCatalogRow, 'id' | 'name' | 'code'> | null
  availableLots:   InkLot[]
}

const schema = z.object({
  ink_catalog_id:   z.number().int().positive('Selecciona una tinta'),
  kg_requested:     z.number().positive('Debe ser mayor a 0'),
  production_order: z.string().min(1, 'Requerido'),
  notes:            z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const inputCls = 'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'
const labelCls = 'text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5'
const errCls   = 'text-[10px] text-red-600 mt-1'

export function InkRequisitionSheet({ open, onClose, preselectedInk, availableLots }: Props) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { kg_requested: 0, production_order: '', notes: '' },
    })

  const catalogId   = watch('ink_catalog_id')
  const kgRequested = watch('kg_requested')

  useEffect(() => {
    if (preselectedInk) setValue('ink_catalog_id', preselectedInk.id)
  }, [preselectedInk, setValue])

  useEffect(() => {
    if (!open) reset()
  }, [open, reset])

  const availableKg = availableLots
    .filter(l => l.ink_catalog_id === catalogId && l.enabled && (l.remaining_kg ?? 0) > 0)
    .reduce((s, l) => s + (l.remaining_kg ?? 0), 0)

  const kgDelta   = availableKg - (kgRequested || 0)
  const kgInsuff  = kgRequested > 0 && kgDelta < 0

  const uniqueCatalogs = Array.from(
    new Map(
      availableLots
        .filter(l => l.enabled && (l.remaining_kg ?? 0) > 0 && l.ink_catalog)
        .map(l => [l.ink_catalog_id, l.ink_catalog!])
    ).values()
  )

  async function onSubmit(data: FormValues) {
    if (kgInsuff) { toast.error('No hay suficiente stock disponible'); return }
    const res = await createRequisition(data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Requisición creada')
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent side="right" className="w-full max-w-md overflow-y-auto bg-[#F5F2EA] border-l border-[#1A1A1A]/15 p-0">
        <SheetHeader className="px-6 py-5 border-b border-[#1A1A1A]/10">
          <SheetTitle className="font-heading text-xl font-bold tracking-tight flex items-center gap-2">
            <FlaskConical className="size-5" />
            Solicitar material
          </SheetTitle>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
            Requisición de tinta para producción
          </p>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">

          {/* Tinta */}
          <div>
            <label className={labelCls}>Tinta *</label>
            {preselectedInk ? (
              <div className="h-9 border border-[#1A1A1A]/20 bg-[#E5E1D8]/40 px-3 flex items-center text-sm font-medium">
                {preselectedInk.code} — {preselectedInk.name}
              </div>
            ) : (
              <select
                {...register('ink_catalog_id', { valueAsNumber: true })}
                className={inputCls}
                defaultValue=""
              >
                <option value="" disabled>Seleccionar tinta…</option>
                {uniqueCatalogs.map(c => (
                  <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                ))}
              </select>
            )}
            {errors.ink_catalog_id && <p className={errCls}>{errors.ink_catalog_id.message}</p>}
          </div>

          {/* Stock info */}
          {catalogId > 0 && (
            <div className={`px-3 py-2 border text-[11px] font-mono ${kgInsuff ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#1A1A1A]/10 bg-[#E5E1D8]/30 text-[#5f5e59]'}`}>
              {kgInsuff
                ? `Stock insuficiente — faltan ${Math.abs(kgDelta).toFixed(1)} kg`
                : `Stock disponible: ${availableKg.toFixed(1)} kg`
              }
            </div>
          )}

          {/* KG solicitados */}
          <div>
            <label className={labelCls}>KG solicitados *</label>
            <input
              {...register('kg_requested', { valueAsNumber: true })}
              type="number" step="0.001" min="0.001"
              className={inputCls}
            />
            {errors.kg_requested && <p className={errCls}>{errors.kg_requested.message}</p>}
          </div>

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

          {/* Buttons */}
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
              disabled={isSubmitting || kgInsuff}
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
