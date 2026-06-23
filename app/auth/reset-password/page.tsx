'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'
import { requestPasswordResetAction } from '@/actions/auth.actions'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthField } from '@/components/auth/auth-field'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'

async function resetWrapper(_: unknown, formData: FormData) {
  return requestPasswordResetAction(formData)
}

export default function ResetPasswordPage() {
  const [state, formAction, isPending] = useActionState(resetWrapper, null)

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5F2EA]">
            Recuperar acceso
          </h1>
          <p className="mt-1.5 text-sm text-[#F5F2EA]/40">
            Te enviaremos un enlace para crear una nueva contraseña
          </p>
        </div>

        {state?.success ? (
          <p className="text-sm text-[#F5F2EA]/60">
            Si el correo existe en el sistema, te enviamos un enlace para restablecer tu
            contraseña. Revisa tu bandeja de entrada.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-5">
            {state?.error && (
              <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-destructive">
                {state.error}
              </div>
            )}

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

            <AuthSubmitButton pending={isPending} label="Enviar enlace" loadingLabel="ENVIANDO" />
          </form>
        )}

        <Link
          href="/login"
          className="mt-6 block text-center text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/35 hover:text-[#F5F2EA]/60"
        >
          Volver al inicio de sesión
        </Link>
      </AuthCard>
    </AuthShell>
  )
}
