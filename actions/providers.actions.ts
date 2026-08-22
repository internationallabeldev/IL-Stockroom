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

/**
 * Los campos opcionales llegan como '' desde el FormData; el schema los
 * normaliza a null, así que aquí solo se desempaqueta el FormData tal cual.
 * Compartido por create y update para que no se desincronicen.
 */
function toRawProvider(formData: FormData) {
  const get = (k: string) => formData.get(k) ?? null
  return {
    name:                    get('name'),
    email:                   get('email'),
    phone:                   get('phone'),
    whatsapp:                get('whatsapp'),
    address:                 get('address'),
    contact_person:          get('contact_person'),
    provider_type:           get('provider_type'),
    logo_url:                get('logo_url'),
    latitude:                formData.get('latitude')  ? Number(formData.get('latitude'))  : null,
    longitude:               formData.get('longitude') ? Number(formData.get('longitude')) : null,
    supply_types: (() => { try { return JSON.parse(formData.get('supply_types') as string) } catch { return null } })(),
    // Fiscal
    rfc:                     get('rfc'),
    legal_name:              get('legal_name'),
    tax_regime:              get('tax_regime'),
    postal_code:             get('postal_code'),
    city:                    get('city'),
    state:                   get('state'),
    country:                 get('country'),
    // Comercial y pagos
    payment_terms_days:      get('payment_terms_days'),
    currency:                get('currency'),
    credit_limit:            get('credit_limit'),
    bank:                    get('bank'),
    clabe:                   get('clabe'),
    account_number:          get('account_number'),
    customer_number:         get('customer_number'),
    // Operativo y cumplimiento
    billing_email:           get('billing_email'),
    website:                 get('website'),
    notes:                   get('notes'),
    csf_url:                 get('csf_url'),
    compliance_opinion_date: get('compliance_opinion_date'),
  }
}

export async function getProviders(filters?: {
  type?: string
  enabled?: boolean
}): Promise<Provider[]> {
  // TEMPORAL - solo para probar el skeleton temático (piloto proveedores), quitar después
  //await new Promise(resolve => setTimeout(resolve, 1500))
  const supabase = await createClient()
  // deleted_at es la baja definitiva (aún sin UI que la escriba); `enabled`
  // sigue siendo la baja temporal y sí se muestra en la lista.
  let query = supabase.from('providers').select('*').is('deleted_at', null).order('name')

  if (filters?.type) query = query.eq('provider_type', filters.type as Provider['provider_type'])
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

  const parsed = providerSchema.safeParse(toRawProvider(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supply_types, ...rest } = parsed.data
  const payload: ProviderInsert = {
    ...rest,
    supply_types: parsed.data.provider_type === 'BOTH' ? (supply_types ?? null) : null,
  }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase.from('providers').insert(payload)
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

  const parsed = providerSchema.safeParse(toRawProvider(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { supply_types, ...rest } = parsed.data
  const update: ProviderUpdate = {
    ...rest,
    supply_types: parsed.data.provider_type === 'BOTH' ? (supply_types ?? null) : null,
    updated_at: new Date().toISOString(),
  }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
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
