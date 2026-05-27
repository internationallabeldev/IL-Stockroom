'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { updateSettings } from '@/actions/app-settings.actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { AppSettings } from '@/types/app-settings.types'

type SuppliesValues = AppSettings['supplies']

const ROLES: { value: string; label: string; desc: string }[] = [
  { value: 'ADMIN',             label: 'Administrador',      desc: 'Acceso completo al sistema' },
  { value: 'WAREHOUSE_MANAGER', label: 'Almacén',            desc: 'Gestión de inventario' },
  { value: 'PURCHASER',         label: 'Compras',            desc: 'Órdenes de compra' },
  { value: 'PRODUCER',          label: 'Producción',         desc: 'Requisiciones de producción' },
  { value: 'USER',              label: 'Usuario',            desc: 'Solo consultas y reportes' },
]

export function SuppliesSettings({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, watch, setValue, formState: { isDirty } } = useForm<SuppliesValues>({
    defaultValues: settings.supplies,
  })

  const selectedRoles = watch('alert_roles') ?? []

  function toggleRole(role: string) {
    const current = selectedRoles
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role]
    setValue('alert_roles', next, { shouldDirty: true })
  }

  function onSubmit(values: SuppliesValues) {
    startTransition(async () => {
      const res = await updateSettings('supplies', {
        alert_roles:          values.alert_roles,
        alert_cooldown_hours: Number(values.alert_cooldown_hours),
      })
      if (res.error) toast.error(res.error)
      else toast.success('Configuración de consumibles guardada')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

      {/* Alert roles */}
      <div className="space-y-3">
        <div>
          <Label className="text-[10px] uppercase tracking-widest">Roles que reciben alertas de stock bajo</Label>
          <p className="text-[9px] text-muted-foreground mt-1">
            Cuando un consumible baje del mínimo se enviará un correo a todos los usuarios activos con los roles seleccionados.
          </p>
        </div>

        <div className="space-y-2">
          {ROLES.map(role => {
            const isSelected = selectedRoles.includes(role.value)
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => toggleRole(role.value)}
                className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                  isSelected
                    ? 'border-foreground bg-foreground/5'
                    : 'border-border hover:border-foreground/40'
                }`}
              >
                <span className={`size-4 shrink-0 border-2 flex items-center justify-center transition-colors ${
                  isSelected ? 'border-foreground bg-foreground' : 'border-border'
                }`}>
                  {isSelected && (
                    <svg viewBox="0 0 10 8" className="size-2.5 text-background" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M1 4l3 3 5-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-widest">{role.label}</span>
                  <span className="block text-[9px] text-muted-foreground">{role.desc}</span>
                </span>
              </button>
            )
          })}
        </div>

        {selectedRoles.length === 0 && (
          <p className="text-[9px] text-yellow-600">
            Sin roles seleccionados no se enviarán alertas de stock bajo.
          </p>
        )}
      </div>

      {/* Cooldown */}
      <div className="space-y-1.5 max-w-xs">
        <Label className="text-[10px] uppercase tracking-widest">Horas entre alertas repetidas</Label>
        <Input
          {...register('alert_cooldown_hours', { valueAsNumber: true })}
          type="number"
          min={1}
          max={168}
        />
        <p className="text-[9px] text-muted-foreground">
          Si el mismo item sigue bajo mínimo, no se vuelve a alertar hasta que pasen estas horas.
          Por defecto: 24 h.
        </p>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !isDirty}
          className="text-[10px] uppercase tracking-widest h-8"
        >
          {isPending ? 'Guardando...' : 'Guardar configuración'}
        </Button>
      </div>

    </form>
  )
}
