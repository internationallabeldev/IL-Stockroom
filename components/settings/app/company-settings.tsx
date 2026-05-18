'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { updateSettings, uploadCompanyLogo } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '@/types/app-settings.types'

type CompanyValues = AppSettings['company']

export function CompanySettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.company.logo_url,
  )
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { isDirty } } = useForm<CompanyValues>({
    defaultValues: settings.company,
  })

  function onSubmit(values: CompanyValues) {
    startTransition(async () => {
      const res = await updateSettings('company', values)
      if (res.error) toast.error(res.error)
      else toast.success('Identidad de empresa guardada')
    })
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLogoPreview(URL.createObjectURL(file))
    setUploading(true)

    const formData = new FormData()
    formData.append('logo', file)
    const res = await uploadCompanyLogo(formData)

    setUploading(false)
    if (res.error) {
      toast.error(res.error)
      setLogoPreview(settings.company.logo_url)
    } else {
      toast.success('Logo actualizado')
      setLogoPreview(res.url ?? null)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      {/* Logo */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Logo de la empresa
        </p>
        <div className="flex items-center gap-4">
          <div className="size-16 border border-border flex items-center justify-center bg-muted shrink-0 overflow-hidden">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Logo"
                width={64}
                height={64}
                className="object-contain size-full"
                unoptimized
              />
            ) : (
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                Sin logo
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="text-[10px] uppercase tracking-widest h-8"
            >
              <Upload className="size-3 mr-1.5" />
              {uploading ? 'Subiendo...' : 'Cambiar logo'}
            </Button>
            {logoPreview && (
              <button
                type="button"
                onClick={() => {
                  setLogoPreview(null)
                  startTransition(async () => {
                    await updateSettings('company', { ...settings.company, logo_url: null })
                    toast.success('Logo eliminado')
                  })
                }}
                className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="size-3" /> Eliminar logo
              </button>
            )}
            <p className="text-[9px] text-muted-foreground">PNG, JPG o SVG · Máx 5MB</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/svg+xml"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest">Nombre de la empresa</Label>
          <Input {...register('name')} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest">Teléfono</Label>
          <Input {...register('phone')} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest">Dirección</Label>
          <Input {...register('address')} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest">RFC</Label>
          <Input {...register('rfc')} placeholder="Ej: ILA000101XXX" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest">Domicilio fiscal</Label>
          <Input {...register('fiscal_address')} />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-[10px] uppercase tracking-widest">Dirección de bodega</Label>
          <Input {...register('warehouse_address')} />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar empresa'}
        </Button>
      </div>
    </form>
  )
}
