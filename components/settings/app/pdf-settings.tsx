'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { AppSettings } from '@/types/app-settings.types'

type PdfValues = AppSettings['pdf']

export function PdfSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, watch, formState: { isDirty } } = useForm<PdfValues>({
    defaultValues: settings.pdf,
  })

  const footerLegal   = watch('footer_legal')
  const receptionNotes = watch('reception_notes')
  const revision      = watch('revision')

  function onSubmit(values: PdfValues) {
    startTransition(async () => {
      const res = await updateSettings('pdf', values)
      if (res.error) toast.error(res.error)
      else toast.success('Configuración PDF guardada')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest">Texto de facturación (pie del PDF)</Label>
          <Textarea
            {...register('footer_legal')}
            rows={2}
            className="text-xs resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-widest">Notas de recepción</Label>
          <Textarea
            {...register('reception_notes')}
            rows={4}
            className="text-xs resize-none"
          />
          <p className="text-[9px] text-muted-foreground">
            Condiciones de recepción que aparecen en el pie del PDF
          </p>
        </div>

        <div className="space-y-1.5 max-w-xs">
          <Label className="text-[10px] uppercase tracking-widest">Número de revisión</Label>
          <Input {...register('revision')} placeholder="Ej: Rev: 3" />
        </div>
      </div>

      {/* Preview */}
      <div className="border border-border p-4 bg-muted/30">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
          Vista previa del pie del PDF
        </p>
        <div className="bg-white border border-border/50 p-3 font-[Helvetica] text-center space-y-1">
          <p className="text-[7px] text-[#3a3a3a] leading-relaxed">{footerLegal}</p>
          <div className="border-t border-[#9a9a90]/50 my-1.5" />
          <p className="text-[7px] text-[#5f5e59] leading-relaxed">{receptionNotes}</p>
          <p className="text-[6px] text-[#9a9a90] mt-1 text-right">{revision}</p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar PDF'}
        </Button>
      </div>
    </form>
  )
}
