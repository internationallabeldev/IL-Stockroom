'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Plus, Trash2, Loader2, Search, ChevronDown } from 'lucide-react'
import {
  createPurchaseOrderSchema,
  type CreatePurchaseOrderValues,
  type DeliveryAddress,
  EMPTY_ADDRESS,
  PAYMENT_METHODS,
  SHIPMENT_METHODS,
  formatDeliveryAddress,
} from '@/lib/validations/purchase-order.schema'
import { DeliveryAddressFields } from './delivery-address-fields'
import { createPurchaseOrder } from '@/actions/purchase-orders.actions'
import type { Provider } from '@/actions/providers.actions'
import type { InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  providers: Provider[]
  inkCatalog: InkCatalogItem[]
  paperCatalog: PaperCatalogItem[]
}

const today = new Date().toISOString().split('T')[0]

const DEFAULT: CreatePurchaseOrderValues = {
  provider_id:            0,
  material_type:          'INK',
  request_date:           today,
  expected_delivery_date: null,
  payment_method:         '',
  shipment_method:        '',
  delivery_place:         '',
  notes:                  null,
  ink_items:              [],
  paper_items:            [],
}

export function OrderForm({ open, onClose, providers, inkCatalog, paperCatalog }: Props) {
  const [inkSearch,   setInkSearch]   = useState('')
  const [paperSearch, setPaperSearch] = useState('')
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS)

  const {
    register, handleSubmit, reset, setValue, watch,
    control, formState: { errors, isSubmitting },
  } = useForm<CreatePurchaseOrderValues>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: DEFAULT,
  })

  const materialType = watch('material_type')
  const providerId   = watch('provider_id')

  const { fields: inkFields,   append: appendInk,   remove: removeInk }   = useFieldArray({ control, name: 'ink_items' })
  const { fields: paperFields, append: appendPaper, remove: removePaper } = useFieldArray({ control, name: 'paper_items' })

  // Auto-detect material_type from provider
  function handleProviderChange(id: number) {
    setValue('provider_id', id)
    const provider = providers.find(p => p.id === id)
    if (provider?.provider_type === 'INK_SUPPLIER')   setValue('material_type', 'INK')
    if (provider?.provider_type === 'PAPER_SUPPLIER') setValue('material_type', 'PAPER')
  }

  function handleAddressChange(field: keyof DeliveryAddress, value: string) {
    const next = { ...address, [field]: value }
    setAddress(next)
    setValue('delivery_place', formatDeliveryAddress(next), { shouldValidate: true })
  }

  function handleClose() {
    reset(DEFAULT)
    setInkSearch('')
    setPaperSearch('')
    setAddress(EMPTY_ADDRESS)
    onClose()
  }

  async function onSubmit(data: CreatePurchaseOrderValues) {
    const res = await createPurchaseOrder(data)
    if (res.error) { toast.error(res.error); return }
    toast.success(`Orden #${res.orderNumber} creada`)
    handleClose()
  }

  const selectedProvider = providers.find(p => p.id === Number(providerId))
  const canChooseType = !selectedProvider || selectedProvider.provider_type === 'BOTH'

  const filteredInk = inkCatalog.filter(i =>
    !inkSearch || i.name.toLowerCase().includes(inkSearch.toLowerCase()) || i.code.toLowerCase().includes(inkSearch.toLowerCase())
  )
  const filteredPaper = paperCatalog.filter(p =>
    !paperSearch || p.name.toLowerCase().includes(paperSearch.toLowerCase()) || p.code.toLowerCase().includes(paperSearch.toLowerCase())
  )

  const addedInkIds   = inkFields.map(f => (f as any).ink_catalog_id)
  const addedPaperIds = paperFields.map(f => (f as any).paper_catalog_id)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />

      <div className="relative ml-auto h-full w-full max-w-3xl bg-background border-l border-border flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Nueva orden de compra</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              Completa los datos
            </p>
          </div>
          <button onClick={handleClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* ── Proveedor y tipo ── */}
          <div className="border border-border/50">
            <p className={sectionHeader}>Proveedor y material</p>
            <div className="px-4 py-3 space-y-3">
              <FormField label="Proveedor *" error={errors.provider_id?.message}>
                <select
                  className={inputCls}
                  value={providerId || ''}
                  onChange={e => handleProviderChange(Number(e.target.value))}
                >
                  <option value="">— Selecciona —</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </FormField>

              {canChooseType && (
                <FormField label="Tipo de material *" error={errors.material_type?.message}>
                  <div className="flex border border-border">
                    {(['INK', 'PAPER'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('material_type', t)}
                        className={cn(
                          'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          materialType === t
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {t === 'INK' ? 'Tintas' : 'Papel'}
                      </button>
                    ))}
                  </div>
                </FormField>
              )}
            </div>
          </div>

          {/* ── Detalles ── */}
          <div className="border border-border/50">
            <p className={sectionHeader}>Detalles de la orden</p>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fecha de solicitud *" error={errors.request_date?.message}>
                  <input {...register('request_date')} type="date" className={inputCls} />
                </FormField>
                <FormField label="Entrega esperada" error={errors.expected_delivery_date?.message}>
                  <input
                    {...register('expected_delivery_date')}
                    type="date"
                    className={inputCls}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Método de pago *" error={errors.payment_method?.message}>
                  <select {...register('payment_method')} className={inputCls}>
                    <option value="">— Selecciona —</option>
                    {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>

                <FormField label="Método de envío *" error={errors.shipment_method?.message}>
                  <select {...register('shipment_method')} className={inputCls}>
                    <option value="">— Selecciona —</option>
                    {SHIPMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </FormField>
              </div>

              <input type="hidden" {...register('delivery_place')} />
              <DeliveryAddressFields
                address={address}
                onChange={handleAddressChange}
                error={errors.delivery_place?.message}
                required
              />

              <FormField label="Notas (opcional)" error={errors.notes?.message}>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Instrucciones adicionales..."
                  className={inputCls + ' resize-none pt-2 h-auto'}
                />
              </FormField>
            </div>
          </div>

          {/* ── Artículos ── */}
          <div className="border border-border/50">
            <p className={sectionHeader}>
              Artículos
              {(errors as any).items && (
                <span className="ml-2 text-red-500 normal-case font-normal text-[10px]">
                  {(errors as any).items.message}
                </span>
              )}
            </p>
            <div className="px-4 py-3 space-y-3">

              {/* INK items */}
              {materialType === 'INK' && (
                <>
                  {inkFields.map((field, idx) => {
                    const ink = inkCatalog.find(i => i.id === (field as any).ink_catalog_id)
                    return (
                      <div key={field.id} className="border border-border/50 bg-card p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {ink?.color_code?.startsWith('#') && (
                              <span className="inline-block size-2.5 rounded-sm mr-1.5 border border-border/50 align-middle" style={{ background: ink.color_code }} />
                            )}
                            <span className="font-mono text-[10px] text-muted-foreground">{ink?.code}</span>
                            <p className="text-sm font-bold truncate">{ink?.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Stock actual: {(ink?.current_stock_kg ?? 0).toFixed(1)} kg
                            </p>
                          </div>
                          <button type="button" onClick={() => removeInk(idx)} className="shrink-0 size-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-600 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <FormField label="Unidades" error={errors.ink_items?.[idx]?.units_ordered?.message}>
                            <input
                              {...register(`ink_items.${idx}.units_ordered`, { valueAsNumber: true })}
                              type="number" min="1" placeholder="1"
                              className={inputCls}
                            />
                          </FormField>
                          <FormField label="kg por unidad" error={errors.ink_items?.[idx]?.kg_per_unit?.message}>
                            <input
                              {...register(`ink_items.${idx}.kg_per_unit`, { valueAsNumber: true })}
                              type="number" step="0.01" min="0.01" placeholder="25.00"
                              className={inputCls}
                            />
                          </FormField>
                        </div>
                      </div>
                    )
                  })}

                  <InkSelector
                    items={filteredInk}
                    search={inkSearch}
                    onSearch={setInkSearch}
                    disabledIds={addedInkIds}
                    onSelect={ink => {
                      appendInk({ ink_catalog_id: ink.id, units_ordered: 1, kg_per_unit: 0 })
                      setInkSearch('')
                    }}
                  />
                </>
              )}

              {/* PAPER items */}
              {materialType === 'PAPER' && (
                <>
                  {paperFields.map((field, idx) => {
                    const paper = paperCatalog.find(p => p.id === (field as any).paper_catalog_id)
                    return (
                      <div key={field.id} className="border border-border/50 bg-card p-3 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="font-mono text-[10px] text-muted-foreground">{paper?.code}</span>
                            <p className="text-sm font-bold truncate">{paper?.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              Stock actual: {(paper?.current_stock_m2 ?? 0).toFixed(1)} m²
                            </p>
                          </div>
                          <button type="button" onClick={() => removePaper(idx)} className="shrink-0 size-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-600 transition-colors">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <FormField label="Unidades" error={errors.paper_items?.[idx]?.units_ordered?.message}>
                            <input
                              {...register(`paper_items.${idx}.units_ordered`, { valueAsNumber: true })}
                              type="number" min="1" placeholder="1"
                              className={inputCls}
                            />
                          </FormField>
                          <FormField label="Largo (m)" error={errors.paper_items?.[idx]?.length_m_per_unit?.message}>
                            <input
                              {...register(`paper_items.${idx}.length_m_per_unit`, { valueAsNumber: true })}
                              type="number" step="0.001" min="0.001" placeholder="1000"
                              className={inputCls}
                            />
                          </FormField>
                          <FormField label="Ancho (m)" error={errors.paper_items?.[idx]?.width_m?.message}>
                            <input
                              {...register(`paper_items.${idx}.width_m`, { valueAsNumber: true })}
                              type="number" step="0.001" min="0.001"
                              defaultValue={paper?.standard_width_m ?? undefined}
                              placeholder="0.330"
                              className={inputCls}
                            />
                          </FormField>
                        </div>
                      </div>
                    )
                  })}

                  <PaperSelector
                    items={filteredPaper}
                    search={paperSearch}
                    onSearch={setPaperSearch}
                    disabledIds={addedPaperIds}
                    onSelect={paper => {
                      appendPaper({
                        paper_catalog_id: paper.id,
                        units_ordered: 1,
                        length_m_per_unit: 0,
                        width_m: paper.standard_width_m ?? 0,
                      })
                      setPaperSearch('')
                    }}
                  />
                </>
              )}
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Ink selector ─────────────────────────────────────────────────────────────

function InkSelector({
  items, search, onSearch, disabledIds, onSelect,
}: {
  items: InkCatalogItem[]
  search: string
  onSearch: (v: string) => void
  disabledIds: number[]
  onSelect: (item: InkCatalogItem) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-dashed border-border/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-border hover:text-foreground transition-colors"
      >
        <Plus className="size-3.5" />
        Agregar tinta
        <ChevronDown className={cn('size-3 ml-auto transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border border-border max-h-52 overflow-y-auto">
          <div className="p-2 border-b border-border/50 sticky top-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Buscar tinta..."
                className="w-full h-7 bg-card border border-foreground/20 pl-7 pr-2 text-xs outline-none focus:border-foreground/50"
              />
            </div>
          </div>
          {items.length === 0
            ? <p className="px-3 py-4 text-[10px] text-muted-foreground text-center">Sin resultados</p>
            : items.map(ink => (
              <button
                key={ink.id}
                type="button"
                disabled={disabledIds.includes(ink.id)}
                onClick={() => { onSelect(ink); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {ink.color_code?.startsWith('#') && (
                  <span className="size-2.5 rounded-sm shrink-0 border border-border/50" style={{ background: ink.color_code }} />
                )}
                <span className="font-mono text-[9px] text-muted-foreground shrink-0">{ink.code}</span>
                <span className="text-xs truncate">{ink.name}</span>
                <span className="ml-auto text-[9px] text-muted-foreground shrink-0">
                  {(ink.current_stock_kg ?? 0).toFixed(1)} kg
                </span>
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ─── Paper selector ───────────────────────────────────────────────────────────

function PaperSelector({
  items, search, onSearch, disabledIds, onSelect,
}: {
  items: PaperCatalogItem[]
  search: string
  onSearch: (v: string) => void
  disabledIds: number[]
  onSelect: (item: PaperCatalogItem) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-dashed border-border/50 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:border-border hover:text-foreground transition-colors"
      >
        <Plus className="size-3.5" />
        Agregar papel / sustrato
        <ChevronDown className={cn('size-3 ml-auto transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-background border border-border max-h-52 overflow-y-auto">
          <div className="p-2 border-b border-border/50 sticky top-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <input
                autoFocus
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Buscar papel..."
                className="w-full h-7 bg-card border border-foreground/20 pl-7 pr-2 text-xs outline-none focus:border-foreground/50"
              />
            </div>
          </div>
          {items.length === 0
            ? <p className="px-3 py-4 text-[10px] text-muted-foreground text-center">Sin resultados</p>
            : items.map(paper => (
              <button
                key={paper.id}
                type="button"
                disabled={disabledIds.includes(paper.id)}
                onClick={() => { onSelect(paper); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <span className="font-mono text-[9px] text-muted-foreground shrink-0">{paper.code}</span>
                <span className="text-xs truncate">{paper.name}</span>
                {paper.weight_gsm && (
                  <span className="ml-auto text-[9px] text-muted-foreground shrink-0">{paper.weight_gsm} g/m²</span>
                )}
              </button>
            ))
          }
        </div>
      )}
    </div>
  )
}

// ─── Primitives ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full border-b border-foreground/20 bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring [&_option]:bg-background [&_option]:text-foreground'

const sectionHeader =
  'px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30'

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
