'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useForm, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Upload, Loader2, Pencil, Mail, Phone, MessageCircle, MapPin, ExternalLink, Globe, FileText, ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { providerSchema, TAX_REGIMES, CURRENCIES, type ProviderFormInput, type ProviderFormValues } from '@/lib/validations/provider.schema'
import { createProvider, updateProvider, type Provider } from '@/actions/providers.actions'
import { createClient } from '@/lib/supabase/client'

const ProviderMap = dynamic(() => import('@/components/maps/provider-map'), { ssr: false })

const TYPE_OPTIONS = [
  { value: 'INK_SUPPLIER',    label: 'Proveedor de Tintas' },
  { value: 'PAPER_SUPPLIER',  label: 'Proveedor de Papel' },
  { value: 'SUPPLY_SUPPLIER', label: 'Proveedor de Consumibles' },
  { value: 'BOTH',            label: 'Múltiples tipos' },
]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  INK_SUPPLIER:    { label: 'Tintas',      color: '#008dc2' },
  PAPER_SUPPLIER:  { label: 'Papel',       color: '#5f5e59' },
  SUPPLY_SUPPLIER: { label: 'Consumibles', color: '#7c3aed' },
  BOTH:            { label: 'Múltiples',   color: '#1A1A1A' },
}

const SUPPLY_TYPE_OPTIONS = [
  { value: 'INK',      label: 'Tintas' },
  { value: 'PAPER',    label: 'Papel' },
  { value: 'SUPPLIES', label: 'Consumibles' },
]

type StepField = keyof ProviderFormInput

type StepDef = {
  id: 'general' | 'fiscal' | 'comercial' | 'operativo'
  label: string
  title: string
  hint: string
  fields: StepField[]
}

/**
 * Los pasos agrupan los campos por clasificación del dato. `fields` es lo que se
 * valida al pulsar «Continuar», así que tiene que cubrir todos los campos que se
 * renderizan en ese paso.
 */
const STEPS: StepDef[] = [
  {
    id: 'general',
    label: 'General',
    title: 'Identificación y contacto',
    hint: 'Los campos marcados con * son obligatorios.',
    fields: ['logo_url', 'provider_type', 'supply_types', 'name', 'email', 'phone', 'whatsapp', 'contact_person'],
  },
  {
    id: 'fiscal',
    label: 'Fiscal',
    title: 'Datos fiscales y domicilio',
    hint: 'Lo que permite conciliar la orden de compra con el CFDI del proveedor. Solo la dirección es obligatoria.',
    fields: ['legal_name', 'rfc', 'tax_regime', 'address', 'postal_code', 'city', 'state', 'country', 'latitude', 'longitude'],
  },
  {
    id: 'comercial',
    label: 'Comercial',
    title: 'Condiciones comerciales',
    hint: 'Todo opcional. Sirve de referencia al levantar una orden de compra.',
    fields: ['payment_terms_days', 'currency', 'credit_limit', 'customer_number', 'bank', 'account_number', 'clabe'],
  },
  {
    id: 'operativo',
    label: 'Operativo',
    title: 'Operativo y cumplimiento',
    hint: 'Todo opcional.',
    fields: ['billing_email', 'website', 'csf_url', 'compliance_opinion_date', 'notes'],
  },
]

const LAST_STEP = STEPS.length - 1

const EMPTY_FORM: ProviderFormInput = {
  name: '', email: '', phone: '', address: '',
  provider_type: 'INK_SUPPLIER',
  whatsapp: null, contact_person: null, logo_url: null,
  latitude: null, longitude: null, supply_types: null,
  rfc: null, legal_name: null, tax_regime: null,
  postal_code: null, city: null, state: null, country: 'MX',
  payment_terms_days: null, currency: 'MXN', credit_limit: null,
  bank: null, clabe: null, account_number: null, customer_number: null,
  billing_email: null, website: null, notes: null,
  csf_url: null, compliance_opinion_date: null,
}

/**
 * Mapea el registro de BD a los valores del form. RHF traduce null a '' en los
 * inputs, así que no hace falta normalizar aquí.
 */
