'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '@/types/app-settings.types'

type RequisitionsValues = AppSettings['requisitions']

export function RequisitionsSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { isDirty } } = useForm<RequisitionsValues>({
    defaultValues: settings.requisitions,
  })

  function onSubmit(values: RequisitionsValues) {
    startTransition(async () => {
      const res = await updateSettings('requisitions', {
        max_response_hours:    Number(values.max_response_hours),
        rejection_placeholder: values.rejection_placeholder,
      })
      if (res.error) toast.error(res.error)
      else toast.success('Configuración de requisiciones guardada')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-1.5 max-w-xs">
        <Label className="text-[10px] uppercase tracking-widest">Horas máximas de respuesta</Label>
        <Input
          {...register('max_response_hours', { valueAsNumber: true })}
          type="number"
          min={1}
          max={168}
        />
        <p className="text-[9px] text-muted-foreground">
          Una requisición sin atender después de este número de horas aparecerá
          con alerta en el dashboard del almacenista.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-widest">Texto placeholder para motivo de rechazo</Label>
        <Input
          {...register('rejection_placeholder')}
          placeholder="Por favor especifica el motivo del rechazo..."
        />
        <p className="text-[9px] text-muted-foreground">
          Texto de ayuda que aparece en el campo de motivo al rechazar una
          requisición.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar requisiciones'}
        </Button>
      </div>
    </form>
  )
}
