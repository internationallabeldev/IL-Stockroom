'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { checkLoginRateLimit, checkPasswordResetRateLimit, getClientIp, resetLoginRateLimit } from '@/lib/rate-limit'
import { sendEmail } from '@/lib/email/send'
import { renderNotificationEmail } from '@/lib/email/template'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  redirect: z.string().optional(),
})

const GENERIC_LOGIN_ERROR = 'Correo o contraseña incorrectos'

// Solo permite rutas relativas propias del sitio — evita usar este parámetro
// como open redirect hacia un dominio externo.
function isSafeRedirectPath(path: string | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.includes('://')
}

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    redirect: formData.get('redirect') || undefined,
  })

  if (!parsed.success) {
    return { error: GENERIC_LOGIN_ERROR }
  }

  const ip = await getClientIp()
  const { success: withinRate } = await checkLoginRateLimit(ip)
  if (!withinRate) {
    return { error: 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.' }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error || !user) return { error: GENERIC_LOGIN_ERROR }

  const { data: profile } = await supabase
    .from('users')
    .select('role, theme, enabled')
    .eq('id', user.id)
    .single()

  if (!profile?.enabled) {
    await supabase.auth.signOut()
    return { error: 'Tu cuenta ha sido desactivada. Contacta al administrador.' }
  }

  await resetLoginRateLimit(ip)

  const theme = profile.theme
  if (theme === 'light' || theme === 'dark') {
    const cookieStore = await cookies()
    cookieStore.set('preferred-theme', theme, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      path: '/',
    })
  }

  const roleRedirects: Record<string, string> = {
    ADMIN:             '/dashboard',
    PURCHASER:         '/dashboard/orders/ink',
    WAREHOUSE_MANAGER: '/dashboard/inventory',
    PRODUCER:          '/dashboard/requisitions',
    USER:              '/dashboard/reports',
  }

  const target = isSafeRedirectPath(parsed.data.redirect)
    ? parsed.data.redirect
    : roleRedirects[profile.role ?? 'USER']

  redirect(target)
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const cookieStore = await cookies()
  cookieStore.delete('preferred-theme')
  redirect('/login')
}

const resetRequestSchema = z.object({ email: z.string().email() })

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = resetRequestSchema.safeParse({ email: formData.get('email') })
  if (!parsed.success) return { error: 'Ingresa un correo válido' }

  const { success: withinRate } = await checkPasswordResetRateLimit(parsed.data.email)
  if (!withinRate) {
    return { error: 'Demasiadas solicitudes. Espera una hora e inténtalo de nuevo.' }
  }

  const admin = createAdminClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? 'http://localhost:3000'
  const redirectTo = `${siteUrl}/auth/confirm?next=${encodeURIComponent('/auth/set-password')}`

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: parsed.data.email,
    options: { redirectTo },
  })

  // Mismo mensaje exista o no la cuenta — no revela qué correos están registrados.
  if (!error && linkData) {
    const html = renderNotificationEmail({
      badge: 'Recuperar acceso',
      title: 'Restablece tu contraseña',
      subtitle: 'IL Stockroom',
      intro:
        'Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, ignora este correo. ' +
        'El enlace expira en 1 hora.',
      ctaLabel: 'Crear nueva contraseña',
      ctaUrl: linkData.properties.action_link,
    })
    await sendEmail({
      to: parsed.data.email,
      subject: 'Restablece tu contraseña — IL Stockroom',
      html,
    })
  }

  return { success: true }
}

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) return profile

  // El trigger no creó el perfil — lo creamos desde los metadatos del usuario
  const meta = user.user_metadata ?? {}
  const admin = createAdminClient()
  type UserRole = 'ADMIN' | 'PURCHASER' | 'WAREHOUSE_MANAGER' | 'PRODUCER' | 'USER'
  const { data: newProfile } = await admin
    .from('users')
    .upsert({
      id: user.id,
      email: user.email!,
      first_name: (meta.first_name as string) ?? '',
      last_name: (meta.last_name as string) ?? '',
      role: ((meta.role as string) ?? 'USER') as UserRole,
      enabled: true,
    } as never)
    .select()
    .single()

  return newProfile ?? null
}