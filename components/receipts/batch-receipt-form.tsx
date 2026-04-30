'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2, Copy } from 'lucide-react'
import { createInkReceipt, createPaperReceipt, type OrderWithReceipts } from '@/actions/receipts.actions'
import { cn } from '@/lib/utils'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  open:    boolean
  onClose: () => void
  order:   OrderWithReceipts
}

// ─── Schemas ───────────────────────────────────────────────────────────────────

const sharedFields = {
  receipt_date:        z.string().min(1, 'Requerido'),
  invoice_remission:   z.string().min(1, 'Requerido'),
  quality_certificate: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']),
  quality_notes:       z.string().optional(),
}

const inkBatchSchema = z.object({
  ...sharedFields,
  items: z.array(z.object({
    purchase_order_item_id: z.number(),
    skip:           z.boolean(),
    provider_batch: z.string(),
    internal_batch: z.string(),
    units_received: z.number().int(),
    kg_received:    z.number(),
  })),
})

const paperBatchSchema = z.object({
  ...sharedFields,
  items: z.array(z.object({
    purchase_order_item_id: z.number(),
    skip:           z.boolean(),
    provider_batch: z.string(),
    internal_batch: z.string(),
    units_received: z.number().int(),
    length_m:       z.number(),
    width_m:        z.number(),
  })),
})

type InkBatchValues   = z.infer<typeof inkBatchSchema>
type PaperBatchValues = z.infer<typeof paperBatchSchema>

// ─── Entry ─────────────────────────────────────────────────────────────────────

export function BatchReceiptForm({ open, onClose, order }: Props) {
  if (!open) return null
  return order.material_type === 'INK'
    ? <InkBatchForm   order={order} onClose={onClose} />
    : <PaperBatchForm order={order} onClose={onClose} />
}

// ─── Ink batch ─────────────────────────────────────────────────────────────────

