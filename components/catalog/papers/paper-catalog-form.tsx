'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Pencil, Loader2, Info } from 'lucide-react'
import {
  paperCatalogSchema,
  type PaperCatalogFormValues,
  SUBSTRATE_CATEGORIES,
  SUBSTRATE_CATEGORY_LABELS,
  type SubstrateCategory,
  INK_COMPAT_OPTIONS,
  INK_COMPAT_LABELS,
  type InkCompat,
  STOCK_UNITS,
  STOCK_UNIT_LABELS,
  type StockUnit,
} from '@/lib/validations/paper-catalog.schema'
import { createPaperCatalogItem, updatePaperCatalogItem, type PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import type { Provider } from '@/actions/providers.actions'
import { cn } from '@/lib/utils'

type DrawerMode = 'create' | 'view' | 'edit'

type Props = {
  open: boolean
  onClose: () => void
  item?: PaperCatalogItem | null
  mode?: DrawerMode
  canEdit?: boolean
  providers: Provider[]
}

const DEFAULT_VALUES: PaperCatalogFormValues = {
  code: '',
  name: '',
  description: null,
  provider_id: null,
  substrate_category: null,
  material: null,
  weight_gsm: null,
  thickness_mm: null,
  standard_width_m: null,
  ink_compatibility: null,
  bulk_cm3g: null,
  min_stock_m2: null,
  stock_unit: 'm2',
  reel_diameter_mm: null,
  core_mm: null,
}

function itemToValues(item: PaperCatalogItem): PaperCatalogFormValues {
  return {
    code:               item.code,
    name:               item.name,
    description:        item.description ?? null,
    provider_id:        item.provider_id ?? null,
    substrate_category: (item.substrate_category as SubstrateCategory | null) ?? null,
    material:           item.material ?? null,
    weight_gsm:         item.weight_gsm ?? null,
    thickness_mm:       item.thickness_mm ?? null,
    standard_width_m:   item.standard_width_m ?? null,
    ink_compatibility:  (item.ink_compatibility as InkCompat[] | null) ?? null,
    bulk_cm3g:          item.bulk_cm3g ?? null,
    min_stock_m2:       item.min_stock_m2 ?? null,
    stock_unit:         (item.stock_unit as StockUnit) ?? 'm2',
    reel_diameter_mm:   item.reel_diameter_mm ?? null,
    core_mm:            item.core_mm ?? null,
  }
}

export function PaperCatalogForm({ open, onClose, item, mode: initialMode = 'create', canEdit = false, providers }: Props) {
  const [mode, setMode] = useState<DrawerMode>(initialMode)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PaperCatalogFormValues>({
    resolver: zodResolver(paperCatalogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const substrateCategoryValue = watch('substrate_category')
  const inkCompatValue         = watch('ink_compatibility') ?? []
  const stockUnitValue         = watch('stock_unit') ?? 'm2'

  useEffect(() => {
    if (!open) { reset(DEFAULT_VALUES); return }
    setMode(initialMode)
    reset(item ? itemToValues(item) : DEFAULT_VALUES)
  }, [open, item, initialMode, reset])

  function toggleInkCompat(option: InkCompat) {
    const current = inkCompatValue ?? []
    const next = current.includes(option)
      ? current.filter(v => v !== option)
      : [...current, option]
    setValue('ink_compatibility', next.length > 0 ? next : null, { shouldValidate: true })
  }

  async function onSubmit(data: PaperCatalogFormValues) {
    const res = item
      ? await updatePaperCatalogItem(item.id, data)
      : await createPaperCatalogItem(data)
    if (res.error) { toast.error(res.error); return }
    toast.success(item ? 'Papel actualizado' : 'Papel creado')
    onClose()
  }

  function handleCancel() {
    if (mode === 'edit' && initialMode === 'view') {
      setMode('view')
      if (item) reset(itemToValues(item))
    } else {
      onClose()
    }
  }

  if (!open) return null

  const provider  = providers.find(p => p.id === item?.provider_id)
  const stockUnit = (item?.stock_unit ?? 'm²') as string
  const stockUnitLabel = stockUnit === 'm2' ? 'm²' : stockUnit

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1A1A1A]/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/15 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              {mode === 'create' ? 'Nuevo sustrato' : mode === 'view' ? 'Detalle de sustrato' : 'Editar sustrato'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              {item ? item.code : 'Completa los datos'}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* ── VIEW MODE ── */}
        {mode === 'view' && item && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[9px] font-bold text-[#5f5e59] uppercase tracking-widest">{item.code}</p>
                  <h3 className="font-heading text-2xl font-bold tracking-tight leading-tight mt-1">{item.name}</h3>
                </div>
                {item.substrate_category && (
                  <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-[#1A1A1A] text-[#F5F2EA] mt-1">
                    {SUBSTRATE_CATEGORY_LABELS[item.substrate_category as SubstrateCategory]}
                  </span>
                )}
              </div>
              {item.material && (
                <p className="font-mono text-xs text-[#5f5e59] mt-1">{item.material}</p>
              )}
              {item.description && (
                <p className="text-sm text-[#5f5e59] mt-2">{item.description}</p>
              )}
            </div>

            {/* Stock */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                Stock actual
              </p>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <StockBadge current={item.current_stock_m2} min={item.min_stock_m2} unit={stockUnitLabel} />
                  <span className="font-mono text-sm text-[#1A1A1A]">
                    {(item.current_stock_m2 ?? 0).toFixed(2)} {stockUnitLabel}
                  </span>
                </div>
                <StockBar current={item.current_stock_m2} min={item.min_stock_m2} />
                {item.min_stock_m2 != null && (
                  <p className="text-[10px] text-[#5f5e59]">Mínimo: {item.min_stock_m2} {stockUnitLabel}</p>
                )}
              </div>
            </div>

            {/* Propiedades físicas */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                Propiedades físicas
              </p>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {item.weight_gsm != null && <ViewField label="Gramaje" value={`${item.weight_gsm} g/m²`} />}
                {item.thickness_mm != null && <ViewField label="Grosor" value={`${item.thickness_mm} µm`} />}
                {item.standard_width_m != null && <ViewField label="Ancho bobina" value={`${item.standard_width_m} m`} />}
              </div>
            </div>

            {/* Propiedades técnicas */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                Propiedades técnicas
              </p>
              <div className="px-4 py-3 space-y-3">
                {item.ink_compatibility && item.ink_compatibility.length > 0 && (
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/70 mb-1.5">Compatibilidad de tinta</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {(item.ink_compatibility as InkCompat[]).map(c => (
                        <span key={c} className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-[#1A1A1A]/20 text-[#1A1A1A]">
                          {INK_COMPAT_LABELS[c]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {item.bulk_cm3g != null && (
                  <ViewField label="Bulk (cm³/g)" value={`${item.bulk_cm3g}`} />
                )}
              </div>
            </div>

            {/* Producción */}
            {(item.reel_diameter_mm != null || item.core_mm != null || provider || item.last_purchase_date) && (
              <div className="border border-[#1A1A1A]/10">
                <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                  Logística
                </p>
                <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                  {item.reel_diameter_mm != null && <ViewField label="Ø bobina" value={`${item.reel_diameter_mm} mm`} />}
                  {item.core_mm != null && <ViewField label="Core interno" value={`${item.core_mm} mm`} />}
                  {provider && <ViewField label="Proveedor" value={provider.name} />}
                  {item.last_purchase_date && (
                    <ViewField label="Última compra" value={new Date(item.last_purchase_date).toLocaleDateString('es-MX')} />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FORM MODE ── */}
        {mode !== 'view' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* 1. Información básica */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código *" error={errors.code?.message}>
                <input {...register('code')} placeholder="PAP-001" className={inputCls} />
              </Field>
              <Field label="Nombre *" error={errors.name?.message}>
                <input {...register('name')} placeholder="BOPP Transparente" className={inputCls} />
              </Field>
            </div>

            <Field label="Descripción (opcional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Notas adicionales..."
                className={inputCls + ' resize-none pt-2 h-auto'}
              />
            </Field>

            <Field label="Proveedor (opcional)" error={errors.provider_id?.message}>
              <select
                {...register('provider_id', { setValueAs: v => (v === '' ? null : Number(v)) })}
                className={inputCls}
              >
                <option value="">— Sin proveedor —</option>
                {providers
                  .filter(p => p.provider_type === 'PAPER_SUPPLIER' || p.provider_type === 'BOTH')
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </Field>

            {/* 2. Material y categoría */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
                Material y categoría
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field label="Categoría" error={errors.substrate_category?.message}>
                  <div className="flex border border-[#1A1A1A]/20">
                    {SUBSTRATE_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setValue('substrate_category', substrateCategoryValue === cat ? null : cat, { shouldValidate: true })}
                        className={cn(
                          'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          substrateCategoryValue === cat
                            ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                            : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] hover:text-[#1A1A1A]'
                        )}
                      >
                        {SUBSTRATE_CATEGORY_LABELS[cat]}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Material específico" error={errors.material?.message}>
                  <input
                    {...register('material')}
                    placeholder="ej. BOPP, PET, PE, Bond, Couché..."
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

            {/* 3. Propiedades físicas */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
                Propiedades físicas
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field
                  label={<>Gramaje <span className="normal-case">(g/m²)</span></>}
                  error={errors.weight_gsm?.message}
                  info={{
                    what: 'Masa del sustrato por unidad de área expresada en gramos por metro cuadrado.',
                    why: 'Define rigidez, resistencia y costo del material. Impacta tensión en máquina y calidad de impresión.',
                    example: '60 g/m² (film delgado) · 80 g/m² (etiqueta estándar) · 130 g/m² (couché)',
                  }}
                >
                  <input
                    {...register('weight_gsm', { setValueAs: v => (v === '' ? null : Number(v)) })}
                    type="number" step="0.1" min="0"
                    placeholder="ej. 60"
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label={<>Grosor <span className="normal-case">(µm)</span></>}
                    error={errors.thickness_mm?.message}
                    info={{
                      what: 'Espesor del sustrato en micrómetros (1 µm = 0.001 mm).',
                      why: 'Determina la apertura del gap en prensa. Crítico en films plásticos donde una diferencia de 5 µm puede causar arrugas.',
                      example: '50 µm (BOPP estándar) · 80 µm (PET) · 100 µm (PP rígido)',
                    }}
                  >
                    <input
                      {...register('thickness_mm', { setValueAs: v => (v === '' ? null : Number(v)) })}
                      type="number" step="1" min="0"
                      placeholder="ej. 80"
                      className={inputCls}
                    />
                  </Field>
                  <Field
                    label="Ancho de bobina (m)"
                    error={errors.standard_width_m?.message}
                    info={{
                      what: 'Ancho de la bobina tal como llega del proveedor, en metros.',
                      why: 'Determina el número de etiquetas por pasada y el aprovechamiento del material en el trabajo.',
                      example: '0.250 m (angosto) · 0.330 m (Gallus estándar) · 0.520 m (ancho)',
                    }}
                  >
                    <input
                      {...register('standard_width_m', { setValueAs: v => (v === '' ? null : Number(v)) })}
                      type="number" step="0.001" min="0"
                      placeholder="ej. 0.330"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* 4. Propiedades técnicas */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
                Propiedades técnicas
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field label="Compatibilidad de tinta" error={errors.ink_compatibility?.message}>
                  <div className="flex border border-[#1A1A1A]/20">
                    {INK_COMPAT_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleInkCompat(opt)}
                        className={cn(
                          'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          inkCompatValue.includes(opt)
                            ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                            : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] hover:text-[#1A1A1A]'
                        )}
                      >
                        {INK_COMPAT_LABELS[opt]}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="w-1/2 pr-1.5">
                  <Field
                    label="Bulk (cm³/g)"
                    error={errors.bulk_cm3g?.message}
                    info={{
                      what: 'Volumen específico del papel; inverso de la densidad aparente.',
                      why: 'Un bulk alto indica papel esponjoso y menos compacto. Afecta la absorción de tinta y el tacto del producto terminado.',
                      example: '1.00 (papel compacto) · 1.30 (offset estándar) · 1.60 (papel poroso)',
                    }}
                  >
                    <input
                      {...register('bulk_cm3g', { setValueAs: v => (v === '' ? null : Number(v)) })}
                      type="number" step="0.0001" min="0"
                      placeholder="ej. 1.2000"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* 5. Inventario */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/30">
                Inventario
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field label="Unidad de stock *" error={errors.stock_unit?.message}>
                  <div className="flex border border-[#1A1A1A]/20">
                    {STOCK_UNITS.map(u => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setValue('stock_unit', u, { shouldValidate: true })}
                        className={cn(
                          'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          stockUnitValue === u
                            ? 'bg-[#1A1A1A] text-[#F5F2EA]'
                            : 'text-[#1A1A1A]/50 hover:bg-[#E5E1D8] hover:text-[#1A1A1A]'
                        )}
                      >
                        {STOCK_UNIT_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="w-1/2 pr-1.5">
                  <Field
                    label={`Stock mínimo (${STOCK_UNIT_LABELS[stockUnitValue as StockUnit] ?? stockUnitValue})`}
                    error={errors.min_stock_m2?.message}
                  >
                    <input
                      {...register('min_stock_m2', { setValueAs: v => (v === '' ? null : Number(v)) })}
                      type="number" step="0.01" min="0"
                      placeholder="0"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* 6. Parámetros de producción */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/60 border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/20">
                Parámetros de bobina
              </p>
              <div className="px-4 py-3 grid grid-cols-2 gap-3">
                <Field
                  label="Ø bobina (mm)"
                  error={errors.reel_diameter_mm?.message}
                  info={{
                    what: 'Diámetro exterior de la bobina al momento de la entrega.',
                    why: 'Permite calcular los metros lineales disponibles y planificar el espacio de almacenamiento en bodega.',
                    example: '400 mm (estándar) · 600 mm (bobina grande)',
                  }}
                >
                  <input
                    {...register('reel_diameter_mm', { setValueAs: v => (v === '' ? null : Number(v)) })}
                    type="number" step="1" min="0"
                    placeholder="ej. 400"
                    className={inputCls}
                  />
                </Field>
                <Field
                  label="Core interno (mm)"
                  error={errors.core_mm?.message}
                  info={{
                    what: 'Diámetro interior del mandril de cartón de la bobina.',
                    why: 'Debe coincidir con el portabobinas de la prensa. Un core incorrecto impide montar el material.',
                    example: '76 mm (3" — estándar Gallus) · 152 mm (6" — industrial)',
                  }}
                >
                  <input
                    {...register('core_mm', { setValueAs: v => (v === '' ? null : Number(v)) })}
                    type="number" step="1" min="0"
                    placeholder="ej. 76"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>

          </form>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#1A1A1A]/15 flex gap-3 shrink-0">
          {mode === 'view' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-[#1A1A1A]/25 text-[10px] font-bold uppercase tracking-widest hover:bg-[#E5E1D8] transition-colors"
              >
                Cerrar
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="flex-1 py-2.5 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
                >
                  <Pencil className="size-3" />
                  Editar
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleCancel}
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
                {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear sustrato'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

type FieldInfoData = { what: string; why: string; example: string }

function InfoPopover({ info }: { info: FieldInfoData }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ top: 0, left: 0 })

  function handleEnter() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      const popW = 272
      const left = Math.min(
        Math.max(rect.left + rect.width / 2 - popW / 2, 8),
        window.innerWidth - popW - 8
      )
      setPos({ top: rect.bottom + 6, left })
    }
    setOpen(true)
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onMouseEnter={handleEnter}
        onMouseLeave={() => setOpen(false)}
        aria-label="Más información"
        className={cn(
          'size-4 flex items-center justify-center transition-colors shrink-0',
          open ? 'text-[#1A1A1A]' : 'text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60'
        )}
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 272, zIndex: 200 }}
          className="bg-[#F5F2EA] border border-[#1A1A1A]/20 px-3.5 py-3 space-y-2"
        >
          <div
            style={{
              position: 'absolute', top: -5,
              left: Math.min(Math.max((btnRef.current?.getBoundingClientRect().left ?? 0) + 8 - pos.left, 10), 252),
            }}
            className="size-2.5 rotate-45 bg-[#F5F2EA] border-l border-t border-[#1A1A1A]/20"
          />
          <p className="text-[11px] text-[#1A1A1A]/80 leading-snug">{info.what}</p>
          <p className="text-[11px] text-[#5f5e59] leading-snug">{info.why}</p>
          <p className="font-mono text-[10px] text-[#1A1A1A]/40 pt-2 border-t border-[#1A1A1A]/10 leading-relaxed">
            {info.example}
          </p>
        </div>
      )}
    </>
  )
}

function Field({ label, error, info, children }: {
  label: React.ReactNode
  error?: string
  info?: FieldInfoData
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">{label}</label>
        {info && <InfoPopover info={info} />}
      </div>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}

function ViewField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#5f5e59]/70 mb-0.5">{label}</p>
      <p className="text-sm text-[#1A1A1A]">{value}</p>
    </div>
  )
}
