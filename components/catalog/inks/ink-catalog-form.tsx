'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Pencil, Loader2, Palette, Info } from 'lucide-react'
import { inkCatalogSchema, type InkCatalogFormValues, INK_TYPES, INK_TYPE_LABELS, type InkType } from '@/lib/validations/ink-catalog.schema'
import { createInkCatalogItem, updateInkCatalogItem, type InkCatalogItem } from '@/actions/ink-catalog.actions'
import { StockBadge, StockBar } from '@/components/catalog/stock-badge'
import type { Provider } from '@/actions/providers.actions'
import { cn } from '@/lib/utils'

type DrawerMode = 'create' | 'view' | 'edit'
type ColorFormat = 'HEX' | 'RGB' | 'HSL'

type Props = {
  open: boolean
  onClose: () => void
  item?: InkCatalogItem | null
  mode?: DrawerMode
  canEdit?: boolean
  providers: Provider[]
}

const DEFAULT_VALUES: InkCatalogFormValues = {
  code: '',
  name: '',
  description: null,
  provider_id: null,
  density: null,
  viscosity: null,
  ink_type: null,
  prepress_pct: null,
  optical_density: null,
  color_code: null,
  min_stock_kg: 0,
}

export function InkCatalogForm({ open, onClose, item, mode: initialMode = 'create', canEdit = false, providers }: Props) {
  const [mode, setMode] = useState<DrawerMode>(initialMode)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InkCatalogFormValues>({
    resolver: zodResolver(inkCatalogSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const colorCodeValue = watch('color_code')
  const inkTypeValue   = watch('ink_type')

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
        density: item.density ?? null,
        viscosity: item.viscosity ?? null,
        ink_type: (item.ink_type as InkType | null) ?? null,
        prepress_pct: item.prepress_pct ?? null,
        optical_density: item.optical_density ?? null,
        color_code: item.color_code ?? null,
        min_stock_kg: item.min_stock_kg,
      })
    } else {
      reset(DEFAULT_VALUES)
    }
  }, [open, item, initialMode, reset])

  async function onSubmit(data: InkCatalogFormValues) {
    const res = item
      ? await updateInkCatalogItem(item.id, data)
      : await createInkCatalogItem(data)
    if (res.error) { toast.error(res.error); return }
    toast.success(item ? 'Tinta actualizada' : 'Tinta creada')
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
          density: item.density ?? null,
          viscosity: item.viscosity ?? null,
          optical_density: item.optical_density ?? null,
          prepress_pct: item.prepress_pct ?? null,
          color_code: item.color_code ?? null,
          min_stock_kg: item.min_stock_kg,
        })
      }
    } else {
      onClose()
    }
  }

  if (!open) return null

  const provider = providers.find(p => p.id === item?.provider_id)
  const isHex = item?.color_code?.startsWith('#')

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-md bg-background border-l border-border flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              {mode === 'create' ? 'Nueva Tinta' : mode === 'view' ? 'Detalle de tinta' : 'Editar tinta'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              {item ? item.code : 'Completa los datos'}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* VIEW MODE */}
        {mode === 'view' && item && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {isHex && (
              <div className="h-2 w-full rounded-sm" style={{ background: item.color_code! }} />
            )}
            <div>
              <p className="font-mono text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.code}</p>
              <h3 className="font-heading text-2xl font-bold tracking-tight leading-tight mt-1">{item.name}</h3>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
              )}
            </div>

            {/* Stock */}
            <div className="border border-border/50">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/40">
                Stock actual
              </p>
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <StockBadge current={item.current_stock_kg} min={item.min_stock_kg} unit="kg" />
                  <span className="font-mono text-sm text-foreground">
                    {(item.current_stock_kg ?? 0).toFixed(2)} kg
                  </span>
                </div>
                <StockBar current={item.current_stock_kg} min={item.min_stock_kg} />
                <p className="text-[10px] text-muted-foreground">Mínimo: {item.min_stock_kg} kg</p>
              </div>
            </div>

            {/* Specs */}
            <div className="border border-border/50">
              {/* Impresión */}
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/40">
                Especificaciones de impresión
              </p>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {item.density != null && (
                  <ViewField label="Vol. anilox (cm³/m²)" value={`${item.density}`} />
                )}
                {item.prepress_pct != null && (
                  <ViewField label="Cobertura" value={`${item.prepress_pct}%`} />
                )}
              </div>

              {/* Condiciones */}
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-y border-border/50 bg-muted/40">
                Condiciones de tinta
              </p>
              <div className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {item.ink_type && (
                  <ViewField label="Tipo">
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-widest bg-foreground text-background">
                      {INK_TYPE_LABELS[item.ink_type as InkType]}
                    </span>
                  </ViewField>
                )}
                {item.viscosity != null && (
                  <ViewField label="Viscosidad (cP)" value={`${item.viscosity}`} />
                )}
                {item.color_code && (
                  <ViewField label="Color">
                    <div className="flex items-center gap-2">
                      {isHex && (
                        <span className="size-3.5 rounded-sm border border-border/50" style={{ background: item.color_code }} />
                      )}
                      <span className="font-mono text-sm">{item.color_code}</span>
                    </div>
                  </ViewField>
                )}
                {provider && <ViewField label="Proveedor" value={provider.name} />}
                {item.last_purchase_date && (
                  <ViewField label="Última compra" value={new Date(item.last_purchase_date).toLocaleDateString('es-MX')} />
                )}
              </div>

              {/* Control de calidad — solo si hay OD */}
              {item.optical_density != null && (
                <>
                  <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-t border-border/50 bg-muted/20">
                    Control de calidad
                  </p>
                  <div className="px-4 py-3">
                    <ViewField label="Densidad óptica (OD)" value={`${item.optical_density}`} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* FORM MODE */}
        {mode !== 'view' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Código *" error={errors.code?.message}>
                <input {...register('code')} placeholder="TIN-001" className={inputCls} />
              </Field>
              <Field label="Min. stock (kg) *" error={errors.min_stock_kg?.message}>
                <input
                  {...register('min_stock_kg', { valueAsNumber: true })}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Nombre *" error={errors.name?.message}>
              <input {...register('name')} placeholder="Tinta Negra UV" className={inputCls} />
            </Field>

            <Field label="Descripción (opcional)" error={errors.description?.message}>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Notas adicionales sobre la tinta..."
                className={inputCls + ' resize-none pt-2 h-auto'}
              />
            </Field>

            {/* Especificaciones */}
            <div className="border border-border/50">

              {/* ── Impresión ── */}
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50 bg-muted/30">
                Especificaciones de impresión
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field
                  label="Volumen de anilox (cm³/m²)"
                  error={errors.density?.message}
                  info={{
                    what: 'Volumen de celda del rodillo anilox que transfiere la tinta al sustrato.',
                    why: 'A mayor volumen, más depósito de tinta. Valores bajos dan colores tenues; valores altos, colores sólidos y opacos.',
                    example: '3.5 cm³/m² (proceso CMYK) · 6.0 cm³/m² (blanco o barniz)',
                  }}
                >
                  <input
                    {...register('density', { valueAsNumber: true })}
                    type="number" step="0.01" min="0"
                    placeholder="ej. 3.50"
                    className={inputCls}
                  />
                </Field>
                <Field
                  label="Cobertura (%)"
                  error={errors.prepress_pct?.message}
                  info={{
                    what: 'Porcentaje de área cubierta por la imagen en el archivo de preprensa.',
                    why: 'Se usa para estimar el consumo real de tinta por trabajo. Una cobertura alta implica mayor gasto.',
                    example: '30% (texto/líneas) · 75% (fondo sólido)',
                  }}
                >
                  <div className="relative w-1/2">
                    <input
                      {...register('prepress_pct', { valueAsNumber: true })}
                      type="number" step="0.1" min="0" max="100"
                      placeholder="ej. 75"
                      className={inputCls + ' pr-8'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none select-none">%</span>
                  </div>
                </Field>
              </div>

              {/* ── Condiciones de tinta ── */}
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-y border-border/50 bg-muted/30">
                Condiciones de tinta
              </p>
              <div className="px-4 py-3 space-y-3">
                <Field label="Tipo de tinta" error={errors.ink_type?.message}>
                  <div className="flex border border-border">
                    {INK_TYPES.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setValue('ink_type', inkTypeValue === t ? null : t, { shouldValidate: true })}
                        className={cn(
                          'flex-1 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors',
                          inkTypeValue === t
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        {INK_TYPE_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </Field>
                <div className="w-1/2 pr-1.5">
                  <Field
                    label="Viscosidad (cP)"
                    error={errors.viscosity?.message}
                    info={{
                      what: 'Resistencia al flujo de la tinta, medida en centipoise (cP).',
                      why: 'Demasiado alta: la tinta no transfiere bien y genera puntos. Demasiado baja: escurre y mancha. Controlarla es clave para reproducibilidad.',
                      example: '18 cP (UV flexo típico) · 12–25 cP (rango aceptable)',
                    }}
                  >
                    <input
                      {...register('viscosity', { valueAsNumber: true })}
                      type="number" step="0.1" min="0"
                      placeholder="ej. 18.0"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

              {/* ── Control de calidad ── */}
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60 border-t border-border/50 bg-muted/20">
                Control de calidad
              </p>
              <div className="px-4 py-3">
                <div className="w-1/2">
                  <Field
                    label="Densidad óptica — OD"
                    error={errors.optical_density?.message}
                    info={{
                      what: 'Medida de la opacidad del color impreso usando un densitómetro.',
                      why: 'Permite verificar que el color cumple la especificación del cliente y es consistente entre tirajes.',
                      example: '1.80 (negro) · 1.40 (cian) · 1.50 (magenta) · 1.05 (amarillo)',
                    }}
                  >
                    <input
                      {...register('optical_density', { valueAsNumber: true })}
                      type="number" step="0.01" min="0"
                      placeholder="ej. 1.80"
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>

            </div>

            <Field label="Color (opcional)" error={errors.color_code?.message}>
              <ColorPicker
                value={colorCodeValue ?? null}
                onChange={v => setValue('color_code', v, { shouldValidate: true })}
              />
            </Field>

            <Field label="Proveedor (opcional)" error={errors.provider_id?.message}>
              <select
                {...register('provider_id', { setValueAs: v => (v === '' ? null : Number(v)) })}
                className={inputCls}
              >
                <option value="">— Sin proveedor —</option>
                {providers
                  .filter(p => p.provider_type === 'INK_SUPPLIER' || p.provider_type === 'BOTH')
                  .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
              </select>
            </Field>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border/50 flex gap-3 shrink-0">
          {mode === 'view' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Cerrar
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => setMode('edit')}
                  className="flex-1 py-2.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
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
                {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear tinta'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Color Picker ─────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [tab, setTab] = useState<ColorFormat>('HEX')
  const [hexText, setHexText] = useState(value ?? '')
  const [rgb, setRgb] = useState({ r: '', g: '', b: '' })
  const [hsl, setHsl] = useState({ h: '', s: '', l: '' })
  const nativeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!value) {
      setHexText('')
      setRgb({ r: '', g: '', b: '' })
      setHsl({ h: '', s: '', l: '' })
      return
    }
    const parsed = hexToRgb(value)
    if (parsed) {
      setHexText(value)
      setRgb({ r: String(parsed.r), g: String(parsed.g), b: String(parsed.b) })
      const hslVal = rgbToHsl(parsed.r, parsed.g, parsed.b)
      setHsl({ h: String(hslVal.h), s: String(hslVal.s), l: String(hslVal.l) })
    } else {
      setHexText(value)
    }
  }, [value])

  const previewHex = (() => {
    const h = hexText.startsWith('#') ? hexText : '#' + hexText
    return /^#[0-9a-fA-F]{6}$/.test(h) ? h : null
  })()

  function syncAllFromHex(hex: string) {
    const parsed = hexToRgb(hex)
    if (!parsed) return
    setHexText(hex)
    setRgb({ r: String(parsed.r), g: String(parsed.g), b: String(parsed.b) })
    const hslVal = rgbToHsl(parsed.r, parsed.g, parsed.b)
    setHsl({ h: String(hslVal.h), s: String(hslVal.s), l: String(hslVal.l) })
    onChange(hex)
  }

  function handleHexChange(text: string) {
    setHexText(text)
    const h = text.startsWith('#') ? text : '#' + text
    if (/^#[0-9a-fA-F]{6}$/.test(h)) {
      syncAllFromHex(h)
    } else {
      onChange(text || null)
    }
  }

  function handleRgbChange(channel: 'r' | 'g' | 'b', val: string) {
    const next = { ...rgb, [channel]: val }
    setRgb(next)
    const r = parseInt(next.r), g = parseInt(next.g), b = parseInt(next.b)
    if (!isNaN(r) && !isNaN(g) && !isNaN(b) && r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = rgbToHex(r, g, b)
      setHexText(hex)
      const hslVal = rgbToHsl(r, g, b)
      setHsl({ h: String(hslVal.h), s: String(hslVal.s), l: String(hslVal.l) })
      onChange(hex)
    }
  }

  function handleHslChange(channel: 'h' | 's' | 'l', val: string) {
    const next = { ...hsl, [channel]: val }
    setHsl(next)
    const h = parseInt(next.h), s = parseInt(next.s), l = parseInt(next.l)
    if (!isNaN(h) && !isNaN(s) && !isNaN(l) && h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const { r, g, b } = hslToRgb(h, s, l)
      const hex = rgbToHex(r, g, b)
      setHexText(hex)
      setRgb({ r: String(r), g: String(g), b: String(b) })
      onChange(hex)
    }
  }

  return (
    <div className="flex gap-3">
      {/* Swatch — click to open native color picker */}
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => nativeRef.current?.click()}
          style={{ background: previewHex ?? undefined }}
          className={cn(
            'size-16 border border-border flex items-center justify-center transition-colors hover:border-foreground/40',
            !previewHex && 'bg-muted'
          )}
          title="Abrir selector de color"
        >
          {!previewHex && <Palette className="size-4 text-muted-foreground" />}
        </button>
        <input
          ref={nativeRef}
          type="color"
          className="sr-only"
          value={previewHex ?? '#000000'}
          onChange={e => syncAllFromHex(e.target.value)}
        />
      </div>

      {/* Tabs + inputs */}
      <div className="flex-1 min-w-0">
        {/* Format tabs */}
        <div className="flex border border-border mb-2">
          {(['HEX', 'RGB', 'HSL'] as ColorFormat[]).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors',
                tab === t
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* HEX input */}
        {tab === 'HEX' && (
          <input
            value={hexText}
            onChange={e => handleHexChange(e.target.value)}
            placeholder="#1A1A1A"
            className={inputCls}
          />
        )}

        {/* RGB inputs */}
        {tab === 'RGB' && (
          <div className="grid grid-cols-3 gap-1.5">
            {(['r', 'g', 'b'] as const).map(ch => (
              <div key={ch}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {ch.toUpperCase()}
                </p>
                <input
                  value={rgb[ch]}
                  onChange={e => handleRgbChange(ch, e.target.value)}
                  type="number"
                  min="0"
                  max="255"
                  placeholder="0"
                  className={inputCls + ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
                />
              </div>
            ))}
          </div>
        )}

        {/* HSL inputs */}
        {tab === 'HSL' && (
          <div className="grid grid-cols-3 gap-1.5">
            {([['h', 'H°', 360], ['s', 'S%', 100], ['l', 'L%', 100]] as const).map(([ch, label, max]) => (
              <div key={ch}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  {label}
                </p>
                <input
                  value={hsl[ch]}
                  onChange={e => handleHslChange(ch, e.target.value)}
                  type="number"
                  min="0"
                  max={max}
                  placeholder="0"
                  className={inputCls + ' [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Color conversion utilities ───────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b]
    .map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
    .join('')
}

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360; s /= 100; l /= 100
  let r: number, g: number, b: number
  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

// ─── Shared primitives ────────────────────────────────────────────────────────

const inputCls =
  'w-full border-b border-foreground/20 bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring [&_option]:bg-background [&_option]:text-foreground'

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
          open ? 'text-foreground' : 'text-muted-foreground hover:text-foreground/60'
        )}
      >
        <Info className="size-3.5" />
      </button>

      {open && (
        <div
          style={{ position: 'fixed', top: pos.top, left: pos.left, width: 272, zIndex: 200 }}
          className="bg-background border border-border px-3.5 py-3 space-y-2"
        >
          <div
            style={{ position: 'absolute', top: -5, left: Math.min(
              Math.max((btnRef.current?.getBoundingClientRect().left ?? 0) + 8 - pos.left, 10),
              252
            ) }}
            className="size-2.5 rotate-45 bg-background border-l border-t border-border"
          />
          <p className="text-[11px] text-foreground/80 leading-snug">{info.what}</p>
          <p className="text-[11px] text-muted-foreground leading-snug">{info.why}</p>
          <p className="font-mono text-[10px] text-muted-foreground/60 pt-2 border-t border-border leading-relaxed">
            {info.example}
          </p>
        </div>
      )}
    </>
  )
}

function Field({ label, error, info, children }: {
  label: string
  error?: string
  info?: FieldInfoData
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
        {info && <InfoPopover info={info} />}
      </div>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}

function ViewField({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/70 mb-0.5">{label}</p>
      {children ?? <p className="text-sm text-foreground">{value}</p>}
    </div>
  )
}
