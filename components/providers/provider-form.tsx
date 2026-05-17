'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { X, Upload, Loader2, Pencil, Mail, Phone, MessageCircle, MapPin, ExternalLink } from 'lucide-react'
import { providerSchema, type ProviderFormValues } from '@/lib/validations/provider.schema'
import { createProvider, updateProvider, type Provider } from '@/actions/providers.actions'
import { createClient } from '@/lib/supabase/client'

const ProviderMap = dynamic(() => import('@/components/maps/provider-map'), { ssr: false })

const TYPE_OPTIONS = [
  { value: 'INK_SUPPLIER',   label: 'Proveedor de Tintas' },
  { value: 'PAPER_SUPPLIER', label: 'Proveedor de Papel' },
  { value: 'BOTH',           label: 'Tintas & Papel' },
]

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  INK_SUPPLIER:   { label: 'Tintas',        color: '#008dc2' },
  PAPER_SUPPLIER: { label: 'Papel',          color: '#5f5e59' },
  BOTH:           { label: 'Tintas & Papel', color: '#1A1A1A' },
}

type DrawerMode = 'create' | 'view' | 'edit'

type Props = {
  open: boolean
  onClose: () => void
  provider?: Provider | null
  mode?: DrawerMode
  canEdit?: boolean
}

export function ProviderForm({ open, onClose, provider, mode: initialMode = 'create', canEdit = false }: Props) {
  const [mode, setMode]           = useState<DrawerMode>(initialMode)
  const [uploading, setUploading] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: { provider_type: 'INK_SUPPLIER', latitude: null, longitude: null, logo_url: null },
  })

  const lat    = watch('latitude')
  const lng    = watch('longitude')
  const logoUrl = watch('logo_url')

  useEffect(() => {
    if (!open) {
      reset({ provider_type: 'INK_SUPPLIER', latitude: null, longitude: null, logo_url: null })
      setLogoPreview(null)
      return
    }
    setMode(initialMode)
    if (provider) {
      reset({
        name:           provider.name,
        email:          provider.email,
        phone:          provider.phone,
        whatsapp:       provider.whatsapp ?? undefined,
        address:        provider.address,
        contact_person: provider.contact_person ?? undefined,
        provider_type:  provider.provider_type,
        logo_url:       provider.logo_url ?? undefined,
        latitude:       provider.latitude,
        longitude:      provider.longitude,
      })
      setLogoPreview(provider.logo_url)
    } else {
      reset({ provider_type: 'INK_SUPPLIER', latitude: null, longitude: null, logo_url: null })
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

  async function onSubmit(data: ProviderFormValues) {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => {
      if (v !== null && v !== undefined) fd.append(k, String(v))
    })
    const res = provider
      ? await updateProvider(provider.id, fd)
      : await createProvider(fd)
    if (res.error) { toast.error(res.error); return }
    toast.success(provider ? 'Proveedor actualizado' : 'Proveedor creado')
    onClose()
  }

  function handleCancel() {
    if (mode === 'edit' && initialMode === 'view') {
      setMode('view')
      if (provider) {
        reset({
          name:           provider.name,
          email:          provider.email,
          phone:          provider.phone,
          whatsapp:       provider.whatsapp ?? undefined,
          address:        provider.address,
          contact_person: provider.contact_person ?? undefined,
          provider_type:  provider.provider_type,
          logo_url:       provider.logo_url ?? undefined,
          latitude:       provider.latitude,
          longitude:      provider.longitude,
        })
        setLogoPreview(provider.logo_url)
      }
    } else {
      onClose()
    }
  }

  if (!open) return null

  const type = provider ? TYPE_LABELS[provider.provider_type] : null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative ml-auto h-full w-full max-w-lg bg-background border-l border-border flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              {mode === 'create' ? 'Nuevo Proveedor' : mode === 'view' ? 'Detalle del proveedor' : 'Editar proveedor'}
            </h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-0.5">
              {provider ? provider.name : 'Completa los datos'}
            </p>
          </div>
          <button onClick={onClose} className="size-8 flex items-center justify-center hover:bg-muted transition-colors">
            <X className="size-4" />
          </button>
        </div>

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
          </div>
        )}

        {/* ── FORM MODE (create | edit) ── */}
        {mode !== 'view' && (
          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Logo */}
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

            {/* Tipo */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                Tipo de proveedor
              </label>
              <select
                {...register('provider_type')}
                className="w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50"
              >
                {TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <Field label="Nombre" error={errors.name?.message}>
              <input {...register('name')} placeholder="Tintas Norma SA de CV" className={inputCls} />
            </Field>

            <Field label="Email" error={errors.email?.message}>
              <input {...register('email')} type="email" placeholder="contacto@proveedor.mx" className={inputCls} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Teléfono" error={errors.phone?.message}>
                <input {...register('phone')} placeholder="+52 777 000 0000" className={inputCls} />
              </Field>
              <Field label="WhatsApp (opcional)" error={errors.whatsapp?.message}>
                <input {...register('whatsapp')} placeholder="+52 777 000 0000" className={inputCls} />
              </Field>
            </div>

            <Field label="Persona de contacto (opcional)" error={errors.contact_person?.message}>
              <input {...register('contact_person')} placeholder="Nombre del contacto" className={inputCls} />
            </Field>

            <Field label="Dirección" error={errors.address?.message}>
              <textarea {...register('address')} rows={2} placeholder="Av. Morelos Norte 123, Cuernavaca, Mor." className={inputCls + ' resize-none pt-2'} />
            </Field>

            {/* Mapa */}
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
          </form>
        )}

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
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
                onClick={handleCancel}
                className="flex-1 py-2.5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting || uploading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isSubmitting && <Loader2 className="size-3 animate-spin" />}
                {isSubmitting ? 'Guardando...' : mode === 'edit' ? 'Actualizar' : 'Crear proveedor'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

const inputCls =
  'w-full h-9 border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-foreground/50 transition-colors'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-[10px] text-destructive mt-1">{error}</p>}
    </div>
  )
}
