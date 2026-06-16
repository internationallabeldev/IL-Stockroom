'use server'

import { createClient }    from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }   from './auth.actions'
import { revalidatePath }   from 'next/cache'
import { cookies }          from 'next/headers'
import { setAuditUser }     from '@/lib/supabase/audit'
import { sendEmail }        from '@/lib/email/send'
import { renderNotificationEmail } from '@/lib/email/template'
import {
  inviteUserSchema,
  updateProfileSchema,
  updateOwnProfileSchema,
  notificationPreferencesSchema,
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
}): Promise<{ success?: boolean; emailSent?: boolean; inviteLink?: string; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }

  const parsed = inviteUserSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/confirm`

  // Crea el usuario y obtiene el link de activación. No depende del servicio de
  // correo de Supabase: el email lo enviamos nosotros con el mailer de la app.
  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'invite',
    email: parsed.data.email,
    options: {
      redirectTo,
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

  const inviteLink = linkData.properties.action_link

  // Enviamos el correo de invitación con el mailer propio (nunca lanza).
  const html = renderNotificationEmail({
    badge: 'Invitación',
    title: 'Te invitaron a IL Stockroom',
    subtitle: `${currentUser.first_name} ${currentUser.last_name} te invitó a unirte`,
    intro:
      `Hola ${parsed.data.first_name}, has sido invitado a IL Stockroom. ` +
      'Haz clic en el botón para activar tu cuenta y crear tu contraseña. El enlace expira en 24 horas.',
    ctaLabel: 'Activar mi cuenta',
    ctaUrl: inviteLink,
  })

  const mail = await sendEmail({
    to: parsed.data.email,
    subject: 'Te invitaron a IL Stockroom',
    html,
  })

  revalidatePath('/dashboard/users')
  return { success: true, emailSent: mail.sent, inviteLink }
}

export async function updateUserRole(
  id: string,
  role: AppUser['role']
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser || currentUser.role !== 'ADMIN') return { error: 'Sin permisos' }
  if (currentUser.id === id) return { error: 'No puedes cambiar tu propio rol' }

  const admin = createAdminClient()
  await setAuditUser(admin, currentUser.id)
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
  await setAuditUser(admin, currentUser.id)
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
  await setAuditUser(admin, currentUser.id)

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
  await setAuditUser(admin, currentUser.id)

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

export async function updateOwnProfile(data: {
  nickname?:  string | null
  phone?:     string | null
  job_title?: string | null
}): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }

  const parsed = updateOwnProfileSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  await setAuditUser(admin, currentUser.id)

  const { error } = await admin.from('users').update({
    nickname:  parsed.data.nickname  ?? null,
    phone:     parsed.data.phone     ?? null,
    job_title: parsed.data.job_title ?? null,
    updated_at: new Date().toISOString(),
  } as never).eq('id', currentUser.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ success?: boolean; url?: string; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }

  const file = formData.get('avatar') as File | null
  if (!file || file.size === 0) return { error: 'No se recibió archivo' }
  if (file.size > 2_097_152) return { error: 'Máximo 2 MB' }

  const admin = createAdminClient()
  const ext  = file.name.split('.').pop() ?? 'jpg'
  const path = `${currentUser.id}/avatar.${ext}`

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (uploadError) return { error: uploadError.message }

  const { data: urlData } = admin.storage.from('avatars').getPublicUrl(path)
  const avatar_url = `${urlData.publicUrl}?t=${Date.now()}`

  await setAuditUser(admin, currentUser.id)
  const { error } = await admin.from('users')
    .update({ avatar_url, updated_at: new Date().toISOString() })
    .eq('id', currentUser.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true, url: avatar_url }
}

export async function updateNotificationPreferences(
  prefs: Record<string, boolean>
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }

  const parsed = notificationPreferencesSchema.safeParse(prefs)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const admin = createAdminClient()
  await setAuditUser(admin, currentUser.id)
  const { error } = await admin.from('users').update({
    notifications: parsed.data,
    updated_at: new Date().toISOString(),
  } as never).eq('id', currentUser.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateUserTheme(
  theme: 'light' | 'dark'
): Promise<{ success?: boolean; error?: string }> {
  const currentUser = await getSessionUser()
  if (!currentUser) return { error: 'Sin permisos' }

  const cookieStore = await cookies()
  cookieStore.set('preferred-theme', theme, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  })

  const admin = createAdminClient()
  const { error } = await admin.from('users').update({
    theme,
    updated_at: new Date().toISOString(),
  } as never).eq('id', currentUser.id)
  if (error) return { error: error.message }

  return { success: true }
}
