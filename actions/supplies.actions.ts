'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from './auth.actions'
import { setAuditUser } from '@/lib/supabase/audit'
import { revalidatePath } from 'next/cache'
import {
  createCategorySchema,
  createItemSchema,
  registerMovementSchema,
} from '@/lib/validations/supplies.schema'
import {
  getSupplyStatus,
  type SupplyCategory,
  type SupplyItem,
  type SupplyMovement,
  type SupplyStatus,
  type SupplyItemWithStatus,
  type SupplyCategoryWithItems,
  type SupplyItemWithDetails,
} from '@/lib/supplies/types'

const ALLOWED_ROLES = ['ADMIN', 'WAREHOUSE_MANAGER']

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function suppliesFrom(client: any) { return client.from('supply_items') }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function categoriesFrom(client: any) { return client.from('supply_categories') }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function movementsFrom(client: any) { return client.from('supply_movements') }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingsFrom(client: any) { return client.from('app_settings') }

// --- Queries ---

export async function getSupplyCategories(): Promise<SupplyCategoryWithItems[]> {
  const supabase = await createClient()

  const [{ data: categories }, { data: items }] = await Promise.all([
    categoriesFrom(supabase).select('*').eq('enabled', true).order('name'),
    suppliesFrom(supabase)
      .select('*, provider:providers(id, name)')
      .eq('enabled', true)
      .order('name'),
  ])

  if (!categories) return []

  return (categories as SupplyCategory[]).map(cat => {
    const catItems: SupplyItemWithStatus[] = ((items as (SupplyItem & { provider: { id: number; name: string } | null })[]) ?? [])
      .filter(item => item.category_id === cat.id)
      .map(item => ({ ...item, status: getSupplyStatus(item), provider: item.provider ?? null }))

    const counts = catItems.reduce(
      (acc, item) => { acc[item.status]++; return acc },
      { ok: 0, warning: 0, critical: 0, empty: 0 }
    )

    return { ...cat, items: catItems, counts }
  })
}

export async function getSupplyItems(filters?: {
  category_id?: number
  status?: SupplyStatus
}): Promise<SupplyItemWithDetails[]> {
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = suppliesFrom(supabase)
    .select('*, category:supply_categories(id,name,description,color,enabled,created_at,updated_at), provider:providers(id,name)')
    .eq('enabled', true)
    .order('name')

  if (filters?.category_id) query = query.eq('category_id', filters.category_id)

  const { data } = await query
  if (!data) return []

  let items = (data as (SupplyItem & {
    category: SupplyCategory | null
    provider: { id: number; name: string } | null
  })[]).map(item => ({
    ...item,
    status: getSupplyStatus(item),
    last_movement: null as SupplyMovement | null,
  }))

  if (filters?.status) {
    items = items.filter(item => item.status === filters.status)
  }

  return items
}

