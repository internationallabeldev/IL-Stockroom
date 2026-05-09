'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import {
  inviteUserSchema,
  updateProfileSchema,
} from '@/lib/validations/user.schema'
import type { Database } from '@/types/database.types'

export type AppUser = Database['public']['Tables']['users']['Row']

export async function getUsers(filters?: {
  role?: string
  enabled?: boolean
  search?: string
}): Promise<AppUser[]> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return []

  const admin = createAdminClient()
  let query = admin.from('users').select('*').order('first_name')

  if (filters?.role) query = query.eq('role', filters.role as AppUser['role'])
  if (filters?.enabled !== undefined) query = query.eq('enabled', filters.enabled)
  if (filters?.search) {
    const s = filters.search
    query = query.or(
      `first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return null

  const admin = createAdminClient()
  const { data } = await admin.from('users').select('*').eq('id', id).single()
  return data ?? null
}

export async function inviteUser(data: {
  first_name: string
  last_name: string
  email: string
  role: string
}): Promise<{ success?: boolean; inviteLink?: string; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }

  const parsed = inviteUserSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: parsed.data.email,
    options: {
      redirectTo: `${siteUrl}/auth/confirm`,
      data: {
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        role: parsed.data.role,
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: 'Este email ya existe en el sistema' }
    }
    return { error: error.message }
  }

  revalidatePath('/dashboard/users')
  return { success: true, inviteLink: linkData.properties.action_link }
}

export async function updateUserRole(
  id: string,
  role: AppUser['role']
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }
  if (currentUser.id === id) return { error: 'No puedes cambiar tu propio rol' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function updateUserProfile(
  id: string,
  data: { first_name: string; last_name: string; phone?: string | null }
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }
  if (currentUser.role !== 'ADMIN' && currentUser.id !== id) return { error: 'Sin permisos' }

  const parsed = updateProfileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name,
      phone: parsed.data.phone ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/users')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function disableUser(id: string): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }
  if (currentUser.id === id) return { error: 'No puedes desactivarte a ti mismo' }

  const admin = createAdminClient()

  const { error: dbError } = await admin
    .from('users')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbError) return { error: dbError.message }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: '876000h',
  })
  if (authError) return { error: authError.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function enableUser(id: string): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }

  const admin = createAdminClient()

  const { error: dbError } = await admin
    .from('users')
    .update({ enabled: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (dbError) return { error: dbError.message }

  const { error: authError } = await admin.auth.admin.updateUserById(id, {
    ban_duration: '0s',
  })
  if (authError) return { error: authError.message }

  revalidatePath('/dashboard/users')
  return { success: true }
}

export async function resetUserPassword(
  id: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }
  if (newPassword.length < 8) return { error: 'Mínimo 8 caracteres' }

  const admin = createAdminClient()

  const { data: target } = await admin.from('users').select('email').eq('id', id).single()
  if (target && newPassword === target.email) {
    return { error: 'La contraseña no puede ser el email del usuario' }
  }

  const { error } = await admin.auth.admin.updateUserById(id, { password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateOwnPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }
  if (newPassword.length < 8) return { error: 'Mínimo 8 caracteres' }
  if (currentPassword === newPassword) return { error: 'La nueva contraseña debe ser diferente' }

  const supabase = await createClient()

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: currentUser.email,
    password: currentPassword,
  })
  if (signInError) return { error: 'Contraseña actual incorrecta' }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateOwnProfile(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }

  const parsed = updateProfileSchema.safeParse({
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    phone: formData.get('phone') || null,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()

  let avatar_url: string | undefined
  const file = formData.get('avatar') as File | null
  if (file && file.size > 0) {
    const ext = file.name.split('.').pop()
    const path = `${currentUser.id}/avatar.${ext}`
    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(path, file, { upsert: true })
    if (uploadError) return { error: uploadError.message }
    const { data: urlData } = admin.storage.from('avatars').getPublicUrl(path)
    avatar_url = urlData.publicUrl
  }

  const { error } = await admin.from('users').update({
    first_name: parsed.data.first_name,
    last_name: parsed.data.last_name,
    phone: parsed.data.phone ?? null,
    updated_at: new Date().toISOString(),
    ...(avatar_url !== undefined && { avatar_url }),
  }).eq('id', currentUser.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}
