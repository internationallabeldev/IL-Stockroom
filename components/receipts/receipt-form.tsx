'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2 } from 'lucide-react'
import { createInkReceipt, createPaperReceipt } from '@/actions/receipts.actions'
import { cn } from '@/lib/utils'

export type ReceiptItemContext = {
  id: number
  materialType: 'INK' | 'PAPER'
  catalogCode: string
  catalogName: string
  unitsOrdered: number
  unitsReceived: number
  kgPerUnit?: number
  lengthMPerUnit?: number
  widthM?: number
}

type Props = {
  open: boolean
  onClose: () => void
  item: ReceiptItemContext | null
}

const inputCls = 'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

export function ReceiptForm({ open, onClose, item }: Props) {
  if (!open || !item) return null
  return item.materialType === 'INK'
    ? <InkReceiptForm item={item} onClose={onClose} />
    : <PaperReceiptForm item={item} onClose={onClose} />
}

// ─── Ink form ──────────────────────────────────────────────────────────────────

const inkSchema = z.object({
  purchase_order_item_id: z.number().int().positive(),
  receipt_date:           z.string().min(1, 'Requerido'),
  invoice_remission:      z.string().min(1, 'Requerido'),
  provider_batch:         z.string().min(1, 'Requerido'),
  internal_batch:         z.string().min(1, 'Requerido'),
  units_received:         z.number().int().min(1, 'Mínimo 1'),
  kg_received:            z.number().positive('Mayor a 0'),
  quality_certificate:    z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']),
  quality_notes:          z.string().optional(),
})
type InkValues = z.infer<typeof inkSchema>

