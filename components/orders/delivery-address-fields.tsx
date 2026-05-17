'use client'

import { type DeliveryAddress, MEXICAN_STATES } from '@/lib/validations/purchase-order.schema'

const BASE_CLS =
  'w-full h-9 border border-foreground/20 px-3 text-sm outline-none focus:border-foreground/50 transition-colors'

type Props = {
  address: DeliveryAddress
  onChange: (field: keyof DeliveryAddress, value: string) => void
  error?: string
  required?: boolean
  bg?: string
}

export function DeliveryAddressFields({
  address,
  onChange,
  error,
  required = false,
  bg = 'bg-card',
}: Props) {
  const cls = `${BASE_CLS} ${bg}`
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
        Dirección de entrega{required ? ' *' : ''}
      </p>
      {error && <p className="text-[10px] text-destructive mb-1">{error}</p>}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2">
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
        <div className="grid grid-cols-2 gap-2">
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
    </div>
  )
}