function toFormValues(p: Provider): ProviderFormInput {
  return {
    name:                    p.name,
    email:                   p.email,
    phone:                   p.phone,
    address:                 p.address,
    provider_type:           p.provider_type,
    whatsapp:                p.whatsapp,
    contact_person:          p.contact_person,
    logo_url:                p.logo_url,
    latitude:                p.latitude,
    longitude:               p.longitude,
    supply_types:            (p.supply_types as ProviderFormInput['supply_types']) ?? null,
    rfc:                     p.rfc,
    legal_name:              p.legal_name,
    tax_regime:              p.tax_regime,
    postal_code:             p.postal_code,
    city:                    p.city,
    state:                   p.state,
    country:                 p.country ?? 'MX',
    payment_terms_days:      p.payment_terms_days,
    currency:                (p.currency as ProviderFormInput['currency']) ?? 'MXN',
    credit_limit:            p.credit_limit,
    bank:                    p.bank,
    clabe:                   p.clabe,
    account_number:          p.account_number,
    customer_number:         p.customer_number,
    billing_email:           p.billing_email,
    website:                 p.website,
    notes:                   p.notes,
    csf_url:                 p.csf_url,
    compliance_opinion_date: p.compliance_opinion_date,
  }
}

type DialogMode = 'create' | 'view' | 'edit'

type Props = {
  open: boolean
  onClose: () => void
  provider?: Provider | null
  mode?: DialogMode
  canEdit?: boolean
}

