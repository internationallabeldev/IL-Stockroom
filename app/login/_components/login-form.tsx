'use client'

import { useActionState } from 'react'
import { loginAction } from '@/actions/auth.actions'
import { Loader2 } from 'lucide-react'

async function loginWrapper(_: unknown, formData: FormData) {
  return loginAction(formData)
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginWrapper, null)

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state?.error && (
        <div className="border border-[#ba1a1a]/40 bg-[#ba1a1a]/5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[#ba1a1a]">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Correo electrónico
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="usuario@empresa.com"
          autoComplete="email"
          required
          disabled={isPending}
          className="h-10 w-full border border-[#1A1A1A]/20 bg-[#F5F2EA] px-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/30 focus:border-[#1A1A1A]/60 disabled:opacity-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="h-10 w-full border border-[#1A1A1A]/20 bg-[#F5F2EA] px-3 text-sm text-[#1A1A1A] outline-none transition-colors placeholder:text-[#1A1A1A]/30 focus:border-[#1A1A1A]/60 disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 flex h-11 w-full items-center justify-center gap-2 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-80 disabled:opacity-50 active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <Loader2 className="size-3.5 animate-spin" />
            Verificando…
          </>
        ) : (
          'Acceder al sistema'
        )}
      </button>
    </form>
  )
}
