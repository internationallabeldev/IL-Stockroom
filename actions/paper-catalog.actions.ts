'use server'

import { createAdminClient }   from '@/lib/supabase/admin'
import { getSessionUser }       from './auth.actions'
import { revalidatePath }       from 'next/cache'
import { paperCatalogSchema }   from '@/lib/validations/paper-catalog.schema'
import { setAuditUser }         from '@/lib/supabase/audit'
import type { Database }        from '@/types/database.types'

export type PaperCatalogItem = Database['public']['Tables']['paper_catalog']['Row']
type PaperInsert = Database['public']['Tables']['paper_catalog']['Insert']
type PaperUpdate = Database['public']['Tables']['paper_catalog']['Update']

const ALLOWED_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER']
const PATH = '/dashboard/catalog/papers'

export async function getPaperCatalog(): Promise<PaperCatalogItem[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('paper_catalog')
    .select('*')
    .order('name')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function createPaperCatalogItem(
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = paperCatalogSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase.from('paper_catalog').insert(parsed.data as PaperInsert)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

export async function updatePaperCatalogItem(
  id: number,
  values: unknown
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = paperCatalogSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = createAdminClient()
  await setAuditUser(supabase, user.id)
  const update: PaperUpdate = { ...parsed.data, updated_at: new Date().toISOString() }
  const { error } = await supabase.from('paper_catalog').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}

export async function togglePaperCatalogStatus(
  id: number
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const supabase = createAdminClient()
  const { data } = await supabase.from('paper_catalog').select('enabled').eq('id', id).single()
  await setAuditUser(supabase, user.id)
  const { error } = await supabase
    .from('paper_catalog')
    .update({ enabled: !data?.enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath(PATH)
  return { success: true }
}
