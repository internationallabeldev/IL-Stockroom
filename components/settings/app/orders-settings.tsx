'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '@/types/app-settings.types'

type OrdersValues = AppSettings['orders']

export function OrdersSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, formState: { isDirty } } = useForm<OrdersValues>({
    defaultValues: settings.orders,
  })

  function onSubmit(values: OrdersValues) {
    startTransition(async () => {
      const res = await updateSettings('orders', {
        number_sequence_start:  Number(values.number_sequence_start),
        default_payment_method: values.default_payment_method,
        default_delivery_place: values.default_delivery_place,
      })
      if (res.error) toast.error(res.error)
      else toast.success('Configuración de órdenes guardada')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

      <div className="space-y-1.5 max-w-2xl">
        <Label className="text-[10px] uppercase tracking-widest">Método de pago por defecto</Label>
        <Input {...register('default_payment_method')} placeholder="Ej: Transferencia" />
        <p className="text-[9px] text-muted-foreground">
          Se pre-llenará automáticamente al crear una nueva orden de compra.
        </p>
      </div>

      <div className="space-y-1.5 max-w-2xl">
        <Label className="text-[10px] uppercase tracking-widest">Lugar de entrega por defecto</Label>
        <Input {...register('default_delivery_place')} placeholder="Ej: Directo en Planta" />
        <p className="text-[9px] text-muted-foreground">
          Se pre-llenará automáticamente al crear una nueva orden de compra.
        </p>
      </div>

      <div className="space-y-1.5 max-w-2xl">
        <Label className="text-[10px] uppercase tracking-widest">Número inicial de secuencia</Label>
        <Input
          {...register('number_sequence_start', { valueAsNumber: true })}
          type="number"
          min={1}
        />
        <div className="flex items-start gap-2 p-3 border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <span className="text-amber-600 dark:text-amber-400 mt-px shrink-0">⚠️</span>
          <p className="text-[9px] text-amber-700 dark:text-amber-300 leading-relaxed">
            Solo modificar si es la primera configuración del sistema.
            Cambiar este valor no afecta órdenes ya creadas.
            Número actual de referencia: <strong>{settings.orders.number_sequence_start}</strong>
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar órdenes'}
        </Button>
      </div>
    </form>
  )
}
