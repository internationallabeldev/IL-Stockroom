'use client'

import { useState, useRef } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { X, Loader2, Wand2, Paperclip, CheckCircle2, XCircle } from 'lucide-react'
import {
  createInkReceipt,
  createPaperReceipt,
  uploadCertificate,
  type OrderWithReceipts,
} from '@/actions/receipts.actions'
import { cn } from '@/lib/utils'
import { Switch } from '@/components/ui/switch'

// ─── Types ─────────────────────────────────────────────────────────────────────

type Props = {
  open:    boolean
  onClose: () => void
  order:   OrderWithReceipts
}

type QualityValue = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL'

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
    selected:       z.boolean(),
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
    selected:       z.boolean(),
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
  const today           = new Date().toISOString().split('T')[0]
  const incompleteItems = order.ink_items.filter(i => !i.is_complete)
  const [certUrl, setCertUrl] = useState<string | null>(null)

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } =
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
            selected:       false,
            provider_batch: '',
            internal_batch: '',
            units_received: remaining,
            kg_received:    +((item.kg_per_unit * remaining).toFixed(3)),
          }
        }),
      },
    })

  const { fields } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')
  const quality      = watch('quality_certificate')
  const activeCount  = watchedItems.filter(i => !i.skip).length
  const allSelected  = watchedItems.length > 0 && watchedItems.filter(i => !i.skip).every(i => i.selected)

  function toggleSelectAll(checked: boolean) {
    fields.forEach((_, i) => {
      if (!watchedItems[i]?.skip) setValue(`items.${i}.selected`, checked)
    })
  }

  function handleProviderBatchChange(i: number, value: string) {
    setValue(`items.${i}.provider_batch`, value)
    if (getValues(`items.${i}.selected`)) {
      fields.forEach((_, idx) => {
        if (idx !== i && getValues(`items.${idx}.selected`)) {
          setValue(`items.${idx}.provider_batch`, value)
        }
      })
    }
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
        certificate_url:        certUrl,
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
      errors={errors}
      certUrl={certUrl}
      onCertUrl={setCertUrl}
      register={register}
      watchedItems={watchedItems}
      allSelected={allSelected}
      onToggleSelectAll={toggleSelectAll}
    >
      {/* INK-specific columns */}
      <>
        <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Uds</th>
        <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">KG</th>
      </>
      {fields.map((field, i) => {
        const item    = incompleteItems[i]
        if (!item) return null
        const skipped = watchedItems[i]?.skip
        return (
          <ItemRow
            key={field.id}
            i={i}
            skipped={!!skipped}
            selected={!!watchedItems[i]?.selected}
            register={register}
            onSkipChange={v => {
              setValue(`items.${i}.skip`, v)
              if (v) setValue(`items.${i}.selected`, false)
            }}
            onSelectChange={v => setValue(`items.${i}.selected`, v)}
            onProviderBatchChange={v => handleProviderBatchChange(i, v)}
            catalogCode={item.ink_catalog?.code}
            catalogName={item.ink_catalog?.name}
            unitsReceived={item.units_received ?? 0}
            unitsOrdered={item.units_ordered}
          >
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
          </ItemRow>
        )
      })}
    </BatchDrawer>
  )
}

// ─── Paper batch ───────────────────────────────────────────────────────────────

function PaperBatchForm({ order, onClose }: { order: OrderWithReceipts; onClose: () => void }) {
  const today           = new Date().toISOString().split('T')[0]
  const incompleteItems = order.paper_items.filter(i => !i.is_complete)
  const [certUrl, setCertUrl] = useState<string | null>(null)

  const { register, control, handleSubmit, watch, setValue, getValues, formState: { errors, isSubmitting } } =
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
          selected:       false,
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
  const allSelected  = watchedItems.length > 0 && watchedItems.filter(i => !i.skip).every(i => i.selected)

  function toggleSelectAll(checked: boolean) {
    fields.forEach((_, i) => {
      if (!watchedItems[i]?.skip) setValue(`items.${i}.selected`, checked)
    })
  }

  function handleProviderBatchChange(i: number, value: string) {
    setValue(`items.${i}.provider_batch`, value)
    if (getValues(`items.${i}.selected`)) {
      fields.forEach((_, idx) => {
        if (idx !== i && getValues(`items.${idx}.selected`)) {
          setValue(`items.${idx}.provider_batch`, value)
        }
      })
    }
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
        certificate_url:        certUrl,
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
      errors={errors}
      certUrl={certUrl}
      onCertUrl={setCertUrl}
      register={register}
      watchedItems={watchedItems}
      allSelected={allSelected}
      onToggleSelectAll={toggleSelectAll}
    >
      <>
        <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Rollos</th>
        <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Largo m</th>
        <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ancho m</th>
      </>
      {fields.map((field, i) => {
        const item    = incompleteItems[i]
        if (!item) return null
        const skipped = watchedItems[i]?.skip
        const m2 = (watchedItems[i]?.units_received || 0) * (watchedItems[i]?.length_m || 0) * (watchedItems[i]?.width_m || 0)
        return (
          <ItemRow
            key={field.id}
            i={i}
            skipped={!!skipped}
            selected={!!watchedItems[i]?.selected}
            register={register}
            onSkipChange={v => {
              setValue(`items.${i}.skip`, v)
              if (v) setValue(`items.${i}.selected`, false)
            }}
            onSelectChange={v => setValue(`items.${i}.selected`, v)}
            onProviderBatchChange={v => handleProviderBatchChange(i, v)}
            catalogCode={item.paper_catalog?.code}
            catalogName={item.paper_catalog?.name}
            unitsReceived={item.units_received ?? 0}
            unitsOrdered={item.units_ordered}
            extraInfo={m2 > 0 && !skipped ? `${m2.toFixed(1)} m²` : undefined}
          >
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
          </ItemRow>
        )
      })}
    </BatchDrawer>
  )
}

