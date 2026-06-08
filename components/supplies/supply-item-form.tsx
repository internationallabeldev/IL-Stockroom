'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ImageIcon, Upload } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  createSupplyItem,
  updateSupplyItem,
  uploadSupplyItemImage,
} from '@/actions/supplies.actions'
import { getSupplyStatus, type SupplyItem, type SupplyCategory } from '@/lib/supplies/types'
import { createItemSchema, type CreateItemValues } from '@/lib/validations/supplies.schema'
import { getProviders } from '@/actions/providers.actions'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

const STATUS_DOT: Record<string, string> = {
  ok:       'bg-green-500',
  warning:  'bg-yellow-400',
  critical: 'bg-red-500',
  empty:    'bg-foreground/80',
}

type Props = {
  open: boolean
  onClose: () => void
  categories: SupplyCategory[]
  item?: SupplyItem | null
  defaultCategoryId?: number
}

export function SupplyItemForm({ open, onClose, categories, item, defaultCategoryId }: Props) {
  const isEdit = !!item
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(item?.image_url ?? null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savedItemId, setSavedItemId] = useState<number | null>(item?.id ?? null)

  const { data: allProviders = [] } = useQuery({
    queryKey: ['providers'],
    queryFn:  () => getProviders({ enabled: true }),
    staleTime: 60_000,
  })

  const providers = allProviders.filter(
    p => p.provider_type === 'SUPPLY_SUPPLIER' || p.provider_type === 'BOTH'
  )

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm<CreateItemValues>({
    resolver: zodResolver(createItemSchema),
    defaultValues: {
      category_id:      item?.category_id      ?? defaultCategoryId,
      name:             item?.name             ?? '',
      description:      item?.description      ?? '',
      unit:             item?.unit             ?? 'piezas',
      quantity_minimum: item?.quantity_minimum ?? undefined,
      quantity_warning: item?.quantity_warning ?? undefined,
      provider_id:      item?.provider_id      ?? null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        category_id:      item?.category_id      ?? defaultCategoryId,
        name:             item?.name             ?? '',
        description:      item?.description      ?? '',
        unit:             item?.unit             ?? 'piezas',
        quantity_minimum: item?.quantity_minimum ?? undefined,
        quantity_warning: item?.quantity_warning ?? undefined,
        provider_id:      item?.provider_id      ?? null,
      })
      setPreviewUrl(item?.image_url ?? null)
      setSavedItemId(item?.id ?? null)
    }
  }, [open])

  const watchMin  = watch('quantity_minimum')
  const watchWarn = watch('quantity_warning')

  const previewWarning = watchWarn ?? (watchMin ? Math.ceil(watchMin * 1.5) : null)

  // Simulate status preview based on quantity_minimum = 0 (new item, not in stock yet)
  const demoStatus = watchMin
    ? getSupplyStatus({ quantity_current: 0, quantity_minimum: watchMin, quantity_warning: watchWarn ?? null })
    : null

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)

    if (!savedItemId) {
      toast.info('Guarda el item primero para subir la imagen')
      return
    }

    setUploadingImage(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await uploadSupplyItemImage(fd, savedItemId)
    setUploadingImage(false)

    if (res.error) { toast.error(res.error); return }
    setPreviewUrl(res.url!)
    toast.success('Imagen actualizada')
  }

  async function onSubmit(values: CreateItemValues) {
    if (isEdit) {
      const res = await updateSupplyItem(item!.id, values)
      if (res.error) { toast.error(res.error); return }
      queryClient.invalidateQueries({ queryKey: ['supply-categories'] })
      toast.success('Item actualizado')
    } else {
      const res = await createSupplyItem(values)
      if (res.error) { toast.error(res.error); return }
      if (res.id) setSavedItemId(res.id)
      toast.success('Item creado')
    }
    queryClient.invalidateQueries({ queryKey: ['supply-categories'] })
    reset()
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
      <SheetContent side="right" className="flex flex-col p-0" style={{ maxWidth: 520 }}>
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-sm font-bold uppercase tracking-widest">
            {isEdit ? 'Editar consumible' : 'Nuevo consumible'}
          </SheetTitle>
        </SheetHeader>

        <form id="supply-item-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Image upload */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="size-16 border border-dashed border-border flex items-center justify-center bg-muted hover:border-foreground/40 transition-colors shrink-0 relative overflow-hidden"
            >
              {previewUrl ? (
                <img src={previewUrl} alt="preview" className="size-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-foreground/20" />
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <Upload className="size-4 animate-pulse text-foreground/50" />
                </div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageChange} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/50">Imagen del item</p>
              <p className="text-[9px] text-foreground/30 mt-0.5">JPG, PNG o WEBP — máx. 2 MB</p>
              {!savedItemId && !isEdit && (
                <p className="text-[9px] text-yellow-600 mt-0.5">Guarda el item para subir imagen</p>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">Categoría *</label>
            <select
              {...register('category_id', { valueAsNumber: true })}
              className="w-full h-9 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors"
            >
              <option value="">Seleccionar categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-[10px] text-destructive mt-1">{errors.category_id.message}</p>}
          </div>

          {/* Name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">Nombre *</label>
            <input
              {...register('name')}
              className="w-full h-9 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors"
              placeholder="Ej. Cinta adhesiva 5cm, Tóner negro..."
            />
            {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">Descripción</label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40 transition-colors resize-none"
              placeholder="Descripción opcional"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">Unidad *</label>
            <input
              {...register('unit')}
              className="w-full h-9 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors"
              placeholder="piezas, rollos, litros, kg..."
            />
            {errors.unit && <p className="text-[10px] text-destructive mt-1">{errors.unit.message}</p>}
          </div>

          {/* Thresholds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
                Mínimo (rojo) *
              </label>
              <input
                {...register('quantity_minimum', { valueAsNumber: true })}
                type="number" min={1}
                className="w-full h-9 border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-foreground/40 transition-colors"
              />
              {errors.quantity_minimum && <p className="text-[10px] text-destructive mt-1">{errors.quantity_minimum.message}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
                Alerta (amarillo)
              </label>
              <input
                {...register('quantity_warning', { setValueAs: v => v === '' ? null : Number(v) })}
                type="number" min={1}
                className="w-full h-9 border border-border bg-background px-3 text-sm tabular-nums outline-none focus:border-foreground/40 transition-colors"
                placeholder={watchMin ? String(Math.ceil(watchMin * 1.5)) : 'Auto (1.5× mín)'}
              />
              {errors.quantity_warning && <p className="text-[10px] text-destructive mt-1">{errors.quantity_warning.message}</p>}
            </div>
          </div>

          {/* Threshold preview */}
          {watchMin && (
            <div className="bg-muted px-3 py-2 flex items-center gap-3 text-[10px]">
              <span className="size-2 rounded-full bg-red-500 shrink-0" />
              <span className="text-foreground/60">Rojo cuando baje de <strong>{watchMin}</strong></span>
              <span className="size-2 rounded-full bg-yellow-400 shrink-0 ml-2" />
              <span className="text-foreground/60">Amarillo cuando baje de <strong>{previewWarning}</strong></span>
            </div>
          )}

          {/* Provider */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">Proveedor</label>
            <select
              {...register('provider_id', { setValueAs: v => v === '' ? null : Number(v) })}
              className="w-full h-9 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors"
            >
              <option value="">Sin proveedor</option>
              {providers.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

        </form>

        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button
            type="submit"
            form="supply-item-form"
            disabled={isSubmitting}
            className="flex-1 h-9 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity"
          >
            {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear item'}
          </button>
          <button
            type="button"
            onClick={() => { reset(); onClose() }}
            className="flex-1 h-9 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
          >
            Cancelar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
