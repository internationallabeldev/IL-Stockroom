'use client'

import { Building2, Pencil } from 'lucide-react'
import { type DeliveryAddress, MEXICAN_STATES } from '@/lib/validations/purchase-order.schema'

const BASE_CLS =
  'w-full border-b border-foreground/20 bg-transparent py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ring [&_option]:bg-background [&_option]:text-foreground'

type Props = {
  address: DeliveryAddress
  onChange: (field: keyof DeliveryAddress, value: string) => void
  error?: string
  required?: boolean
  bg?: string
  /** Current delivery_place value — used to detect when the default is active. */
  value?: string
  /** Company address from app_settings. When present, shows a "Default" button. */
  defaultAddress?: string | null
  /** Apply the company address as the delivery place. */
  onUseDefault?: () => void
  /** Switch back to manual (structured) entry. */
  onClearDefault?: () => void
}

export function DeliveryAddressFields({
  address,
  onChange,
  error,
  required = false,
  bg = '',
  value,
  defaultAddress,
  onUseDefault,
  onClearDefault,
}: Props) {
  const cls = `${BASE_CLS} ${bg}`
  const usingDefault = !!defaultAddress && !!value && value === defaultAddress

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Dirección de entrega{required ? ' *' : ''}
        </p>
        {defaultAddress && !usingDefault && onUseDefault && (
          <button
            type="button"
            onClick={onUseDefault}
            title="Usar la dirección de la empresa"
            className="flex items-center gap-1.5 border border-ring/50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-ring hover:bg-ring hover:text-background hover:border-ring transition-colors"
          >
            <Building2 className="size-3" />
            Usar default
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-destructive mb-1">{error}</p>}

      {usingDefault ? (
        <div className="flex items-start justify-between gap-3 border border-border/50 bg-muted/30 px-3 py-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
              Dirección de la empresa
            </p>
            <p className="text-sm text-foreground">{value}</p>
          </div>
          {onClearDefault && (
            <button
              type="button"
              onClick={onClearDefault}
              className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              <Pencil className="size-3" />
              Editar
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3">
            <input
              value={address.calle}
              onChange={e => onChange('calle', e.target.value)}
              placeholder="Calle o avenida *"
              className={cls}
            />
            <input
              value={address.ext}
              onChange={e => onChange('ext', e.target.value)}
              placeholder="No. Ext *"
              className={`${cls} w-20`}
            />
            <input
              value={address.int}
              onChange={e => onChange('int', e.target.value)}
              placeholder="Int."
              className={`${cls} w-16`}
            />
          </div>
          <input
            value={address.colonia}
            onChange={e => onChange('colonia', e.target.value)}
            placeholder="Colonia *"
            className={cls}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              value={address.ciudad}
              onChange={e => onChange('ciudad', e.target.value)}
              placeholder="Ciudad o municipio *"
              className={cls}
            />
            <select
              value={address.estado}
              onChange={e => onChange('estado', e.target.value)}
              className={cls}
            >
              <option value="">— Estado *</option>
              {MEXICAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <input
            value={address.cp}
            onChange={e => onChange('cp', e.target.value)}
            placeholder="Código postal *"
            maxLength={5}
            className={`${cls} w-32`}
          />
        </div>
      )}
    </div>
  )
}
