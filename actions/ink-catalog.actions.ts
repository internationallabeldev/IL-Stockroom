'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser }    from './auth.actions'
import { revalidatePath }    from 'next/cache'
import { inkCatalogSchema }  from '@/lib/validations/ink-catalog.schema'
import { setAuditUser }      from '@/lib/supabase/audit'
import type { Database }     from '@/types/database.types'

export type InkCatalogItem = Database['public']['Tables']['ink_catalog']['Row']
type InkInsert = Database['public']['Tables']['ink_catalog']['Insert']
type InkUpdate = Database['public']['Tables']['ink_catalog']['Update']

const ALLOWED_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATH = '/dashboard/catalog/inks'

export async function getInkCatalog(): Promise<InkCatalogItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('ink_catalog')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createInkCatalogItem(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = inkCatalogSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase.from('ink_catalog').insert(parsed.data as InkInsert)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

export async function updateInkCatalogItem(
  id: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = inkCatalogSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const update: InkUpdate = { ...parsed.data, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('ink_catalog').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

export async function toggleInkCatalogStatus(
  id: number
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { data } = await supabase.from('ink_catalog').select('enabled').eq('id', id).single()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('ink_catalog')
    .update({ enabled: !data?.enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}
