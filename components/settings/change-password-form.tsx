'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { updateOwnPassword } from '@/actions/users.actions'
import { changeOwnPasswordSchema, type ChangeOwnPasswordValues } from '@/lib/validations/user.schema'

export function ChangePasswordForm() {
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangeOwnPasswordValues>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirm: '' },
  })

  async function onSubmit(values: ChangeOwnPasswordValues) {
    const result = await updateOwnPassword(values.currentPassword, values.newPassword)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Contraseña actualizada correctamente')
    reset()
  }

  const inputType = showPassword ? 'text' : 'password'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
          Contraseña actual
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[#1A1A1A]/30" />
          <input
            {...register('currentPassword')}
            type={inputType}
            className="w-full h-9 border border-[#1A1A1A]/20 bg-white pl-9 pr-9 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/30 hover:text-[#1A1A1A]/60 transition-colors"
          >
            {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-[10px] text-red-600">{errors.currentPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
          Nueva contraseña
        </label>
        <input
          {...register('newPassword')}
          type={inputType}
          className="w-full h-9 border border-[#1A1A1A]/20 bg-white px-3 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
          placeholder="Mínimo 8 caracteres"
        />
        {errors.newPassword && (
          <p className="mt-1 text-[10px] text-red-600">{errors.newPassword.message}</p>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
          Confirmar nueva contraseña
        </label>
        <input
          {...register('confirm')}
          type={inputType}
          className="w-full h-9 border border-[#1A1A1A]/20 bg-white px-3 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
        />
        {errors.confirm && (
          <p className="mt-1 text-[10px] text-red-600">{errors.confirm.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-9 px-6 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Cambiar contraseña
      </button>
    </form>
  )
}
