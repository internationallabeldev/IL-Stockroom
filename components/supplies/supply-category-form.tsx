'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { createSupplyCategory, updateSupplyCategory } from '@/actions/supplies.actions'
import { type SupplyCategory } from '@/lib/supplies/types'
import { createCategorySchema, type CreateCategoryValues } from '@/lib/validations/supplies.schema'


type Props = {
  open: boolean
  onClose: () => void
  category?: SupplyCategory | null
}

export function SupplyCategoryForm({ open, onClose, category }: Props) {
  const isEdit = !!category
  const queryClient  = useQueryClient()
  const nativePickerRef = useRef<HTMLInputElement>(null)
  const [colorInput, setColorInput] = useState(category?.color ?? '')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<CreateCategoryValues>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: {
      name:        category?.name        ?? '',
      description: category?.description ?? '',
      color:       category?.color       ?? null,
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        name:        category?.name        ?? '',
        description: category?.description ?? '',
        color:       category?.color       ?? null,
      })
      setColorInput(category?.color ?? '')
    }
  }, [open])

  const watchedColor = watch('color')

  function handleColorSelect(hex: string) {
    setValue('color', hex, { shouldValidate: true })
    setColorInput(hex)
  }

  function handleColorInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setColorInput(val)
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      setValue('color', val, { shouldValidate: true })
    }
  }

  async function onSubmit(values: CreateCategoryValues) {
    const res = isEdit
      ? await updateSupplyCategory(category!.id, values)
      : await createSupplyCategory(values)

    if (res.error) { toast.error(res.error); return }
    toast.success(isEdit ? 'Categoría actualizada' : 'Categoría creada')
    queryClient.invalidateQueries({ queryKey: ['supply-categories'] })
    reset()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold uppercase tracking-widest">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
              Nombre *
            </label>
            <input
              {...register('name')}
              className="w-full h-9 border border-border bg-background px-3 text-sm outline-none focus:border-foreground/40 transition-colors"
              placeholder="Ej. Tintas UV, Suajes, Adhesivos..."
            />
            {errors.name && <p className="text-[10px] text-destructive mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
              Descripción
            </label>
            <textarea
              {...register('description')}
              rows={2}
              className="w-full border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40 transition-colors resize-none"
              placeholder="Descripción opcional de la categoría"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-foreground/60 mb-1.5">
              Color de acento
            </label>

            {/* Hidden native color input */}
            <input
              ref={nativePickerRef}
              type="color"
              value={watchedColor ?? '#000000'}
              onChange={e => handleColorSelect(e.target.value)}
              className="sr-only"
            />

            {/* Small swatch + hex input + clear */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => nativePickerRef.current?.click()}
                className="size-9 shrink-0 border border-border hover:border-foreground/40 transition-colors"
                style={{ backgroundColor: watchedColor ?? undefined }}
                title="Seleccionar color"
              />
              <input
                type="text"
                value={colorInput}
                onChange={handleColorInputChange}
                placeholder="#3b82f6"
                className="flex-1 h-9 border border-border bg-background px-3 text-sm font-mono outline-none focus:border-foreground/40 transition-colors"
              />
              {watchedColor && (
                <button
                  type="button"
                  onClick={() => { setColorInput(''); setValue('color', null, { shouldValidate: true }) }}
                  className="h-9 px-3 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
            {errors.color && <p className="text-[10px] text-destructive mt-1">{errors.color.message}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => { reset(); onClose() }}
              className="flex-1 h-9 border border-border text-[10px] font-bold uppercase tracking-widest text-foreground/60 hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-9 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
