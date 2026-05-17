'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'Datos inválidos' }
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.signInWithPassword(parsed.data)

  if (error) return { error: 'Credenciales incorrectas' }
  const { data: profile } = await supabase
    .from('users')
    .select('role, theme')
    .eq('id', user!.id)
    .single()

  const theme = (profile as { theme?: string | null })?.theme
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
    PURCHASER:         '/dashboard/orders',
    WAREHOUSE_MANAGER: '/dashboard/inventory',
    PRODUCER:          '/dashboard/requisitions',
    USER:              '/dashboard/reports',
  }

  redirect(roleRedirects[profile?.role ?? 'USER'])
}

export async function logoutAction() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
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