export function ProviderForm({ open, onClose, provider, mode: initialMode = 'create', canEdit = false }: Props) {
  const queryClient = useQueryClient()
  const [mode, setMode]               = useState<DialogMode>(initialMode)
  const [uploading, setUploading]     = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [step, setStep]               = useState(0)
  // Hasta dónde puede saltar el usuario desde el stepper sin pasar por «Continuar».
  const [maxStep, setMaxStep]         = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    getValues,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
    // El schema transforma ('' → null, string → number), así que el tipo de los
    // campos (input) y el que recibe onSubmit (output) no son el mismo.
  } = useForm<ProviderFormInput, unknown, ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: EMPTY_FORM,
  })

  const lat          = watch('latitude')
  const lng          = watch('longitude')
  const logoUrl      = watch('logo_url')
  const providerType = watch('provider_type')

  useEffect(() => {
    // Al cerrar no se limpia nada: el diálogo tiene animación de salida y el
    // reset se vería como un parpadeo. Abrir siempre reinicia el estado.
    if (!open) return
    setMode(initialMode)
    setStep(0)
    // Editando, los datos ya pasaron validación: dejamos saltar a cualquier paso
    // para no obligar a recorrer el asistente completo por un cambio menor.
    setMaxStep(provider ? LAST_STEP : 0)
    if (provider) {
      reset(toFormValues(provider))
      setLogoPreview(provider.logo_url)
    } else {
      reset(EMPTY_FORM)
      setLogoPreview(null)
    }
  }, [open, provider, initialMode, reset])

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `providers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const supabase = createClient()
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
    setUploading(false)
    if (error) { toast.error(error.message); return }
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    setValue('logo_url', data.publicUrl)
    setLogoPreview(data.publicUrl)
  }

  /**
   * El `.refine` de supply_types vive a nivel del objeto, y zod no corre los
   * refinements de objeto si algún campo falló — incluido `address`, que está en
   * otro paso. Sin este chequeo explícito el paso 1 se dejaría pasar con un
   * proveedor múltiple sin tipos, y el error recién aparecería al guardar.
   */
  function validateSupplyTypes(): boolean {
    if (getValues('provider_type') !== 'BOTH') return true
    const types = getValues('supply_types')
    if (Array.isArray(types) && types.length >= 2) return true
    setError('supply_types', { message: 'Selecciona al menos 2 tipos para proveedor múltiple' })
    return false
  }

  async function goNext() {
    if (STEPS[step].id === 'general' && !validateSupplyTypes()) return
    const ok = await trigger(STEPS[step].fields)
    if (!ok) return
    const next = Math.min(step + 1, LAST_STEP)
    setStep(next)
    setMaxStep(m => Math.max(m, next))
  }

  async function onSubmit(data: ProviderFormValues) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v === null || v === undefined) return
      if (k === 'supply_types') fd.append(k, JSON.stringify(v))
      else fd.append(k, String(v))
    })
    const res = provider
      ? await updateProvider(provider.id, fd)
      : await createProvider(fd)
    if (res.error) { toast.error(res.error); return }
    // La lista vive en el cache de React Query (no en el server component), así
    // que revalidatePath no basta: hay que invalidar la query para que refetchee.
    await queryClient.invalidateQueries({ queryKey: ['providers'] })
    toast.success(provider ? 'Proveedor actualizado' : 'Proveedor creado')
    onClose()
  }

  /** Un error de un paso anterior sería invisible desde el último: hay que ir a él. */
  function onInvalid(formErrors: FieldErrors<ProviderFormInput>) {
    const failing = STEPS.findIndex(s => s.fields.some(f => formErrors[f]))
    if (failing >= 0 && failing !== step) {
      setStep(failing)
      setMaxStep(m => Math.max(m, failing))
    }
    toast.error('Revisa los campos marcados')
  }

  function handleCancel() {
    if (mode === 'edit' && initialMode === 'view') {
      setMode('view')
      setStep(0)
      if (provider) {
        reset(toFormValues(provider))
        setLogoPreview(provider.logo_url)
      }
    } else {
      onClose()
    }
  }

  const type    = provider ? TYPE_LABELS[provider.provider_type] : null
  const current = STEPS[step]

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onClose() }}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">

        {/* ── Header ── */}
        <DialogHeader className="shrink-0 space-y-0 border-b border-border px-6 py-4 text-left">
          <DialogTitle className="font-heading text-xl font-bold tracking-tight">
            {mode === 'create' ? 'Nuevo Proveedor' : mode === 'view' ? 'Detalle del proveedor' : 'Editar proveedor'}
          </DialogTitle>
          <DialogDescription className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {provider ? provider.name : 'Completa los datos'}
          </DialogDescription>
        </DialogHeader>

        {/* ── VIEW MODE ── */}
        {mode === 'view' && provider && (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex items-start gap-4">
              {provider.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={provider.logo_url}
                  alt={provider.name}
                  className="size-16 object-contain border border-border bg-white shrink-0"
                />
              ) : (
                <div className="size-16 shrink-0 bg-muted border border-border flex items-center justify-center">
                  <span className="font-heading font-bold text-2xl text-foreground/30">
                    {provider.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-2xl font-bold tracking-tight leading-tight">
                  {provider.name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {type && (
                    <span
                      className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border"
                      style={{ color: type.color, borderColor: type.color + '40' }}
                    >
                      {type.label}
                    </span>
                  )}
                  {provider.provider_type === 'BOTH' && provider.supply_types && provider.supply_types.length > 0 && (
                    <span className="text-[9px] text-muted-foreground">
                      {provider.supply_types.map((t: string) =>
                        t === 'INK' ? 'Tintas' : t === 'PAPER' ? 'Papel' : 'Consumibles'
                      ).join(' + ')}
                    </span>
                  )}
                  <span
                    className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
                      provider.enabled
                        ? 'text-[#008dc2] border-[#008dc2]/30'
                        : 'text-muted-foreground border-border'
                    }`}
                  >
                    {provider.enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contacto */}
            <div className="border border-border">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/40">
                Contacto
              </p>
              <div className="px-4 py-3 space-y-3">
                {provider.contact_person && (
                  <p className="text-sm font-medium text-foreground">{provider.contact_person}</p>
                )}
                <a href={`mailto:${provider.email}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Mail className="size-3.5 shrink-0" />
                  {provider.email}
                </a>
                <a href={`tel:${provider.phone}`} className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Phone className="size-3.5 shrink-0" />
                  {provider.phone}
                </a>
                {provider.whatsapp && (
                  <a
                    href={`https://wa.me/${provider.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-[#25D366] transition-colors"
                  >
                    <MessageCircle className="size-3.5 shrink-0" />
                    {provider.whatsapp}
                  </a>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div className="border border-border">
              <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/40">
                Dirección
              </p>
              <p className="px-4 py-3 text-sm text-foreground">{provider.address}</p>
            </div>

            {/* Mapa */}
            {provider.latitude !== null && provider.longitude !== null && (
              <div className="border border-border">
                <div className="px-4 py-2 flex items-center justify-between border-b border-border bg-muted/40">
                  <div className="flex items-center gap-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Ubicación</p>
                    <span className="font-mono text-[9px] text-muted-foreground">
                      {provider.latitude.toFixed(6)}, {provider.longitude.toFixed(6)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${provider.latitude},${provider.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#008dc2] hover:opacity-70 transition-opacity"
                  >
                    <ExternalLink className="size-3" />
                    Google Maps
                  </a>
                </div>
                <ProviderMap
                  lat={provider.latitude}
                  lng={provider.longitude}
                  onChange={() => {}}
                  readOnly
                />
              </div>
            )}

            {provider.latitude === null && (
              <div className="flex items-center gap-2 text-muted-foreground/60">
                <MapPin className="size-3.5" />
                <p className="text-[11px]">Sin ubicación registrada</p>
              </div>
            )}

            <InfoCard
              title="Datos fiscales"
              rows={[
                { label: 'RFC',              value: provider.rfc, mono: true },
                { label: 'Razón social',     value: provider.legal_name },
                { label: 'Régimen fiscal',   value: taxRegimeLabel(provider.tax_regime) },
                { label: 'Domicilio fiscal', value: fiscalLocation(provider) },
              ]}
            />

            <InfoCard
              title="Condiciones comerciales"
              rows={[
                {
                  label: 'Crédito',
                  value: provider.payment_terms_days === null
                    ? null
                    : provider.payment_terms_days === 0 ? 'Contado' : `${provider.payment_terms_days} días`,
                },
                { label: 'Moneda', value: provider.currency },
                {
                  label: 'Límite de crédito',
                  value: provider.credit_limit === null
                    ? null
                    : provider.credit_limit.toLocaleString('es-MX', { style: 'currency', currency: provider.currency ?? 'MXN' }),
                },
                { label: 'Nº de cliente', value: provider.customer_number, mono: true },
                { label: 'Banco',         value: provider.bank },
                { label: 'Cuenta',        value: provider.account_number, mono: true },
                { label: 'CLABE',         value: provider.clabe, mono: true },
              ]}
            />

            <InfoCard
              title="Operativo y cumplimiento"
              rows={[
                { label: 'Facturación', value: provider.billing_email },
                {
                  label: 'Opinión 32-D',
                  value: provider.compliance_opinion_date
                    ? new Date(`${provider.compliance_opinion_date}T00:00:00`)
                        .toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
                    : null,
                },
              ]}
            />

            {(provider.website || provider.csf_url) && (
              <div className="flex flex-wrap gap-4">
                {provider.website && (
                  <a
                    href={provider.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#008dc2] hover:opacity-70 transition-opacity"
                  >
                    <Globe className="size-3" />
                    Sitio web
                  </a>
                )}
                {provider.csf_url && (
                  <a
                    href={provider.csf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#008dc2] hover:opacity-70 transition-opacity"
                  >
                    <FileText className="size-3" />
                    Constancia fiscal
                  </a>
                )}
              </div>
            )}

            {provider.notes && (
              <div className="border border-border">
                <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/40">
                  Notas internas
                </p>
                <p className="px-4 py-3 text-sm text-foreground whitespace-pre-line">{provider.notes}</p>
              </div>
            )}
          </div>
        )}

        {/* ── FORM MODE (create | edit) ── */}
        {mode !== 'view' && (
          <>
            {/* Stepper */}
            <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-border px-6 py-3">
              {STEPS.map((s, i) => {
                const done    = i < step
                const active  = i === step
                const enabled = i <= maxStep
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { if (enabled) setStep(i) }}
                    disabled={!enabled}
                    className={`flex shrink-0 items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      active
                        ? 'text-foreground'
                        : enabled
                          ? 'text-muted-foreground hover:text-foreground'
                          : 'text-muted-foreground/40 cursor-not-allowed'
                    }`}
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center border text-[9px] ${
                        active
                          ? 'border-foreground bg-foreground text-background'
                          : done
                            ? 'border-[#008dc2] text-[#008dc2]'
                            : 'border-border'
                      }`}
                    >
                      {done ? <Check className="size-3" /> : i + 1}
                    </span>
                    {s.label}
                  </button>
                )
              })}
            </div>

            <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="flex-1 overflow-y-auto px-6 py-5">
              <div className="mb-5">
                <p className="font-heading text-base font-bold tracking-tight">{current.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground/70">{current.hint}</p>
              </div>

              {/* ── Paso 1 · General ── */}
              {current.id === 'general' && (
                <div className="space-y-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Logo</p>
                    <div className="flex items-center gap-3">
                      {(logoPreview || logoUrl) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(logoPreview || logoUrl)!} alt="logo" className="size-14 object-contain border border-border bg-white" />
                      ) : (
                        <div className="size-14 border border-dashed border-border bg-muted flex items-center justify-center">
                          <Upload className="size-5 text-foreground/30" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {uploading && <Loader2 className="size-3 animate-spin" />}
                        {uploading ? 'Subiendo...' : 'Subir imagen'}
                      </button>
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                      Tipo de proveedor <Required />
                    </label>
                    <select {...register('provider_type')} className={inputCls}>
                      {TYPE_OPTIONS.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>

                    {providerType === 'BOTH' && (
                      <div className="mt-2 border border-border p-3 space-y-2">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                          Tipos que maneja (mín. 2) <Required />
                        </p>
                        {SUPPLY_TYPE_OPTIONS.map(opt => (
                          <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                            <input
                              type="checkbox"
                              value={opt.value}
                              {...register('supply_types')}
                              className="size-3.5 accent-foreground"
                            />
                            <span className="text-sm text-foreground/70 group-hover:text-foreground transition-colors">
                              {opt.label}
                            </span>
                          </label>
                        ))}
                        {errors.supply_types && (
                          <p className="text-[10px] text-destructive mt-1">{errors.supply_types.message}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <Field label="Nombre comercial" required error={errors.name?.message}>
                    <input {...register('name')} placeholder="Tintas Norma" className={inputCls} />
                  </Field>

                  <Field label="Email" required error={errors.email?.message}>
                    <input {...register('email')} type="email" placeholder="contacto@proveedor.mx" className={inputCls} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Teléfono" required error={errors.phone?.message}>
                      <input {...register('phone')} placeholder="+52 777 000 0000" className={inputCls} />
                    </Field>
                    <Field label="WhatsApp" error={errors.whatsapp?.message}>
                      <input {...register('whatsapp')} placeholder="+52 777 000 0000" className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Persona de contacto" error={errors.contact_person?.message}>
                    <input {...register('contact_person')} placeholder="Nombre del contacto" className={inputCls} />
                  </Field>
                </div>
              )}

              {/* ── Paso 2 · Fiscal y domicilio ── */}
              {current.id === 'fiscal' && (
                <div className="space-y-5">
                  <Field label="Razón social" error={errors.legal_name?.message}>
                    <input {...register('legal_name')} placeholder="Tintas Norma, S.A. de C.V." className={inputCls} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="RFC" error={errors.rfc?.message}>
                      <input {...register('rfc')} placeholder="ABC010101AB1" maxLength={13} className={inputCls + ' uppercase'} />
                    </Field>
                    <Field label="Régimen fiscal" error={errors.tax_regime?.message}>
                      <select {...register('tax_regime')} className={inputCls}>
                        <option value="">Sin especificar</option>
                        {TAX_REGIMES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field label="Dirección" required error={errors.address?.message}>
                    <textarea {...register('address')} rows={2} placeholder="Av. Morelos Norte 123, Cuernavaca, Mor." className={inputCls + ' resize-none pt-2'} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Código postal" error={errors.postal_code?.message}>
                      <input {...register('postal_code')} placeholder="62000" maxLength={5} inputMode="numeric" className={inputCls} />
                    </Field>
                    <Field label="Ciudad" error={errors.city?.message}>
                      <input {...register('city')} placeholder="Cuernavaca" className={inputCls} />
                    </Field>
                    <Field label="Estado" error={errors.state?.message}>
                      <input {...register('state')} placeholder="Morelos" className={inputCls} />
                    </Field>
                    <Field label="País" error={errors.country?.message}>
                      <input {...register('country')} placeholder="MX" className={inputCls} />
                    </Field>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Ubicación — click o arrastra el marcador
                    </p>
                    {lat !== null && lng !== null && (
                      <p className="text-[10px] font-mono text-muted-foreground mb-1.5">
                        {lat?.toFixed(6)}, {lng?.toFixed(6)}
                      </p>
                    )}
                    <ProviderMap
                      lat={lat ?? null}
                      lng={lng ?? null}
                      onChange={(la, lo) => { setValue('latitude', la); setValue('longitude', lo) }}
                    />
                  </div>
                </div>
              )}

              {/* ── Paso 3 · Comercial ── */}
              {current.id === 'comercial' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Días de crédito" error={errors.payment_terms_days?.message}>
                      <input {...register('payment_terms_days')} type="number" min={0} placeholder="30" className={inputCls} />
                    </Field>
                    <Field label="Moneda" error={errors.currency?.message}>
                      <select {...register('currency')} className={inputCls}>
                        {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Límite de crédito" error={errors.credit_limit?.message}>
                      <input {...register('credit_limit')} type="number" min={0} step="0.01" placeholder="150000.00" className={inputCls} />
                    </Field>
                    <Field label="Nuestro nº de cliente" error={errors.customer_number?.message}>
                      <input {...register('customer_number')} placeholder="CL-00432" className={inputCls} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Banco" error={errors.bank?.message}>
                      <input {...register('bank')} placeholder="BBVA" className={inputCls} />
                    </Field>
                    <Field label="Nº de cuenta" error={errors.account_number?.message}>
                      <input {...register('account_number')} placeholder="0123456789" className={inputCls} />
                    </Field>
                  </div>

                  <Field label="CLABE interbancaria" error={errors.clabe?.message}>
                    <input {...register('clabe')} placeholder="012345678901234567" maxLength={18} inputMode="numeric" className={inputCls} />
                  </Field>
                </div>
              )}

              {/* ── Paso 4 · Operativo ── */}
              {current.id === 'operativo' && (
                <div className="space-y-5">
                  <Field label="Email de facturación" error={errors.billing_email?.message}>
                    <input {...register('billing_email')} type="email" placeholder="facturacion@proveedor.mx" className={inputCls} />
                  </Field>

                  <Field label="Sitio web" error={errors.website?.message}>
                    <input {...register('website')} placeholder="https://proveedor.mx" className={inputCls} />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Constancia de situación fiscal (URL)" error={errors.csf_url?.message}>
                      <input {...register('csf_url')} placeholder="https://..." className={inputCls} />
                    </Field>
                    <Field label="Opinión 32-D (fecha)" error={errors.compliance_opinion_date?.message}>
                      <input {...register('compliance_opinion_date')} type="date" className={inputCls} />
                    </Field>
                  </div>

                  <Field label="Notas internas" error={errors.notes?.message}>
                    <textarea {...register('notes')} rows={3} placeholder="Acuerdos, incidencias, contactos alternos..." className={inputCls + ' resize-none pt-2'} />
                  </Field>
                </div>
              )}
            </form>
          </>
        )}

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-border px-6 py-4 flex gap-3">
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
                  onClick={() => { setMode('edit'); setStep(0); setMaxStep(LAST_STEP) }}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-2"
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
                onClick={step === 0 ? handleCancel : () => setStep(s => s - 1)}
                className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors flex items-center justify-center gap-1.5"
              >
                {step === 0 ? 'Cancelar' : <><ArrowLeft className="size-3" />Atrás</>}
              </button>

              <p className="hidden shrink-0 self-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 sm:block">
                {step + 1} / {STEPS.length}
              </p>

              {step < LAST_STEP ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center gap-1.5"
                >
                  Continuar
                  <ArrowRight className="size-3" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit(onSubmit, onInvalid)}
                  disabled={isSubmitting || uploading}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                  {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear proveedor'}
                </button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

const inputCls =
  'w-full border-b border-foreground/20 bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring [&_option]:bg-background [&_option]:text-foreground'

function Required() {
  return <span className="text-destructive" aria-hidden>*</span>
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
        {label} {required && <Required />}
      </label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}

type InfoRow = { label: string; value?: string | null; mono?: boolean }

/** No renderiza nada si el proveedor no tiene ninguno de esos datos capturados. */
function InfoCard({ title, rows }: { title: string; rows: InfoRow[] }) {
  const filled = rows.filter(r => r.value)
  if (filled.length === 0) return null

  return (
    <div className="border border-border">
      <p className="px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border bg-muted/40">
        {title}
      </p>
      <dl className="px-4 py-3 space-y-2">
        {filled.map(r => (
          <div key={r.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0">{r.label}</dt>
            <dd className={`text-sm text-foreground text-right ${r.mono ? 'font-mono' : ''}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function taxRegimeLabel(code: string | null) {
  if (!code) return null
  return TAX_REGIMES.find(r => r.value === code)?.label ?? code
}

function fiscalLocation(p: Provider) {
  const parts = [p.postal_code, p.city, p.state, p.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : null
}
