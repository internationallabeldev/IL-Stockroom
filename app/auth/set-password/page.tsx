'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthCard } from '@/components/auth/auth-card'
import { AuthField } from '@/components/auth/auth-field'
import { AuthSubmitButton } from '@/components/auth/auth-submit-button'
import { passwordSchema } from '@/lib/validations/password.schema'

const schema = z.object({
  password: passwordSchema,
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

type Values = z.infer<typeof schema>

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN:             '/dashboard',
  PURCHASER:         '/dashboard/orders/ink',
  WAREHOUSE_MANAGER: '/dashboard/inventory',
  PRODUCER:          '/dashboard/requisitions',
  USER:              '/dashboard',
}

export default function SetPasswordPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: Values) {
    setError(null)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: values.password,
    })

    if (updateError) {
      setError(updateError.message)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    router.push(ROLE_REDIRECTS[profile?.role ?? 'USER'])
  }

  return (
    <AuthShell>
      <AuthCard>
        <div className="mb-8">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5F2EA]">
            Nueva contraseña
          </h1>
          <p className="mt-1.5 text-sm text-[#F5F2EA]/40">
            Crea una nueva contraseña para tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
          <div>
            <AuthField
              id="password"
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 8 caracteres"
              icon={Lock}
              {...register('password')}
            />
            {errors.password && (
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>

          <div>
            <AuthField
              id="confirm"
              label="Confirmar contraseña"
              type="password"
              icon={Lock}
              {...register('confirm')}
            />
            {errors.confirm && (
              <p className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-destructive">
                {errors.confirm.message}
              </p>
            )}
          </div>

          {error && (
            <div className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-destructive">
              {error}
            </div>
          )}

          <AuthSubmitButton pending={isSubmitting} label="Guardar contraseña" />
        </form>
      </AuthCard>
    </AuthShell>
  )
}
