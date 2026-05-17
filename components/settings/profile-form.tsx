'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Camera } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { updateOwnProfile, uploadAvatar } from '@/actions/users.actions'
import { updateOwnProfileSchema, type UpdateOwnProfileValues } from '@/lib/validations/user.schema'
import { UserAvatar } from '@/components/shared/user-avatar'
import type { AppUser } from '@/actions/users.actions'

type ExtUser = AppUser & {
  nickname?:  string | null
  job_title?: string | null
}

type Props = {
  user: AppUser
}

export function ProfileForm({ user }: Props) {
  const u = user as ExtUser
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatar_url ?? null)
  const [uploading, setUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateOwnProfileValues>({
    resolver: zodResolver(updateOwnProfileSchema),
    defaultValues: {
      nickname:  u.nickname  ?? '',
      phone:     user.phone  ?? '',
      job_title: u.job_title ?? '',
    },
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const preview = URL.createObjectURL(file)
    setAvatarUrl(preview)

    const fd = new FormData()
    fd.set('avatar', file)
    setUploading(true)
    uploadAvatar(fd).then(res => {
      if (res.error) {
        toast.error(res.error)
        setAvatarUrl(user.avatar_url ?? null)
      } else {
        toast.success('Foto actualizada')
        if (res.url) setAvatarUrl(res.url)
        router.refresh()
      }
    }).finally(() => setUploading(false))
  }

  async function onSubmit(values: UpdateOwnProfileValues) {
    const res = await updateOwnProfile({
      nickname:  values.nickname  || null,
      phone:     values.phone     || null,
      job_title: values.job_title || null,
    })
    if (res.error) toast.error(res.error)
    else {
      toast.success('Perfil actualizado')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            avatarUrl={avatarUrl}
            size="lg"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading
              ? <Loader2 className="size-5 text-white animate-spin" />
              : <Camera className="size-5 text-white" />
            }
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Foto de perfil
          </p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-[10px] font-bold uppercase tracking-widest hover:opacity-60 transition-opacity"
          >
            Cambiar imagen
          </button>
          <p className="text-[10px] text-muted-foreground mt-0.5">JPG, PNG, WEBP — Máx. 2 MB</p>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Read-only name */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Nombre</label>
          <input
            value={user.first_name}
            disabled
            className="w-full h-9 border border-border bg-muted px-3 text-xs text-muted-foreground cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Apellido</label>
          <input
            value={user.last_name}
            disabled
            className="w-full h-9 border border-border bg-muted px-3 text-xs text-muted-foreground cursor-not-allowed"
          />
        </div>
      </div>

      {/* Nickname */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Apodo</label>
        <input
          {...register('nickname')}
          className="w-full h-9 border border-border bg-background px-3 text-xs outline-none focus:border-foreground/40 transition-colors"
          placeholder="Cómo te llaman (opcional)"
        />
        {errors.nickname && <p className="mt-1 text-[10px] text-red-600">{errors.nickname.message}</p>}
      </div>

      {/* Job title */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Cargo</label>
        <input
          {...register('job_title')}
          className="w-full h-9 border border-border bg-background px-3 text-xs outline-none focus:border-foreground/40 transition-colors"
          placeholder="Tu puesto o área (opcional)"
        />
        {errors.job_title && <p className="mt-1 text-[10px] text-red-600">{errors.job_title.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Teléfono</label>
        <input
          {...register('phone')}
          type="tel"
          className="w-full h-9 border border-border bg-background px-3 text-xs outline-none focus:border-foreground/40 transition-colors"
          placeholder="Opcional"
        />
      </div>

      {/* Read-only email */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Email</label>
        <input
          value={user.email}
          disabled
          className="w-full h-9 border border-border bg-muted px-3 text-xs text-muted-foreground cursor-not-allowed"
        />
        <p className="mt-1 text-[10px] text-muted-foreground">El email no puede modificarse.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-9 px-6 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50 flex items-center gap-2"
      >
        {isSubmitting && <Loader2 className="size-3.5 animate-spin" />}
        Guardar cambios
      </button>
    </form>
  )
}
