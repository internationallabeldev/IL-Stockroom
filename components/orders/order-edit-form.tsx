'use client'

import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Trash2, Plus, Search, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import {
  updatePurchaseOrderSchema,
  type UpdatePurchaseOrderValues,
  type DeliveryAddress,
  PAYMENT_METHODS,
  SHIPMENT_METHODS,
  formatDeliveryAddress,
  parseDeliveryAddress,
} from '@/lib/validations/purchase-order.schema'
import { DeliveryAddressFields } from './delivery-address-fields'
import { updatePurchaseOrder, type PurchaseOrderDetail } from '@/actions/purchase-orders.actions'
import type { InkCatalogItem } from '@/actions/ink-catalog.actions'
import type { PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { cn } from '@/lib/utils'

type Props = {
  order: PurchaseOrderDetail
  inkCatalog: InkCatalogItem[]
  paperCatalog: PaperCatalogItem[]
}

export function OrderEditForm({ order, inkCatalog, paperCatalog }: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const isInk = order.material_type === 'INK'
  const [address, setAddress] = useState<DeliveryAddress>(
    () => parseDeliveryAddress(order.delivery_place),
  )

  const {
    register, handleSubmit, control, setValue, formState: { errors, isSubmitting },
  } = useForm<UpdatePurchaseOrderValues>({
    resolver: zodResolver(updatePurchaseOrderSchema),
    defaultValues: {
      expected_delivery_date: order.expected_delivery_date ?? undefined,
      payment_method:         order.payment_method,
      shipment_method:        order.shipment_method,
      delivery_place:         order.delivery_place,
      notes:                  order.notes ?? undefined,
      ink_items: isInk
        ? order.ink_items.map(i => ({
            ink_catalog_id: i.ink_catalog!.id,
            units_ordered:  i.units_ordered,
            kg_per_unit:    i.total_kg_ordered && i.units_ordered
              ? i.total_kg_ordered / i.units_ordered
              : 0,
            item_notes:     i.item_notes ?? undefined,
          }))
        : [],
      paper_items: !isInk
        ? order.paper_items.map(i => ({
            paper_catalog_id:  i.paper_catalog!.id,
            units_ordered:     i.units_ordered,
            length_m_per_unit: i.total_m2_ordered && i.units_ordered && i.width_m
              ? (i.total_m2_ordered / i.units_ordered) / i.width_m
              : 0,
            width_m:    i.width_m,
            item_notes: i.item_notes ?? undefined,
          }))
        : [],
    },
  })

  const inkFields   = useFieldArray({ control, name: 'ink_items' })
  const paperFields = useFieldArray({ control, name: 'paper_items' })

  function handleAddressChange(field: keyof DeliveryAddress, value: string) {
    const next = { ...address, [field]: value }
    setAddress(next)
    setValue('delivery_place', formatDeliveryAddress(next), { shouldValidate: true })
  }

  async function onSubmit(data: UpdatePurchaseOrderValues) {
    const res = await updatePurchaseOrder(order.id, data)
    if (res.error) { toast.error(res.error); return }
    toast.success('Orden actualizada')
    router.push(`/dashboard/orders/${order.id}`)
  }

  const addedInkIds   = inkFields.fields.map(f   => (f as any).ink_catalog_id)
  const filtered = isInk
    ? inkCatalog.filter(i =>
        !search ||
        i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.code.toLowerCase().includes(search.toLowerCase())
      )
    : paperCatalog.filter(p =>
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase())
      )

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/dashboard/orders/${order.id}`)}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Volver a la orden
        </button>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {isInk ? 'Orden de tintas' : 'Orden de papel'}
        </p>
        <h1 className="font-heading text-4xl font-bold tracking-tight mt-0.5">
          Editar #{order.order_number}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Fechas */}
        <div className="bg-card border border-border">
          <p className={sectionHeader}>Fechas</p>
          <div className="px-6 py-4 grid grid-cols-2 gap-4">
            <FormField label="Fecha de solicitud">
              <input
                type="date"
                value={order.request_date}
                disabled
                className={inputCls + ' opacity-50 cursor-not-allowed'}
              />
            </FormField>
            <FormField label="Entrega esperada" error={errors.expected_delivery_date?.message}>
              <input {...register('expected_delivery_date')} type="date" className={inputCls} />
            </FormField>
          </div>
        </div>

        {/* Logística */}
        <div className="bg-card border border-border">
          <p className={sectionHeader}>Logística</p>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Método de pago" error={errors.payment_method?.message}>
                <select {...register('payment_method')} className={inputCls}>
                  <option value="">— Selecciona —</option>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </FormField>
              <FormField label="Método de envío" error={errors.shipment_method?.message}>
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
            />
          </div>
        </div>

        {/* Artículos */}
        <div className="bg-card border border-border">
          <p className={sectionHeader}>{isInk ? 'Tintas' : 'Papeles'}</p>
          <div className="px-6 py-4 space-y-3">

            {isInk && inkFields.fields.map((field, idx) => {
              const ink = inkCatalog.find(i => i.id === (field as any).ink_catalog_id)
              return (
                <div key={field.id} className="border border-border/50 bg-muted/10 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {ink?.color_code?.startsWith('#') && (
                        <span className="inline-block size-2.5 rounded-sm mr-1.5 border border-border/50 align-middle" style={{ background: ink.color_code }} />
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">{ink?.code}</span>
                      <p className="text-sm font-bold truncate">{ink?.name}</p>
                    </div>
                    <button type="button" onClick={() => inkFields.remove(idx)} className="shrink-0 size-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-600 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField label="Unidades" error={errors.ink_items?.[idx]?.units_ordered?.message}>
                      <input {...register(`ink_items.${idx}.units_ordered`, { valueAsNumber: true })} type="number" min="1" className={inputCls} />
                    </FormField>
                    <FormField label="kg por unidad" error={errors.ink_items?.[idx]?.kg_per_unit?.message}>
                      <input {...register(`ink_items.${idx}.kg_per_unit`, { valueAsNumber: true })} type="number" step="0.01" min="0.01" className={inputCls} />
                    </FormField>
                  </div>
                  <FormField label="Notas de entrega (opcional)" error={errors.ink_items?.[idx]?.item_notes?.message}>
                    <textarea
                      {...register(`ink_items.${idx}.item_notes`)}
                      rows={1}
                      placeholder="Especificaciones, instrucciones de entrega..."
                      className={inputCls + ' resize-none pt-2 h-auto'}
                    />
                  </FormField>
                </div>
              )
            })}

            {!isInk && paperFields.fields.map((field, idx) => {
              const paper = paperCatalog.find(p => p.id === (field as any).paper_catalog_id)
              return (
                <div key={field.id} className="border border-border/50 bg-muted/10 p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-muted-foreground">{paper?.code}</span>
                      <p className="text-sm font-bold truncate">{paper?.name}</p>
                    </div>
                    <button type="button" onClick={() => paperFields.remove(idx)} className="shrink-0 size-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-600 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <FormField label="Unidades" error={errors.paper_items?.[idx]?.units_ordered?.message}>
                      <input {...register(`paper_items.${idx}.units_ordered`, { valueAsNumber: true })} type="number" min="1" className={inputCls} />
                    </FormField>
                    <FormField label="Longitud (m)" error={errors.paper_items?.[idx]?.length_m_per_unit?.message}>
                      <input {...register(`paper_items.${idx}.length_m_per_unit`, { valueAsNumber: true })} type="number" step="0.01" min="0.01" className={inputCls} />
                    </FormField>
                    <FormField label="Ancho (m)" error={errors.paper_items?.[idx]?.width_m?.message}>
                      <input {...register(`paper_items.${idx}.width_m`, { valueAsNumber: true })} type="number" step="0.001" min="0.001" className={inputCls} />
                    </FormField>
                  </div>
                  <FormField label="Notas de entrega (opcional)" error={errors.paper_items?.[idx]?.item_notes?.message}>
                    <textarea
                      {...register(`paper_items.${idx}.item_notes`)}
                      rows={1}
                      placeholder="Especificaciones, instrucciones de entrega..."
                      className={inputCls + ' resize-none pt-2 h-auto'}
                    />
                  </FormField>
                </div>
              )
            })}

            {/* Selector */}
            <ItemSelector
              isInk={isInk}
              items={filtered}
              search={search}
              onSearch={setSearch}
              disabledIds={isInk ? addedInkIds : []}
              onSelect={item => {
                if (isInk) {
                  inkFields.append({ ink_catalog_id: item.id, units_ordered: 1, kg_per_unit: 0, item_notes: null })
                } else {
                  const paper = item as PaperCatalogItem
                  paperFields.append({
                    paper_catalog_id:  paper.id,
                    units_ordered:     1,
                    length_m_per_unit: 0,
                    width_m:           paper.standard_width_m ?? 0,
                    item_notes:        null,
                  })
                }
                setSearch('')
              }}
            />
          </div>
        </div>

        {/* Notas */}
        <div className="bg-card border border-border">
          <p className={sectionHeader}>Notas</p>
          <div className="px-6 py-4">
            <FormField label="Notas (opcional)" error={errors.notes?.message}>
              <textarea {...register('notes')} rows={3} placeholder="Instrucciones adicionales..." className={inputCls + ' resize-none pt-2 h-auto'} />
            </FormField>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/orders/${order.id}`)}
            className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Item selector ─────────────────────────────────────────────────────────────

