'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2, Paperclip, CheckCircle2, XCircle } from 'lucide-react'
import { createInkReceipt, createPaperReceipt, uploadCertificate } from '@/actions/receipts.actions'
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

const inputCls = 'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors'

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
  certificate_url:        z.string().nullable().optional(),
})
type InkValues = z.infer<typeof inkSchema>

function InkReceiptForm({ item, onClose }: { item: ReceiptItemContext; onClose: () => void }) {
  const today     = new Date().toISOString().split('T')[0]
  const remaining = item.unitsOrdered - item.unitsReceived
  const [certUrl,   setCertUrl]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
        certificate_url:        null,
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadCertificate(fd)
    setUploading(false)
    if (res.error) { toast.error(res.error); return }
    setCertUrl(res.url ?? null)
    setValue('certificate_url', res.url ?? null)
    toast.success('Certificado subido')
  }

  async function onSubmit(data: InkValues) {
    const res = await createInkReceipt({ ...data, certificate_url: certUrl })
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
                className="shrink-0 h-9 px-3 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted transition-colors"
              >
                Auto
              </button>
            )}
          </div>
          {item.kgPerUnit && (
            <p className="text-[10px] text-muted-foreground mt-1">Esperado: {(item.kgPerUnit * (unitsVal || 0)).toFixed(3)} kg</p>
          )}
        </Field>

        <QualitySection
          quality={watch('quality_certificate')}
          onQualityChange={v => setValue('quality_certificate', v)}
          qualityError={errors.quality_certificate?.message}
          notesProps={register('quality_notes')}
          certUrl={certUrl}
          uploading={uploading}
          fileRef={fileRef}
          onFileChange={handleFileChange}
          onCertRemove={() => { setCertUrl(null); setValue('certificate_url', null); if (fileRef.current) fileRef.current.value = '' }}
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
  certificate_url:        z.string().nullable().optional(),
})
type PaperValues = z.infer<typeof paperSchema>

function PaperReceiptForm({ item, onClose }: { item: ReceiptItemContext; onClose: () => void }) {
  const today     = new Date().toISOString().split('T')[0]
  const remaining = item.unitsOrdered - item.unitsReceived
  const [certUrl,   setCertUrl]   = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

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
        certificate_url:        null,
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

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadCertificate(fd)
    setUploading(false)
    if (res.error) { toast.error(res.error); return }
    setCertUrl(res.url ?? null)
    setValue('certificate_url', res.url ?? null)
    toast.success('Certificado subido')
  }

  async function onSubmit(data: PaperValues) {
    const res = await createPaperReceipt({ ...data, certificate_url: certUrl })
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
          <p className="text-[10px] text-muted-foreground font-mono">Total recibido: {totalM2.toFixed(2)} m²</p>
        )}

        <QualitySection
          quality={watch('quality_certificate')}
          onQualityChange={v => setValue('quality_certificate', v)}
          qualityError={errors.quality_certificate?.message}
          notesProps={register('quality_notes')}
          certUrl={certUrl}
          uploading={uploading}
          fileRef={fileRef}
          onFileChange={handleFileChange}
          onCertRemove={() => { setCertUrl(null); setValue('certificate_url', null); if (fileRef.current) fileRef.current.value = '' }}
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l border-border flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Registrar recepción</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              {item.catalogCode} — {item.catalogName}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Context bar */}
        <div className="px-6 py-3 border-b border-border/50 bg-muted/40 flex gap-6 text-[10px] shrink-0">
          <div>
            <p className="font-bold uppercase tracking-widest text-muted-foreground">Ordenado</p>
            <p className="font-mono mt-0.5">{item.unitsOrdered} uds</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest text-muted-foreground">Recibido</p>
            <p className="font-mono mt-0.5">{item.unitsReceived} uds</p>
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest text-muted-foreground">Pendiente</p>
            <p className={cn('font-mono mt-0.5', remaining > 0 ? '' : 'text-green-600')}>
              {remaining} uds
            </p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {children}
        </div>

        {/* Footer — pinned, not scrollable */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSubmitClick}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
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
  certUrl,
  uploading,
  fileRef,
  onFileChange,
  onCertRemove,
}: {
  quality:        QualityValue
  onQualityChange:(v: QualityValue) => void
  qualityError?:  string
  notesProps:     object
  certUrl:        string | null
  uploading:      boolean
  fileRef:        React.RefObject<HTMLInputElement | null>
  onFileChange:   (e: React.ChangeEvent<HTMLInputElement>) => void
  onCertRemove:   () => void
}) {
  return (
    <div className="border border-border/50">
      <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30">
        Certificado de calidad
      </p>
      <div className="px-4 py-3 space-y-3">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Estado *</label>
          <div className="flex border border-border">
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(q => (
              <button
                key={q}
                type="button"
                onClick={() => { if (q !== 'APPROVED') onCertRemove(); onQualityChange(q) }}
                className={cn(
                  'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                  quality === q
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {q === 'PENDING' ? 'Pendiente' : q === 'APPROVED' ? 'Aprobado' : 'Rechazado'}
              </button>
            ))}
          </div>
          {qualityError && <p className="text-[10px] text-destructive mt-1">{qualityError}</p>}
        </div>

        {/* Certificate file — only when approved */}
        {quality === 'APPROVED' && <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
            Archivo del certificado (PDF / imagen)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="h-9 px-3 flex items-center gap-1.5 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Paperclip className="size-3" />}
              {uploading ? 'Subiendo...' : 'Adjuntar'}
            </button>
            {certUrl && (
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-green-600" />
                <a href={certUrl} target="_blank" rel="noreferrer"
                  className="text-[10px] font-bold text-green-700 underline underline-offset-2">
                  Ver certificado
                </a>
                <button type="button" onClick={onCertRemove} className="text-muted-foreground hover:text-red-600 transition-colors">
                  <XCircle className="size-3.5" />
                </button>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden" onChange={onFileChange} />
        </div>}

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">Notas de calidad</label>
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