function InkReceiptForm({ item, onClose }: { item: ReceiptItemContext; onClose: () => void }) {
  const today     = new Date().toISOString().split('T')[0]
  const remaining = item.unitsOrdered - item.unitsReceived

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<InkValues>({
      resolver: zodResolver(inkSchema),
      defaultValues: {
        purchase_order_item_id: item.id,
        receipt_date:           today,
        invoice_remission:      '',
        provider_batch:         '',
        internal_batch:         '',
        units_received:         Math.max(1, remaining),
        kg_received:            +(((item.kgPerUnit ?? 0) * Math.max(1, remaining)).toFixed(3)),
        quality_certificate:    'PENDING',
        quality_notes:          '',
      },
    })

  useEffect(() => {
    reset({
      purchase_order_item_id: item.id,
      receipt_date:           today,
      invoice_remission:      '',
      provider_batch:         '',
      internal_batch:         '',
      units_received:         Math.max(1, remaining),
      kg_received:            +(((item.kgPerUnit ?? 0) * Math.max(1, remaining)).toFixed(3)),
      quality_certificate:    'PENDING',
      quality_notes:          '',
    })
  }, [item.id])  // eslint-disable-line react-hooks/exhaustive-deps

  const unitsVal = watch('units_received')

  async function onSubmit(data: InkValues) {
    const res = await createInkReceipt(data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Recepción registrada')
    onClose()
  }

  return (
    <Drawer item={item} onClose={onClose} isSubmitting={isSubmitting} onSubmitClick={handleSubmit(onSubmit)}>
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <input type="hidden" {...register('purchase_order_item_id', { valueAsNumber: true })} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de recepción *" error={errors.receipt_date?.message}>
            <input {...register('receipt_date')} type="date" className={inputCls} />
          </Field>
          <Field label="Unidades recibidas *" error={errors.units_received?.message}>
            <input {...register('units_received', { valueAsNumber: true })} type="number" min={1} className={inputCls} />
          </Field>
        </div>

        <Field label="Remisión / Factura *" error={errors.invoice_remission?.message}>
          <input {...register('invoice_remission')} placeholder="REM-2025-001" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Lote proveedor *" error={errors.provider_batch?.message}>
            <input {...register('provider_batch')} placeholder="PROV-LOT-001" className={inputCls} />
          </Field>
          <Field label="Lote interno *" error={errors.internal_batch?.message}>
            <input {...register('internal_batch')} placeholder="IL-TINT-001" className={inputCls} />
          </Field>
        </div>

        <Field label="KG recibidos *" error={errors.kg_received?.message}>
          <div className="flex gap-2">
            <input
              {...register('kg_received', { valueAsNumber: true })}
              type="number" step="0.001" min="0"
              className={inputCls}
            />
            {item.kgPerUnit && (
              <button
                type="button"
                onClick={() => setValue('kg_received', +((item.kgPerUnit! * (unitsVal || 0)).toFixed(3)))}
                className="shrink-0 h-9 px-3 border border-[#1A1A1A]/20 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] hover:bg-[#E5E1D8] transition-colors"
              >
                Auto
              </button>
            )}
          </div>
          {item.kgPerUnit && (
            <p className="text-[10px] text-[#5f5e59] mt-1">Esperado: {(item.kgPerUnit * (unitsVal || 0)).toFixed(3)} kg</p>
          )}
        </Field>

        <QualitySection
          quality={watch('quality_certificate')}
          onQualityChange={v => setValue('quality_certificate', v)}
          qualityError={errors.quality_certificate?.message}
          notesProps={register('quality_notes')}
        />
      </form>
    </Drawer>
  )
}

// ─── Paper form ────────────────────────────────────────────────────────────────

const paperSchema = z.object({
  purchase_order_item_id: z.number().int().positive(),
  receipt_date:           z.string().min(1, 'Requerido'),
  invoice_remission:      z.string().min(1, 'Requerido'),
  provider_batch:         z.string().min(1, 'Requerido'),
  internal_batch:         z.string().min(1, 'Requerido'),
  units_received:         z.number().int().min(1, 'Mínimo 1'),
  length_m:               z.number().positive('Mayor a 0'),
  width_m:                z.number().positive('Mayor a 0'),
  quality_certificate:    z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CONDITIONAL']),
  quality_notes:          z.string().optional(),
})
type PaperValues = z.infer<typeof paperSchema>

function PaperReceiptForm({ item, onClose }: { item: ReceiptItemContext; onClose: () => void }) {
  const today     = new Date().toISOString().split('T')[0]
  const remaining = item.unitsOrdered - item.unitsReceived

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } =
    useForm<PaperValues>({
      resolver: zodResolver(paperSchema),
      defaultValues: {
        purchase_order_item_id: item.id,
        receipt_date:           today,
        invoice_remission:      '',
        provider_batch:         '',
        internal_batch:         '',
        units_received:         Math.max(1, remaining),
        length_m:               item.lengthMPerUnit ?? 0,
        width_m:                item.widthM ?? 0,
        quality_certificate:    'PENDING',
        quality_notes:          '',
      },
    })

  useEffect(() => {
    reset({
      purchase_order_item_id: item.id,
      receipt_date:           today,
      invoice_remission:      '',
      provider_batch:         '',
      internal_batch:         '',
      units_received:         Math.max(1, remaining),
      length_m:               item.lengthMPerUnit ?? 0,
      width_m:                item.widthM ?? 0,
      quality_certificate:    'PENDING',
      quality_notes:          '',
    })
  }, [item.id])  // eslint-disable-line react-hooks/exhaustive-deps

  const [lengthVal, widthVal, unitsVal] = watch(['length_m', 'width_m', 'units_received'])
  const totalM2 = (unitsVal || 0) * (lengthVal || 0) * (widthVal || 0)

  async function onSubmit(data: PaperValues) {
    const res = await createPaperReceipt(data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Recepción registrada')
    onClose()
  }

  return (
    <Drawer item={item} onClose={onClose} isSubmitting={isSubmitting} onSubmitClick={handleSubmit(onSubmit)}>
      <form onSubmit={handleSubmit(onSubmit)} className="contents">
        <input type="hidden" {...register('purchase_order_item_id', { valueAsNumber: true })} />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha de recepción *" error={errors.receipt_date?.message}>
            <input {...register('receipt_date')} type="date" className={inputCls} />
          </Field>
          <Field label="Unidades recibidas *" error={errors.units_received?.message}>
            <input {...register('units_received', { valueAsNumber: true })} type="number" min={1} className={inputCls} />
          </Field>
        </div>

        <Field label="Remisión / Factura *" error={errors.invoice_remission?.message}>
          <input {...register('invoice_remission')} placeholder="REM-2025-001" className={inputCls} />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Lote proveedor *" error={errors.provider_batch?.message}>
            <input {...register('provider_batch')} placeholder="PROV-LOT-001" className={inputCls} />
          </Field>
          <Field label="Lote interno *" error={errors.internal_batch?.message}>
            <input {...register('internal_batch')} placeholder="IL-PAP-001" className={inputCls} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Largo por rollo (m) *" error={errors.length_m?.message}>
            <input
              {...register('length_m', { valueAsNumber: true })}
              type="number" step="0.01" min="0"
              placeholder={String(item.lengthMPerUnit ?? '0')}
              className={inputCls}
            />
          </Field>
          <Field label="Ancho (m) *" error={errors.width_m?.message}>
            <input
              {...register('width_m', { valueAsNumber: true })}
              type="number" step="0.001" min="0"
              placeholder={String(item.widthM ?? '0')}
              className={inputCls}
            />
          </Field>
        </div>

        {totalM2 > 0 && (
          <p className="text-[10px] text-[#5f5e59] font-mono">Total recibido: {totalM2.toFixed(2)} m²</p>
        )}

        <QualitySection
          quality={watch('quality_certificate')}
          onQualityChange={v => setValue('quality_certificate', v)}
          qualityError={errors.quality_certificate?.message}
          notesProps={register('quality_notes')}
        />
      </form>
    </Drawer>
  )
}

// ─── Shared primitives ─────────────────────────────────────────────────────────

function Drawer({
  item,
  onClose,
  isSubmitting,
  onSubmitClick,
  children,
}: {
  item: ReceiptItemContext
  onClose: () => void
  isSubmitting: boolean
  onSubmitClick: () => void
  children: React.ReactNode
}) {
  const remaining = item.unitsOrdered - item.unitsReceived
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/15 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Registrar recepción</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              {item.catalogCode} — {item.catalogName}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Context bar */}
        <div className="px-6 py-3 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40 flex gap-6 text-[10px] shrink-0">
          <div>
            <p className="font-bold uppercase tracking-widest text-[#5f5e59]">Ordenado</p>
            <p className="font-mono text-[#1A1A1A] mt-0.5">{item.unitsOrdered} uds</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest text-[#5f5e59]">Recibido</p>
            <p className="font-mono text-[#1A1A1A] mt-0.5">{item.unitsReceived} uds</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest text-[#5f5e59]">Pendiente</p>
            <p className={cn('font-mono mt-0.5', remaining > 0 ? 'text-[#1A1A1A]' : 'text-green-600')}>
              {remaining} uds
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Footer — pinned, not scrollable */}
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
            onClick={onSubmitClick}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </div>
    </div>
  )
}

type QualityValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

function QualitySection({
  quality,
  onQualityChange,
  qualityError,
  notesProps,
}: {
  quality: QualityValue
  onQualityChange: (v: QualityValue) => void
  qualityError?: string
  notesProps: object
}) {
  return (
    <div className="border border-[#1A1A1A]/10">
      <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
        Certificado de calidad
      </p>
      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">Estado *</label>
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
          {qualityError && <p className="text-[10px] text-destructive mt-1">{qualityError}</p>}
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">Notas de calidad</label>
          <textarea
            {...(notesProps as any)}
            rows={2}
            placeholder="Observaciones..."
            className={inputCls + ' resize-none pt-2 h-auto'}
          />
        </div>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