export async function getSupplyItemById(id: number): Promise<(SupplyItemWithDetails & { movements: SupplyMovement[] }) | null> {
  const admin = createAdminClient()

  const [{ data: item }, { data: movements }] = await Promise.all([
    suppliesFrom(admin)
      .select('*, category:supply_categories(id,name,description,color,enabled,created_at,updated_at), provider:providers(id,name)')
      .eq('id', id)
      .single(),
    movementsFrom(admin)
      .select('*, performed_by_user:users!performed_by(first_name, last_name)')
      .eq('item_id', id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  if (!item) return null

  return {
    ...item,
    status:        getSupplyStatus(item),
    last_movement: movements?.[0] ?? null,
    movements:     (movements ?? []) as SupplyMovement[],
  }
}

// --- Mutations: Categories ---

export async function createSupplyCategory(
  data: { name: string; description?: string | null; color?: string | null }
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createCategorySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { error } = await categoriesFrom(supabase).insert({ ...parsed.data, enabled: true })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/supplies')
  return { success: true }
}

export async function updateSupplyCategory(
  id: number,
  data: { name?: string; description?: string | null; color?: string | null; enabled?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createCategorySchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { error } = await categoriesFrom(supabase)
    .update({ ...parsed.data, enabled: data.enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/supplies')
  return { success: true }
}

// --- Mutations: Items ---

export async function createSupplyItem(
  data: Parameters<typeof createItemSchema.parse>[0]
): Promise<{ success?: boolean; id?: number; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createItemSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const payload = {
    ...parsed.data,
    quantity_warning:  parsed.data.quantity_warning ?? null,
    quantity_current:  0,
    enabled:           true,
  }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { data: inserted, error } = await suppliesFrom(supabase)
    .insert(payload)
    .select('id')
    .single()
  if (error) return { error: error.message }

  revalidatePath('/dashboard/supplies')
  return { success: true, id: inserted?.id }
}

export async function updateSupplyItem(
  id: number,
  data: Partial<Parameters<typeof createItemSchema.parse>[0]> & { enabled?: boolean }
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = createItemSchema.partial().safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  await setAuditUser(supabase, user.id)
  const { error } = await suppliesFrom(supabase)
    .update({ ...parsed.data, enabled: data.enabled, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/supplies')
  return { success: true }
}

export async function uploadSupplyItemImage(
  formData: FormData,
  itemId: number
): Promise<{ url?: string; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const file = formData.get('file') as File
  if (!file || file.size === 0) return { error: 'Archivo no válido' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Máximo 2 MB' }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) return { error: 'Solo JPG, PNG o WEBP' }

  const ext = file.name.split('.').pop()
  const path = `${itemId}/image.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from('supply-items')
    .upload(path, file, { upsert: true })
  if (error) return { error: error.message }

  const { data } = admin.storage.from('supply-items').getPublicUrl(path)

  // Update image_url on the item
  await suppliesFrom(admin)
    .update({ image_url: data.publicUrl, updated_at: new Date().toISOString() })
    .eq('id', itemId)

  revalidatePath('/dashboard/supplies')
  return { url: data.publicUrl }
}

// --- Mutations: Movements ---

export async function registerMovement(
  data: Parameters<typeof registerMovementSchema.parse>[0]
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || !ALLOWED_ROLES.includes(user.role)) return { error: 'Sin permisos' }

  const parsed = registerMovementSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()

  // Fetch current quantity
  const { data: item } = await suppliesFrom(supabase)
    .select('quantity_current, quantity_minimum')
    .eq('id', parsed.data.item_id)
    .single()

  if (!item) return { error: 'Item no encontrado' }

  const quantityBefore = item.quantity_current as number
  let quantityAfter: number

  if (parsed.data.movement_type === 'IN') {
    quantityAfter = quantityBefore + parsed.data.quantity
  } else if (parsed.data.movement_type === 'OUT') {
    if (parsed.data.quantity > quantityBefore) {
      return { error: `Stock insuficiente. Stock actual: ${quantityBefore}` }
    }
    quantityAfter = quantityBefore - parsed.data.quantity
  } else {
    // ADJUSTMENT — quantity is the new absolute value
    quantityAfter = parsed.data.quantity
  }

  await setAuditUser(supabase, user.id)
  const { error } = await movementsFrom(supabase).insert({
    item_id:         parsed.data.item_id,
    movement_type:   parsed.data.movement_type,
    quantity:        parsed.data.quantity,
    quantity_before: quantityBefore,
    quantity_after:  quantityAfter,
    notes:           parsed.data.notes ?? null,
    performed_by:    user.id,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/supplies')

  // Fire alert check if below minimum after movement
  if (quantityAfter < (item.quantity_minimum as number)) {
    await sendAlertIfNeeded(parsed.data.item_id)
  }

  return { success: true }
}

// --- Internal: Alert ---

async function sendAlertIfNeeded(itemId: number): Promise<void> {
  try {
    const admin = createAdminClient()

    const [{ data: itemData }, { data: settingsData }] = await Promise.all([
      admin
        .from('supply_items')
        .select('*, category:supply_categories(name), provider:providers(name)')
        .eq('id', itemId)
        .single(),
      settingsFrom(admin).select('key, value').in('key', [
        'supplies.alert_roles',
        'supplies.alert_cooldown_hours',
      ]),
    ])

    if (!itemData) return

    const settingsMap = Object.fromEntries(
      ((settingsData ?? []) as { key: string; value: unknown }[]).map(r => [r.key, r.value])
    )
    const alertRoles    = (settingsMap['supplies.alert_roles']          as string[]) ?? ['ADMIN', 'WAREHOUSE_MANAGER']
    const cooldownHours = (settingsMap['supplies.alert_cooldown_hours'] as number)   ?? 24

    if (!alertRoles.length) return

    const { data: usersData } = await admin
      .from('users')
      .select('email')
      .in('role', alertRoles)
      .eq('enabled', true)

    const alertEmails = (usersData ?? []).map((u: { email: string }) => u.email).filter(Boolean)
    if (!alertEmails.length) return

    // Check cooldown
    if (itemData.last_alert_sent_at) {
      const lastSent = new Date(itemData.last_alert_sent_at).getTime()
      const diffHours = (Date.now() - lastSent) / (1000 * 60 * 60)
      if (diffHours < cooldownHours) return
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const edgeFnUrl   = `${supabaseUrl}/functions/v1/send-supply-alert`

    await fetch(edgeFnUrl, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        item_id:          itemData.id,
        item_name:        itemData.name,
        category_name:    itemData.category?.name ?? '',
        quantity_current: itemData.quantity_current,
        quantity_minimum: itemData.quantity_minimum,
        unit:             itemData.unit,
        alert_emails:     alertEmails,
        provider_name:    itemData.provider?.name ?? undefined,
      }),
    })

    // Update last_alert_sent_at
    await admin
      .from('supply_items')
      .update({ last_alert_sent_at: new Date().toISOString() })
      .eq('id', itemId)
  } catch {
    // Alert failure must not break the movement registration
  }
}

// --- Alerts widget query (public) ---

export async function getSupplyAlerts(): Promise<{
  critical: SupplyItemWithStatus[]
  warning: SupplyItemWithStatus[]
  total: number
}> {
  const supabase = await createClient()

  const { data } = await suppliesFrom(supabase)
    .select('*, provider:providers(id, name)')
    .eq('enabled', true)
    .order('quantity_current', { ascending: true })

  if (!data) return { critical: [], warning: [], total: 0 }

  const items = (data as (SupplyItem & { provider: { id: number; name: string } | null })[]).map(item => ({
    ...item,
    status:   getSupplyStatus(item),
    provider: item.provider ?? null,
  }))

  const critical = items.filter(i => i.status === 'critical' || i.status === 'empty')
  const warning  = items.filter(i => i.status === 'warning')

  return { critical, warning, total: critical.length + warning.length }
}
