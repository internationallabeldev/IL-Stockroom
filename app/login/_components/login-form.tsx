'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock } from 'lucide-react'
import { loginAction } from '@/actions/auth.actions'
import { AuthField } from '@/components/auth/auth-field'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { getAuthErrorEntry } from '@/lib/auth/error-messages'

async function loginWrapper(_: unknown, formData: FormData) {
  return loginAction(formData)
}

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginWrapper, null)
  const params = useSearchParams()
  const redirectTo = params.get('redirect') ?? ''
  const errorCode = params.get('error')
  const urlError = !state?.error && errorCode ? getAuthErrorEntry(errorCode).message : null

  return (
    <>
      <form action={formAction} className="flex flex-col gap-5">
        {(state?.error || urlError) && (
          <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-destructive">
            {state?.error ?? urlError}
          </div>
        )}

        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        <AuthField
          id="email"
          name="email"
          type="email"
          label="Correo electrónico"
          placeholder="usuario@empresa.com"
          autoComplete="email"
          icon={Mail}
          required
          disabled={isPending}
        />

        <AuthField
          id="password"
          name="password"
          type="password"
          label="Contraseña"
          placeholder="••••••••"
          autoComplete="current-password"
          icon={Lock}
          required
          disabled={isPending}
        />

        <Link
          href="/auth/reset-password"
          className="self-end text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/35 hover:text-[#F5F2EA]/60"
        >
          ¿Olvidaste tu contraseña?
        </Link>

        <AuthSubmitButton pending={isPending} label="Acceder al sistema" />
      </form>

      <GoogleAuthButton />
    </>
  )
}