// ─── Shared row ────────────────────────────────────────────────────────────────

function ItemRow({
  i,
  skipped,
  selected,
  register,
  onSkipChange,
  onSelectChange,
  onProviderBatchChange,
  catalogCode,
  catalogName,
  unitsReceived,
  unitsOrdered,
  extraInfo,
  children,
}: {
  i:                    number
  skipped:              boolean
  selected:             boolean
  register:             any
  onSkipChange:         (v: boolean) => void
  onSelectChange:       (v: boolean) => void
  onProviderBatchChange:(v: string) => void
  catalogCode?:         string | null
  catalogName?:         string | null
  unitsReceived:        number
  unitsOrdered:         number
  extraInfo?:           string
  children:             React.ReactNode
}) {
  return (
    <tr className={cn(
      'transition-colors',
      skipped    ? 'opacity-35 bg-muted/10' :
      selected   ? 'bg-blue-50/40 dark:bg-blue-950/20' :
                   'hover:bg-muted/20'
    )}>
      {/* Select (sync) */}
      <td className="px-3 py-2.5 text-center">
        <input
          type="checkbox"
          disabled={skipped}
          checked={selected}
          onChange={e => onSelectChange(e.target.checked)}
          className="size-3.5 cursor-pointer accent-blue-600 disabled:opacity-30"
        />
      </td>
      {/* Material */}
      <td className="px-3 py-2.5">
        <p className="font-mono text-[10px] text-muted-foreground">{catalogCode}</p>
        <p className="font-medium">{catalogName}</p>
        <p className="text-[9px] text-muted-foreground">{unitsReceived}/{unitsOrdered} recibido</p>
        {extraInfo && <p className="text-[9px] font-mono text-muted-foreground">{extraInfo}</p>}
      </td>
      {/* Provider batch */}
      <td className="px-3 py-2.5">
        <input
          {...register(`items.${i}.provider_batch`)}
          disabled={skipped}
          placeholder="PROV-LOT"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onProviderBatchChange(e.target.value)}
          className={cn(cellInputCls, 'w-28', selected && !skipped && 'border-blue-300 dark:border-blue-700 bg-blue-50/30 dark:bg-blue-950/20')}
        />
      </td>
      {/* Internal batch */}
      <td className="px-3 py-2.5">
        <input
          {...register(`items.${i}.internal_batch`)}
          disabled={skipped}
          placeholder="IL-TINT-001"
          className={cn(cellInputCls, 'w-28')}
        />
      </td>
      {children}
      {/* Skip — last column */}
      <td className="px-4 py-2.5 text-center">
        <Switch
          checked={!skipped}
          onCheckedChange={v => onSkipChange(!v)}
        />
      </td>
    </tr>
  )
}

// ─── Shared drawer layout ──────────────────────────────────────────────────────