function InkBatchForm({ order, onClose }: { order: OrderWithReceipts; onClose: () => void }) {
  const today            = new Date().toISOString().split('T')[0]
  const incompleteItems  = order.ink_items.filter(i => !i.is_complete)

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<InkBatchValues>({
      resolver: zodResolver(inkBatchSchema),
      defaultValues: {
        receipt_date:        today,
        invoice_remission:   '',
        quality_certificate: 'PENDING',
        quality_notes:       '',
        items: incompleteItems.map(item => {
          const remaining = Math.max(1, item.units_ordered - (item.units_received ?? 0))
          return {
            purchase_order_item_id: item.id,
            skip:           false,
            provider_batch: '',
            internal_batch: '',
            units_received: remaining,
            kg_received:    +((item.kg_per_unit * remaining).toFixed(3)),
          }
        }),
      },
    })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems  = watch('items')
  const quality       = watch('quality_certificate')
  const activeCount   = watchedItems.filter(i => !i.skip).length

  function applyProviderBatchToAll() {
    const first = watchedItems[0]?.provider_batch
    if (!first) return
    fields.forEach((_, i) => setValue(`items.${i}.provider_batch`, first))
  }

  async function onSubmit(data: InkBatchValues) {
    const active = data.items.filter(i => !i.skip)
    if (active.length === 0) { toast.error('Selecciona al menos un artículo'); return }

    const errs: string[] = []
    for (const item of active) {
      const res = await createInkReceipt({
        purchase_order_item_id: item.purchase_order_item_id,
        receipt_date:           data.receipt_date,
        invoice_remission:      data.invoice_remission,
        provider_batch:         item.provider_batch,
        internal_batch:         item.internal_batch,
        units_received:         item.units_received,
        kg_received:            item.kg_received,
        quality_certificate:    data.quality_certificate,
        quality_notes:          data.quality_notes,
      })
      if (res.error) errs.push(`${item.internal_batch || 'art.'}: ${res.error}`)
    }

    if (errs.length > 0) toast.error(errs.join(' · '))
    else { toast.success(`${active.length} recepción${active.length !== 1 ? 'es' : ''} registrada${active.length !== 1 ? 's' : ''}`); onClose() }
  }

  return (
    <BatchDrawer
      order={order}
      itemCount={incompleteItems.length}
      activeCount={activeCount}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      quality={quality}
      onQualityChange={v => setValue('quality_certificate', v)}
      sharedFields={
        <SharedFields
          register={register}
          errors={errors}
          onApplyProvider={applyProviderBatchToAll}
        />
      }
    >
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#E5E1D8]/40 border-b border-[#1A1A1A]/10">
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] w-6" />
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Material</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote prov.</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote interno</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Uds</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">KG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1A1A]/8">
          {fields.map((field, i) => {
            const item    = incompleteItems[i]
            const skipped = watchedItems[i]?.skip
            return (
              <tr key={field.id} className={cn('transition-colors', skipped ? 'opacity-40 bg-[#E5E1D8]/10' : 'hover:bg-[#E5E1D8]/20')}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    title="No llegó"
                    {...register(`items.${i}.skip`)}
                    className="size-3.5 cursor-pointer accent-[#1A1A1A]"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-mono text-[10px] text-[#5f5e59]">{item.ink_catalog?.code}</p>
                  <p className="font-medium text-[#1A1A1A]">{item.ink_catalog?.name}</p>
                  <p className="text-[9px] text-[#5f5e59]">{item.units_received ?? 0}/{item.units_ordered} recibido</p>
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.provider_batch`)}
                    disabled={skipped}
                    placeholder="PROV-LOT"
                    className={cn(cellInputCls, 'w-28')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.internal_batch`)}
                    disabled={skipped}
                    placeholder="IL-TINT-001"
                    className={cn(cellInputCls, 'w-28')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.units_received`, { valueAsNumber: true })}
                    type="number" min={1} disabled={skipped}
                    className={cn(cellInputCls, 'w-16')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.kg_received`, { valueAsNumber: true })}
                    type="number" step="0.001" min="0" disabled={skipped}
                    className={cn(cellInputCls, 'w-20')}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </BatchDrawer>
  )
}

// ─── Paper batch ───────────────────────────────────────────────────────────────

function PaperBatchForm({ order, onClose }: { order: OrderWithReceipts; onClose: () => void }) {
  const today           = new Date().toISOString().split('T')[0]
  const incompleteItems = order.paper_items.filter(i => !i.is_complete)

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<PaperBatchValues>({
      resolver: zodResolver(paperBatchSchema),
      defaultValues: {
        receipt_date:        today,
        invoice_remission:   '',
        quality_certificate: 'PENDING',
        quality_notes:       '',
        items: incompleteItems.map(item => ({
          purchase_order_item_id: item.id,
          skip:           false,
          provider_batch: '',
          internal_batch: '',
          units_received: Math.max(1, item.units_ordered - (item.units_received ?? 0)),
          length_m:       item.length_m_per_unit,
          width_m:        item.width_m,
        })),
      },
    })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const quality      = watch('quality_certificate')
  const activeCount  = watchedItems.filter(i => !i.skip).length

  function applyProviderBatchToAll() {
    const first = watchedItems[0]?.provider_batch
    if (!first) return
    fields.forEach((_, i) => setValue(`items.${i}.provider_batch`, first))
  }

  async function onSubmit(data: PaperBatchValues) {
    const active = data.items.filter(i => !i.skip)
    if (active.length === 0) { toast.error('Selecciona al menos un artículo'); return }

    const errs: string[] = []
    for (const item of active) {
      const res = await createPaperReceipt({
        purchase_order_item_id: item.purchase_order_item_id,
        receipt_date:           data.receipt_date,
        invoice_remission:      data.invoice_remission,
        provider_batch:         item.provider_batch,
        internal_batch:         item.internal_batch,
        units_received:         item.units_received,
        length_m:               item.length_m,
        width_m:                item.width_m,
        quality_certificate:    data.quality_certificate,
        quality_notes:          data.quality_notes,
      })
      if (res.error) errs.push(`${item.internal_batch || 'art.'}: ${res.error}`)
    }

    if (errs.length > 0) toast.error(errs.join(' · '))
    else { toast.success(`${active.length} recepción${active.length !== 1 ? 'es' : ''} registrada${active.length !== 1 ? 's' : ''}`); onClose() }
  }

  return (
    <BatchDrawer
      order={order}
      itemCount={incompleteItems.length}
      activeCount={activeCount}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      quality={quality}
      onQualityChange={v => setValue('quality_certificate', v)}
      sharedFields={
        <SharedFields
          register={register}
          errors={errors}
          onApplyProvider={applyProviderBatchToAll}
        />
      }
    >
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#E5E1D8]/40 border-b border-[#1A1A1A]/10">
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] w-6" />
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Material</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote prov.</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Lote interno</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Rollos</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Largo m</th>
            <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">Ancho m</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1A1A1A]/8">
          {fields.map((field, i) => {
            const item    = incompleteItems[i]
            const skipped = watchedItems[i]?.skip
            const [u, l, w] = [watchedItems[i]?.units_received, watchedItems[i]?.length_m, watchedItems[i]?.width_m]
            const m2 = (u || 0) * (l || 0) * (w || 0)
            return (
              <tr key={field.id} className={cn('transition-colors', skipped ? 'opacity-40 bg-[#E5E1D8]/10' : 'hover:bg-[#E5E1D8]/20')}>
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    title="No llegó"
                    {...register(`items.${i}.skip`)}
                    className="size-3.5 cursor-pointer accent-[#1A1A1A]"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-mono text-[10px] text-[#5f5e59]">{item.paper_catalog?.code}</p>
                  <p className="font-medium text-[#1A1A1A]">{item.paper_catalog?.name}</p>
                  <p className="text-[9px] text-[#5f5e59]">{item.units_received ?? 0}/{item.units_ordered} recibido</p>
                  {m2 > 0 && !skipped && (
                    <p className="text-[9px] font-mono text-[#5f5e59]">{m2.toFixed(1)} m²</p>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.provider_batch`)}
                    disabled={skipped}
                    placeholder="PROV-LOT"
                    className={cn(cellInputCls, 'w-28')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.internal_batch`)}
                    disabled={skipped}
                    placeholder="IL-PAP-001"
                    className={cn(cellInputCls, 'w-28')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.units_received`, { valueAsNumber: true })}
                    type="number" min={1} disabled={skipped}
                    className={cn(cellInputCls, 'w-16')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.length_m`, { valueAsNumber: true })}
                    type="number" step="0.01" min="0" disabled={skipped}
                    className={cn(cellInputCls, 'w-20')}
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    {...register(`items.${i}.width_m`, { valueAsNumber: true })}
                    type="number" step="0.001" min="0" disabled={skipped}
                    className={cn(cellInputCls, 'w-20')}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </BatchDrawer>
  )
}

// ─── Shared layout ─────────────────────────────────────────────────────────────

type QualityValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

function BatchDrawer({
  order,
  itemCount,
  activeCount,
  isSubmitting,
  onClose,
  onSubmit,
  quality,
  onQualityChange,
  sharedFields,
  children,
}: {
  order:            OrderWithReceipts
  itemCount:        number
  activeCount:      number
  isSubmitting:     boolean
  onClose:          () => void
  onSubmit:         () => void
  quality:          QualityValue
  onQualityChange:  (v: QualityValue) => void
  sharedFields:     React.ReactNode
  children:         React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-4xl bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/15 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Recepción masiva</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              OC-{String(order.order_number).padStart(4, '0')} · {order.providers?.name} · {itemCount} artículo{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Shared data */}
          <div className="border border-[#1A1A1A]/10">
            <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
              Datos comunes a todos los artículos
            </p>
            <div className="px-4 py-3 space-y-3">
              {sharedFields}

              {/* Quality */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">
                  Certificado de calidad
                </label>
                <div className="flex border border-[#1A1A1A]/20">
                  {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => onQualityChange(q)}
                      className={cn(
                        'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                        quality === q
                          ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                          : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] hover:text-[#1A1A1A]'
                      )}
                    >
                      {q === 'PENDING' ? 'Pendiente' : q === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="border border-[#1A1A1A]/10">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Artículos — marca <span className="text-[#1A1A1A]">✓</span> los que <span className="italic">no llegaron</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              {children}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1A1A1A]/15 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || activeCount === 0}
            className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3 animate-spin" />}
            {isSubmitting
              ? 'Guardando...'
              : `Registrar ${activeCount} recepción${activeCount !== 1 ? 'es' : ''}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}

function SharedFields({
  register,
  errors,
  onApplyProvider,
}: {
  register:        any
  errors:          any
  onApplyProvider: () => void
}) {
  const inputCls = 'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">Fecha *</label>
          <input {...register('receipt_date')} type="date" className={inputCls} />
          {errors.receipt_date && <p className="text-[10px] text-destructive mt-1">{errors.receipt_date.message}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">Remisión / Factura *</label>
          <input {...register('invoice_remission')} placeholder="REM-2025-001" className={inputCls} />
          {errors.invoice_remission && <p className="text-[10px] text-destructive mt-1">{errors.invoice_remission.message}</p>}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">
            Lote proveedor (primer artículo)
          </label>
          <input
            {...register('items.0.provider_batch')}
            placeholder="PROV-LOT-001"
            className={inputCls}
          />
        </div>
        <button
          type="button"
          onClick={onApplyProvider}
          title="Aplicar a todos los artículos"
          className="h-9 px-3 flex items-center gap-1.5 border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:bg-[#E5E1D8] hover:text-[#1A1A1A] transition-colors shrink-0"
        >
          <Copy className="size-3" />
          Aplicar a todos
        </button>
      </div>
    </div>
  )
}

const cellInputCls = 'h-8 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-2 text-xs outline-none focus:border-[#1A1A1A]/40 transition-colors disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed'
