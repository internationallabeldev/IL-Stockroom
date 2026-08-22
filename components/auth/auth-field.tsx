'use client'

import { useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  icon?: LucideIcon
}

// Input + label compartidos por todos los formularios de auth — mismo
// estilo underline que los inputs de /welcome (screen-05-start.tsx): sin
// caja, borde inferior que pasa a --cmyk-accent al hacer foco. Los campos
// type="password" agregan el ojito para mostrar/ocultar el valor.
export function AuthField({ id, label, icon: Icon, className, type, ...props }: AuthFieldProps) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#F5F2EA]/35"
      >
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-[#F5F2EA]/30" />
        )}
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className={`w-full border-b border-[#F5F2EA]/25 bg-transparent py-2 text-sm text-[#F5F2EA] outline-none transition-colors placeholder:text-[#F5F2EA]/30 focus:border-(--cmyk-accent) disabled:opacity-50 ${Icon ? 'pl-6' : 'pl-0'} ${isPassword ? 'pr-7' : ''} ${className ?? ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(v => !v)}
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-[#F5F2EA]/30 transition-colors hover:text-[#F5F2EA]/60"
          >
            {visible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        )}
      </div>
    </div>
  )
}
