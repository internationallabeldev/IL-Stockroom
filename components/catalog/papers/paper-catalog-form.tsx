'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Pencil, Loader2 } from 'lucide-react'
import { paperCatalogSchema, type PaperCatalogFormValues } from '@/lib/validations/paper-catalog.schema'
import { createPaperCatalogItem, updatePaperCatalogItem, type PaperCatalogItem } from '@/actions/paper-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import type { Provider } from '@/actions/providers.actions'

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
  weight_gsm: null,
  thickness_mm: null,
  density: null,
  standard_width_m: null,
  min_stock_m2: null,
}

export function PaperCatalogForm({ open, onClose, item, mode: initialMode = 'create', canEdit = false, providers }: Props) {
  const [mode, setMode] = useState<DrawerMode>(initialMode)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PaperCatalogFormValues>({
    resolver: zodResolver(paperCatalogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) {
      reset(DEFAULT_VALUES)
      return
    }
    setMode(initialMode)
    if (item) {
      reset({
        code: item.code,
        name: item.name,
        description: item.description ?? null,
        provider_id: item.provider_id ?? null,
        weight_gsm: item.weight_gsm ?? null,
        thickness_mm: item.thickness_mm ?? null,
        density: item.density ?? null,
        standard_width_m: item.standard_width_m ?? null,
        min_stock_m2: item.min_stock_m2 ?? null,
      })
    } else {
      reset(DEFAULT_VALUES)
    }
  }, [open, item, initialMode, reset])

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
      if (item) {
        reset({
          code: item.code,
          name: item.name,
          description: item.description ?? null,
          provider_id: item.provider_id ?? null,
          weight_gsm: item.weight_gsm ?? null,
          thickness_mm: item.thickness_mm ?? null,
          density: item.density ?? null,
          standard_width_m: item.standard_width_m ?? null,
          min_stock_m2: item.min_stock_m2 ?? null,
        })
      }
    } else {
      onClose()
    }
  }

  if (!open) return null

  const provider = providers.find(p => p.id === item?.provider_id)

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-[#1A1A1A]/40" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-[#F5F2EA] border-l border-[#1A1A1A]/15 flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]/15 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              {mode === 'create' ? 'Nuevo Papel' : mode === 'view' ? 'Detalle de papel' : 'Editar papel'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mt-0.5">
              {item ? item.code : 'Completa los datos'}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-[#E5E1D8] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* VIEW MODE */}
        {mode === 'view' && item && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            <div>
              <p className="font-mono text-[9px] font-bold text-[#5f5e59] uppercase tracking-widest">{item.code}</p>
              <h3 className="font-heading text-2xl font-bold tracking-tight leading-tight mt-1">{item.name}</h3>
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
                  <StockBadge current={item.current_stock_m2} min={item.min_stock_m2} unit="m²" />
                  <span className="font-mono text-sm text-[#1A1A1A]">
                    {(item.current_stock_m2 ?? 0).toFixed(2)} m²
                  </span>
                </div>
                <StockBar current={item.current_stock_m2} min={item.min_stock_m2} />
                {item.min_stock_m2 && (
                  <p className="text-[10px] text-[#5f5e59]">Mínimo: {item.min_stock_m2} m²</p>
                )}
              </div>
            </div>

            {/* Specs */}
            <div className="border border-[#1A1A1A]/10">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#5f5e59] border-b border-[#1A1A1A]/10 bg-[#E5E1D8]/40">
                Especificaciones
              </p>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {item.weight_gsm && <ViewField label="Gramaje" value={`${item.weight_gsm} g/m²`} />}
                {item.thickness_mm && <ViewField label="Grosor" value={`${item.thickness_mm} mm`} />}
                {item.standard_width_m && <ViewField label="Ancho estándar" value={`${item.standard_width_m} m`} />}
                {item.density && <ViewField label="Densidad" value={`${item.density}`} />}
                {provider && <ViewField label="Proveedor" value={provider.name} />}
                {item.last_purchase_date && (
                  <ViewField label="Última compra" value={new Date(item.last_purchase_date).toLocaleDateString('es-MX')} />
                )}
              </div>
            </div>
          </div>
        )}

        {/* FORM MODE */}
        {mode !== 'view' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código *" error={errors.code?.message}>
                <input {...register('code')} placeholder="PAP-001" className={inputCls} />
              </Field>
              <Field label="Min. stock (m²)" error={errors.min_stock_m2?.message}>
                <input
                  {...register('min_stock_m2', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Nombre *" error={errors.name?.message}>
              <input {...register('name')} placeholder="Bond 90 g/m² blanco" className={inputCls} />
            </Field>

            <Field label="Descripción (opcional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={2}
                placeholder="Notas adicionales..."
                className={inputCls + ' resize-none pt-2'}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Gramaje (g/m²)" error={errors.weight_gsm?.message}>
                <input
                  {...register('weight_gsm', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  type="number"
                  step="0.1"
                  placeholder="90"
                  className={inputCls}
                />
              </Field>
              <Field label="Grosor (mm)" error={errors.thickness_mm?.message}>
                <input
                  {...register('thickness_mm', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  type="number"
                  step="0.001"
                  placeholder="0.1"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Ancho estándar (m)" error={errors.standard_width_m?.message}>
                <input
                  {...register('standard_width_m', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  type="number"
                  step="0.01"
                  placeholder="0.61"
                  className={inputCls}
                />
              </Field>
              <Field label="Densidad" error={errors.density?.message}>
                <input
                  {...register('density', { setValueAs: v => (v === '' || v === null ? null : Number(v)) })}
                  type="number"
                  step="0.001"
                  placeholder="1.2"
                  className={inputCls}
                />
              </Field>
            </div>

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
                {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear papel'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full h-9 border border-[#1A1A1A]/20 bg-[#fdf9f0] px-3 text-sm outline-none focus:border-[#1A1A1A]/40 transition-colors'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] block mb-1.5">{label}</label>
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
