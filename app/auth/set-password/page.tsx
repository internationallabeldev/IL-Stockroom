'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Las contraseñas no coinciden',
  path: ['confirm'],
})

type Values = z.infer<typeof schema>

const ROLE_REDIRECTS: Record<string, string> = {
  ADMIN:             '/dashboard',
  PURCHASER:         '/dashboard/orders',
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
    <div className="min-h-screen bg-[#F5F2EA] flex">
      <div className="hidden lg:flex w-80 shrink-0 flex-col justify-between bg-[#1A1A1A] text-[#F5F2EA] p-10">
        <div>
          <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
        </div>
        <div>
          <p className="font-heading text-3xl font-bold leading-tight mb-4">
            Bienvenido al<br />sistema de<br />inventario.
          </p>
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20">
          Uso interno exclusivo
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-8">
        <div className="w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
          </div>

          <div className="mb-8">
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#1A1A1A]">
              Crear contraseña
            </h1>
            <p className="mt-1.5 text-sm text-[#5f5e59]">
              Establece una contraseña para acceder al sistema
            </p>
          </div>

          <div className="border border-[#1A1A1A]/15 bg-[#fdf9f0] p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/30" />
                  <input
                    {...register('password')}
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    className="w-full h-10 border border-[#1A1A1A]/20 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#1A1A1A]/50 transition-colors"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/30" />
                  <input
                    {...register('confirm')}
                    type="password"
                    className="w-full h-10 border border-[#1A1A1A]/20 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#1A1A1A]/50 transition-colors"
                  />
                </div>
                {errors.confirm && (
                  <p className="mt-1 text-[10px] text-red-600">{errors.confirm.message}</p>
                )}
              </div>

              {error && (
                <p className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  'Activar cuenta'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
