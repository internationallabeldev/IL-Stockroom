'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { updateOwnProfile } from '@/actions/users.actions'
import { updateProfileSchema, type UpdateProfileValues } from '@/lib/validations/user.schema'
import type { AppUser } from '@/actions/users.actions'

type Props = {
  user: AppUser
}

export function ProfileForm({ user }: Props) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar_url ?? null)
  const fileRef = useRef<HTMLInputElement>(null)

  const initials = `${user.first_name[0] ?? ''}${user.last_name[0] ?? ''}`.toUpperCase()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileValues>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone ?? '',
    },
  })

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setAvatarPreview(url)
  }

  async function onSubmit(values: UpdateProfileValues) {
    const formData = new FormData()
    formData.set('first_name', values.first_name)
    formData.set('last_name', values.last_name)
    formData.set('phone', values.phone ?? '')

    const file = fileRef.current?.files?.[0]
    if (file) formData.set('avatar', file)

    const result = await updateOwnProfile(formData)
    if (result.error) toast.error(result.error)
    else toast.success('Perfil actualizado')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="size-20 object-cover"
            />
          ) : (
            <div className="size-20 bg-[#1A1A1A] flex items-center justify-center">
              <span className="text-[#F5F2EA] text-2xl font-bold">{initials}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            <Camera className="size-5 text-white" />
          </button>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1">
            Foto de perfil
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A] hover:opacity-60 transition-opacity"
          >
            Cambiar imagen
          </button>
          <p className="text-[10px] text-[#5f5e59] mt-0.5">JPG, PNG. Máx 2MB</p>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
            Nombre
          </label>
          <input
            {...register('first_name')}
            className="w-full h-9 border border-[#1A1A1A]/20 bg-white px-3 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
          />
          {errors.first_name && (
            <p className="mt-1 text-[10px] text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
            Apellido
          </label>
          <input
            {...register('last_name')}
            className="w-full h-9 border border-[#1A1A1A]/20 bg-white px-3 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
          />
          {errors.last_name && (
            <p className="mt-1 text-[10px] text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
          Teléfono
        </label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full h-9 border border-[#1A1A1A]/20 bg-white px-3 text-xs outline-none focus:border-[#1A1A1A]/50 transition-colors"
          placeholder="Opcional"
        />
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] mb-1.5">
          Email
        </label>
        <input
          value={user.email}
          disabled
          className="w-full h-9 border border-[#1A1A1A]/10 bg-[#E5E1D8] px-3 text-xs text-[#5f5e59] cursor-not-allowed"
        />
        <p className="mt-1 text-[10px] text-[#5f5e59]">El email no puede modificarse.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-9 px-6 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Guardar cambios
      </button>
    </form>
  )
}
