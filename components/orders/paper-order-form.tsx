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
import { createPurchaseOrder } from '@/actions/purchase-orders.actions'
import type { Provider } from '@/actions/providers.actions'
import type { PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { DeliveryAddressFields } from './delivery-address-fields'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  onClose: () => void
  providers: Provider[]
  paperCatalog: PaperCatalogItem[]
}

const today = new Date().toISOString().split('T')[0]

const DEFAULT: CreatePurchaseOrderValues = {
  provider_id:            0,
  material_type:          'PAPER',
  request_date:           today,
  expected_delivery_date: null,
  payment_method:         '',
  shipment_method:        '',
  delivery_place:         '',
  notes:                  null,
  ink_items:              [],
  paper_items:            [],
}

export function PaperOrderForm({ open, onClose, providers, paperCatalog }: Props) {
  const [search, setSearch] = useState('')
  const [address, setAddress] = useState<DeliveryAddress>(EMPTY_ADDRESS)

  const {
    register, handleSubmit, reset, setValue, watch,
    control, formState: { errors, isSubmitting },
  } = useForm<CreatePurchaseOrderValues>({
    resolver: zodResolver(createPurchaseOrderSchema),
    defaultValues: DEFAULT,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'paper_items' })

  function handleAddressChange(field: keyof DeliveryAddress, value: string) {
    const next = { ...address, [field]: value }
    setAddress(next)
    setValue('delivery_place', formatDeliveryAddress(next), { shouldValidate: true })
  }

  function handleClose() {
    reset(DEFAULT)
    setSearch('')
    setAddress(EMPTY_ADDRESS)
    onClose()
  }

  async function onSubmit(data: CreatePurchaseOrderValues) {
    const res = await createPurchaseOrder({ ...data, material_type: 'PAPER' })
    if (res.error) { toast.error(res.error); return }
    toast.success(`Orden #${res.orderNumber} creada`)
    handleClose()
  }

  const paperProviders = providers.filter(
    p => p.provider_type === 'PAPER_SUPPLIER' || p.provider_type === 'BOTH'
  )

  const filtered = paperCatalog.filter(i =>
    !search ||
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.code.toLowerCase().includes(search.toLowerCase())
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={handleClose} />

      <div className="relative ml-auto h-full w-full max-w-3xl bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/15 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">Nueva orden — Papel</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              Completa los datos
            </p>
          </div>
          <button onClick={handleClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          {/* Proveedor */}
          <div className="border border-[#1A1A1A]/10">
            <p className={sectionHeader}>Proveedor</p>
            <div className="px-4 py-3">
              <FormField label="Proveedor *" error={errors.provider_id?.message}>
                <select
                  className={inputCls}
                  defaultValue=""
                  onChange={e => setValue('provider_id', Number(e.target.value), { shouldValidate: true })}
                >
                  <option value="" disabled>— Selecciona —</option>
                  {paperProviders.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </FormField>
            </div>
          </div>

          {/* Detalles */}
          <div className="border border-[#1A1A1A]/10">
            <p className={sectionHeader}>Detalles de la orden</p>
            <div className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Fecha de solicitud *" error={errors.request_date?.message}>
                  <input {...register('request_date')} type="date" className={inputCls} />
                </FormField>
                <FormField label="Entrega esperada" error={errors.expected_delivery_date?.message}>
                  <input {...register('expected_delivery_date')} type="date" className={inputCls} />
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

          {/* Artículos */}
          <div className="border border-[#1A1A1A]/10">
            <p className={sectionHeader}>
              Papeles a ordenar
              {(errors as any).items && (
                <span className="ml-2 text-red-500 normal-case font-normal text-[10px]">
                  {(errors as any).items.message}
                </span>
              )}
            </p>
            <div className="px-4 py-3 space-y-3">

              {fields.map((field, idx) => {
                const paper = paperCatalog.find(p => p.id === (field as any).paper_catalog_id)
                return (
                  <div key={field.id} className="border border-[#1A1A1A]/10 bg-[#fdf9f0] p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-mono text-[10px] text-[#5f5e59]">{paper?.code}</span>
                        <p className="text-sm font-bold truncate">{paper?.name}</p>
                        <p className="text-[10px] text-[#5f5e59]">
                          Stock: {(paper?.current_stock_m2 ?? 0).toFixed(1)} m²
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(idx)}
                        className="shrink-0 size-6 flex items-center justify-center text-[#1A1A1A]/40 hover:text-red-600 transition-colors"
                      >
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
                      <FormField label="Longitud (m)" error={errors.paper_items?.[idx]?.length_m_per_unit?.message}>
                        <input
                          {...register(`paper_items.${idx}.length_m_per_unit`, { valueAsNumber: true })}
                          type="number" step="0.01" min="0.01" placeholder="1000"
                          className={inputCls}
                        />
                      </FormField>
                      <FormField label="Ancho (m)" error={errors.paper_items?.[idx]?.width_m?.message}>
                        <input
                          {...register(`paper_items.${idx}.width_m`, { valueAsNumber: true })}
                          type="number" step="0.001" min="0.001"
                          placeholder={paper?.standard_width_m?.toString() ?? '0.330'}
                          className={inputCls}
                        />
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

              <PaperSelector
                items={filtered}
                search={search}
                onSearch={setSearch}
                onSelect={paper => {
                  append({
                    paper_catalog_id: paper.id,
                    units_ordered: 1,
                    length_m_per_unit: 0,
                    width_m: paper.standard_width_m ?? 0,
                    item_notes: null,
                  })
                  setSearch('')
                }}
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-[#1A1A1A]/15 flex gap-3 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSubmitting && <Loader2 className="size-3 animate-spin" />}
            {isSubmitting ? 'Guardando...' : 'Crear orden'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Paper selector ────────────────────────────────────────────────────────────

function PaperSelector({
  items, search, onSearch, onSelect,
}: {
  items: PaperCatalogItem[]
  search: string
  onSearch: (v: string) => void
  onSelect: (item: PaperCatalogItem) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 border border-dashed border-[#1A1A1A]/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50 hover:border-[#1A1A1A]/50 hover:text-[#1A1A1A] transition-colors"
      >
        <Plus className="size-3.5" />
        Agregar papel
        <ChevronDown className={cn('size-3 ml-auto transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#F5F2EA] border border-[#1A1A1A]/20 max-h-52 overflow-y-auto">
          <div className="p-2 border-b border-[#1A1A1A]/10 sticky top-0 bg-[#F5F2EA]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-[#1A1A1A]/40" />
              <input
                autoFocus
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Buscar papel..."
                className="w-full h-7 bg-[#fdf9f0] border border-[#1A1A1A]/20 pl-7 pr-2 text-xs outline-none"
              />
            </div>
          </div>
          {items.length === 0
            ? <p className="px-3 py-4 text-[10px] text-[#5f5e59] text-center">Sin resultados</p>
            : items.map(paper => (
              <button
                key={paper.id}
                type="button"
                onClick={() => { onSelect(paper); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#E5E1D8] transition-colors"
              >
                <span className="font-mono text-[9px] text-[#5f5e59] shrink-0">{paper.code}</span>
                <span className="text-xs truncate">{paper.name}</span>
                <span className="ml-auto text-[9px] text-[#5f5e59] shrink-0">
                  {(paper.current_stock_m2 ?? 0).toFixed(1)} m²
                </span>
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
  'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

const sectionHeader =
  'px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30'

function FormField({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
