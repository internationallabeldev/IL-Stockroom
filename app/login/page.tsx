import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'
import { LoginForm } from './_components/login-form'

export const metadata: Metadata = {
  title: 'Acceso — IL Stockroom',
}

export default function LoginPage() {
  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5F2EA]">
            Iniciar sesión
          </h1>
          <p className="mt-1.5 text-sm text-[#F5F2EA]/40">
            Ingresa tus credenciales de acceso
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </AuthCard>
    </AuthShell>
  )
}
