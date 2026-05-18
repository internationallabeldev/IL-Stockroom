'use server'

import { createClient } from '@/lib/supabase/server'
import { getSessionUser } from './auth.actions'
import { revalidatePath } from 'next/cache'
import { providerSchema } from '@/lib/validations/provider.schema'
import { setAuditUser }   from '@/lib/supabase/audit'
import type { Database }  from '@/types/database.types'

export type Provider = Database['public']['Tables']['providers']['Row']
type ProviderInsert = Database['public']['Tables']['providers']['Insert']
type ProviderUpdate = Database['public']['Tables']['providers']['Update']

const ALLOWED_ROLES = ['ADMIN', 'PURCHASER']

export async function getProviders(filters?: {
  type?: string
  enabled?: boolean
}): Promise<Provider[]> {
  const supabase = await createClient()
  let query = supabase.from('providers').select('*').order('name')

  if (filters?.type) query = query.eq('provider_type', filters.type as ProviderInsert['provider_type'])
  if (filters?.enabled !== undefined) query = query.eq('enabled', filters.enabled)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getProviderById(id: number): Promise<Provider | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('providers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function createProvider(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp') || null,
    address: formData.get('address'),
    contact_person: formData.get('contact_person') || null,
    provider_type: formData.get('provider_type'),
    logo_url: formData.get('logo_url') || null,
    latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
    longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
  }

  const parsed = providerSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase.from('providers').insert(parsed.data as ProviderInsert)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/providers')
  return { success: true }
}

export async function updateProvider(
  id: number,
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    whatsapp: formData.get('whatsapp') || null,
    address: formData.get('address'),
    contact_person: formData.get('contact_person') || null,
    provider_type: formData.get('provider_type'),
    logo_url: formData.get('logo_url') || null,
    latitude: formData.get('latitude') ? Number(formData.get('latitude')) : null,
    longitude: formData.get('longitude') ? Number(formData.get('longitude')) : null,
  }

  const parsed = providerSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const update: ProviderUpdate = { ...parsed.data, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('providers').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/providers')
  return { success: true }
}

export async function toggleProviderStatus(
  id: number
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = await createClient()
  const { data: provider } = await supabase
    .from('providers')
    .select('enabled')
    .eq('id', id)
    .single()

  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('providers')
    .update({ enabled: !provider?.enabled, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/providers')
  return { success: true }
}

export async function uploadProviderLogo(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Archivo no válido' }

  const ext = file.name.split('.').pop()
  const path = `providers/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const supabase = await createClient()
  const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true })
  if (error) return { error: error.message }

  const { data } = supabase.storage.from('logos').getPublicUrl(path)
  return { url: data.publicUrl }
}
