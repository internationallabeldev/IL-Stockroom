'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'
import { AUTH_BUTTON_CLASS } from '@/components/auth/auth-submit-button'
import { getAuthErrorEntry } from '@/lib/auth/error-messages'

function ErrorContent() {
  const params = useSearchParams()
  const code = params.get('error')
  const { title, message } = getAuthErrorEntry(code)

  return (
    <AuthCard>
      <div className="text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center border border-destructive/30 bg-destructive/10">
          <AlertTriangle className="size-5 text-destructive" />
        </div>

        <h1 className="font-heading text-xl font-bold uppercase tracking-tight text-[#F5F2EA] mb-2">
          {title}
        </h1>

        <p className="text-sm text-[#F5F2EA]/50 mb-6">{message}</p>

        {code === 'expired' && (
          <Link
            href="/auth/reset-password"
            className="mb-3 block text-[11px] font-bold uppercase tracking-widest text-[#F5F2EA]/60 underline-offset-4 hover:underline"
          >
            Solicitar nuevo enlace
          </Link>
        )}

        {!code && (
          <p className="text-[10px] text-[#F5F2EA]/35 mb-6">
            Si fuiste invitado al sistema, solicita al administrador que envíe una nueva invitación.
          </p>
        )}

        <Link href="/login" className={AUTH_BUTTON_CLASS}>
          Ir al inicio de sesión
        </Link>
      </div>
    </AuthCard>
  )
}

export default function AuthErrorPage() {
  return (
    <AuthShell>
      <Suspense>
        <ErrorContent />
      </Suspense>
    </AuthShell>
  )
}