function BatchDrawer({
  order,
  itemCount,
  activeCount,
  isSubmitting,
  onClose,
  onSubmit,
  quality,
  onQualityChange,
  errors,
  certUrl,
  onCertUrl,
  register,
  watchedItems,
  allSelected,
  onToggleSelectAll,
  children,
}: {
  order:             OrderWithReceipts
  itemCount:         number
  activeCount:       number
  isSubmitting:      boolean
  onClose:           () => void
  onSubmit:          () => void
  quality:           QualityValue
  onQualityChange:   (v: QualityValue) => void
  errors:            any
  certUrl:           string | null
  onCertUrl:         (url: string | null) => void
  register:          any
  watchedItems:      any[]
  allSelected:       boolean
  onToggleSelectAll: (v: boolean) => void
  children:          React.ReactNode  // [extraHeaders, ...rows]
}) {
  const [batchPrefix,  setBatchPrefix]  = useState('')
  const [uploading,    setUploading]    = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Split children: first element = extra th headers, rest = rows
  const childArray   = Array.isArray(children) ? children : [children]
  const extraHeaders = childArray[0]
  const rows         = childArray.slice(1)

  function generateInternalBatches() {
    if (!batchPrefix.trim()) { toast.error('Escribe un prefijo primero'); return }
    let counter = 1
    watchedItems.forEach((item, i) => {
      if (!item.skip) {
        const el = document.querySelector<HTMLInputElement>(`input[name="items.${i}.internal_batch"]`)
        if (el) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
          nativeSetter?.call(el, `${batchPrefix.trim()}-${String(counter).padStart(3, '0')}`)
          el.dispatchEvent(new Event('input', { bubbles: true }))
        }
        counter++
      }
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadCertificate(fd)
    setUploading(false)
    if (res.error) { toast.error(res.error); return }
    onCertUrl(res.url ?? null)
    toast.success('Certificado subido')
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative ml-auto h-full w-full max-w-4xl bg-background border-l border-border flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Recepción múltiple</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              OC-{String(order.order_number).padStart(4, '0')} · {order.providers?.name} · {itemCount} artículo{itemCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Shared fields */}
          <div className="border border-border/50">
            <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30">
              Datos comunes
            </p>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Fecha *</label>
                  <input {...register('receipt_date')} type="date" className={inputCls} />
                  {errors.receipt_date && <p className={errCls}>{errors.receipt_date.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Remisión / Factura *</label>
                  <input {...register('invoice_remission')} placeholder="REM-2025-001" className={inputCls} />
                  {errors.invoice_remission && <p className={errCls}>{errors.invoice_remission.message}</p>}
                </div>
              </div>

              {/* Certificado de calidad toggle */}
              <div>
                <label className={labelCls}>Certificado de calidad</label>
                <div className="flex border border-border">
                  {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => { if (q !== 'APPROVED') { onCertUrl(null); if (fileRef.current) fileRef.current.value = '' } onQualityChange(q) }}
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
              </div>

              {/* Certificate file upload — only when approved */}
              {quality === 'APPROVED' && <div>
                <label className={labelCls}>Archivo del certificado (PDF / imagen)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="h-9 px-3 flex items-center gap-1.5 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {uploading
                      ? <Loader2 className="size-3 animate-spin" />
                      : <Paperclip className="size-3" />
                    }
                    {uploading ? 'Subiendo...' : 'Adjuntar archivo'}
                  </button>
                  {certUrl && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-green-600" />
                      <a
                        href={certUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold text-green-700 underline underline-offset-2"
                      >
                        Ver certificado
                      </a>
                      <button
                        type="button"
                        onClick={() => { onCertUrl(null); if (fileRef.current) fileRef.current.value = '' }}
                        className="text-muted-foreground hover:text-red-600 transition-colors"
                      >
                        <XCircle className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>}
            </div>
          </div>

          {/* Batch helpers */}
          <div className="border border-border/50">
            <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30">
              Herramientas de llenado rápido
            </p>
            <div className="px-4 py-3 space-y-3">
              {/* Lote interno prefix generator */}
              <div>
                <label className={labelCls}>Prefijo para lote interno</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={batchPrefix}
                    onChange={e => setBatchPrefix(e.target.value.toUpperCase())}
                    placeholder="IL-TINT-2025"
                    className={cn(inputCls, 'flex-1')}
                  />
                  <button
                    type="button"
                    onClick={generateInternalBatches}
                    className="h-9 px-3 flex items-center gap-1.5 border border-border text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
                  >
                    <Wand2 className="size-3" />
                    Generar
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground mt-1">
                  Genera: {batchPrefix || 'IL-TINT-2025'}-001, {batchPrefix || 'IL-TINT-2025'}-002… para todos los artículos activos
                </p>
              </div>
              {/* Provider batch sync hint */}
              <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                <span className="inline-block size-2.5 bg-blue-200 dark:bg-blue-800 border border-blue-400 dark:border-blue-600 rounded-sm" />
                Selecciona filas (columna azul) y escribe el <strong>lote proveedor</strong> en cualquiera — se sincroniza automáticamente a las demás seleccionadas
              </p>
            </div>
          </div>

          {/* Items table */}
          <div className="border border-border/50">
            <div className="px-4 py-2 border-b border-border/50 bg-muted/30">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                Artículos — desactiva el switch en los que <span className="italic">no llegaron</span>
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/40 border-b border-border/50">
                    <th className="px-3 py-2 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => onToggleSelectAll(e.target.checked)}
                        title="Seleccionar todos para sincronizar lote proveedor"
                        className="size-3.5 cursor-pointer accent-blue-600"
                      />
                    </th>
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Material</th>
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lote prov.</th>
                    <th className="px-3 py-2 text-left text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Lote interno</th>
                    {extraHeaders}
                    <th className="px-4 py-2 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground w-20">Llegó</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {rows}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
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
            onClick={onSubmit}
            disabled={isSubmitting || activeCount === 0}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-40 flex items-center justify-center gap-1.5"
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

// ─── Constants ─────────────────────────────────────────────────────────────────

const inputCls   = 'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors'
const cellInputCls = 'h-8 border border-foreground/20 bg-card px-2 text-xs outline-none focus:border-foreground/50 transition-colors disabled:bg-transparent disabled:border-transparent disabled:cursor-not-allowed'
const labelCls   = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5'
const errCls     = 'text-[10px] text-destructive mt-1'