function ItemSelector({
  isInk, items, search, onSearch, disabledIds, onSelect,
}: {
  isInk: boolean
  items: (InkCatalogItem | PaperCatalogItem)[]
  search: string
  onSearch: (v: string) => void
  disabledIds: number[]
  onSelect: (item: InkCatalogItem | PaperCatalogItem) => void
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
        {isInk ? 'Agregar tinta' : 'Agregar papel'}
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
                placeholder={isInk ? 'Buscar tinta...' : 'Buscar papel...'}
                className="w-full h-7 bg-card border border-foreground/20 pl-7 pr-2 text-xs outline-none focus:border-foreground/50"
              />
            </div>
          </div>
          {items.length === 0
            ? <p className="px-3 py-4 text-[10px] text-muted-foreground text-center">Sin resultados</p>
            : items.map(item => {
              const ink = isInk ? (item as InkCatalogItem) : null
              const paper = !isInk ? (item as PaperCatalogItem) : null
              const stock = isInk
                ? `${(ink!.current_stock_kg ?? 0).toFixed(1)} kg`
                : `${(paper!.current_stock_m2 ?? 0).toFixed(1)} m²`
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={disabledIds.includes(item.id)}
                  onClick={() => { onSelect(item); setOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {ink?.color_code?.startsWith('#') && (
                    <span className="size-2.5 rounded-sm shrink-0 border border-border/50" style={{ background: ink.color_code }} />
                  )}
                  <span className="font-mono text-[9px] text-muted-foreground shrink-0">{item.code}</span>
                  <span className="text-xs truncate">{item.name}</span>
                  <span className="ml-auto text-[9px] text-muted-foreground shrink-0">{stock}</span>
                </button>
              )
            })
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
  'px-6 py-2.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30'

function FormField({
  label, error, children,
}: {
  label: string; error?: string; children: React.ReactNode
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
