'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
    .select('role')
    .eq('id', user!.id)
    .single()

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

  return profile
}