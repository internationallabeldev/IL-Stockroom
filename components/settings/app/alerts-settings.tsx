'use client'

import { useTransition } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import type { AppSettings } from '@/types/app-settings.types'

type AlertsValues = AppSettings['alerts']

export function AlertsSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, watch, control, formState: { isDirty } } = useForm<AlertsValues>({
    defaultValues: settings.alerts,
  })

  const percentage = watch('low_stock_percentage')

  function onSubmit(values: AlertsValues) {
    startTransition(async () => {
      const res = await updateSettings('alerts', {
        quality_pending_days: Number(values.quality_pending_days),
        order_overdue_days:   Number(values.order_overdue_days),
        low_stock_percentage: Number(values.low_stock_percentage),
      })
      if (res.error) toast.error(res.error)
      else toast.success('Umbrales de alertas guardados')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      <div className="space-y-1.5 max-w-xs">
        <Label className="text-[10px] uppercase tracking-widest">Días antes de alertar por calidad pendiente</Label>
        <Input
          {...register('quality_pending_days', { valueAsNumber: true })}
          type="number"
          min={1}
          max={30}
        />
        <p className="text-[9px] text-muted-foreground">
          Una recepción en PENDIENTE por más de este número de días aparecerá
          destacada en el dashboard del almacenista.
        </p>
      </div>

      <div className="space-y-1.5 max-w-xs">
        <Label className="text-[10px] uppercase tracking-widest">Días para considerar orden atrasada</Label>
        <Input
          {...register('order_overdue_days', { valueAsNumber: true })}
          type="number"
          min={1}
          max={60}
        />
        <p className="text-[9px] text-muted-foreground">
          Una orden que supere este número de días después de su fecha esperada
          de entrega aparecerá como atrasada.
        </p>
      </div>

      <div className="space-y-4 max-w-sm">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-widest">Porcentaje de stock bajo</Label>
          <span className="text-sm font-bold tabular-nums">{percentage}%</span>
        </div>
        <Controller
          control={control}
          name="low_stock_percentage"
          render={({ field }) => (
            <Slider
              min={5}
              max={100}
              step={5}
              value={[field.value]}
              onValueChange={([v]) => field.onChange(v)}
            />
          )}
        />
        <p className="text-[9px] text-muted-foreground">
          Alertar cuando el stock actual sea menor al {percentage}% del mínimo
          configurado. Ejemplo: si el mínimo es 100 kg, se alertará cuando
          queden menos de {percentage} kg.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar alertas'}
        </Button>
      </div>
    </form>
  )
}
