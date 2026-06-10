'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/actions/auth.actions'
import { LAYOUT_BREAKPOINTS } from '@/types/dashboard-layout.types'
import type {
  DashboardKey,
  DashboardLayouts,
  DashboardState,
  WidgetInstance,
  WidgetRect,
} from '@/types/dashboard-layout.types'
import type { Json } from '@/types/database.types'

const DASHBOARD_KEYS: DashboardKey[] = ['admin', 'purchaser', 'warehouse', 'producer', 'user']

const MAX_WIDGETS = 50

// The payload comes from the client, so re-validate shape and clamp values
// before persisting — only {i,x,y,w,h} survives, anything else is dropped.
function sanitizeLayouts(input: DashboardLayouts): DashboardLayouts | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null

  const out: DashboardLayouts = {}
  for (const bp of LAYOUT_BREAKPOINTS) {
    const items = input[bp]
    if (items === undefined) continue
    if (!Array.isArray(items) || items.length > MAX_WIDGETS) return null

    const clean: WidgetRect[] = []
    for (const item of items) {
      if (!item || typeof item !== 'object') return null
      const { i, x, y, w, h } = item as WidgetRect
      if (typeof i !== 'string' || i.length === 0 || i.length > 64) return null
      if (![x, y, w, h].every(n => typeof n === 'number' && Number.isFinite(n))) return null
      clean.push({
        i,
        x: Math.max(0, Math.round(x)),
        y: Math.max(0, Math.round(y)),
        w: Math.min(12, Math.max(1, Math.round(w))),
        h: Math.min(60, Math.max(1, Math.round(h))),
      })
    }
    out[bp] = clean
  }
  return out
}

// Widget instances are user-controlled too: keep only {id, type, params} with
// string-only param values, and cap the count. Unknown types are tolerated here
// (the client skips rendering them) — we only guard shape, size, and injection.
function sanitizeWidgets(input: WidgetInstance[]): WidgetInstance[] | null {
  if (!Array.isArray(input) || input.length > MAX_WIDGETS) return null

  const clean: WidgetInstance[] = []
  for (const item of input) {
    if (!item || typeof item !== 'object') return null
    const { id, type, params } = item as WidgetInstance
    if (typeof id !== 'string' || id.length === 0 || id.length > 64) return null
    if (typeof type !== 'string' || type.length === 0 || type.length > 64) return null

    let cleanParams: Record<string, string> | undefined
    if (params !== undefined) {
      if (typeof params !== 'object' || Array.isArray(params)) return null
      cleanParams = {}
      for (const [k, v] of Object.entries(params)) {
        if (typeof k !== 'string' || k.length > 64) return null
        if (typeof v !== 'string' || v.length > 64) return null
        cleanParams[k] = v
      }
    }
    clean.push({ id, type, ...(cleanParams ? { params: cleanParams } : {}) })
  }
  return clean
}

export async function getDashboardLayout(dashboardKey: DashboardKey): Promise<DashboardState | null> {
  const user = await getSessionUser()
  if (!user || !DASHBOARD_KEYS.includes(dashboardKey)) return null

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('dashboard_layouts')
    .select('layouts, widgets')
    .eq('user_id', user.id)
    .eq('dashboard_key', dashboardKey)
    .maybeSingle()

  // Table/column may not exist yet (migration pending) — fall back to defaults
  if (error || !data) return null
  return {
    widgets: (data.widgets ?? []) as WidgetInstance[],
    layouts: (data.layouts ?? {}) as DashboardLayouts,
  }
}

export async function saveDashboardLayout(
  dashboardKey: DashboardKey,
  state: DashboardState,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Sin sesión' }
  if (!DASHBOARD_KEYS.includes(dashboardKey)) return { error: 'Dashboard inválido' }

  const layouts = sanitizeLayouts(state?.layouts ?? {})
  const widgets = sanitizeWidgets(state?.widgets ?? [])
  if (!layouts || !widgets) return { error: 'Diseño inválido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('dashboard_layouts')
    .upsert(
      {
        user_id:       user.id,
        dashboard_key: dashboardKey,
        layouts:       layouts as Json,
        widgets:       widgets as unknown as Json,
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'user_id,dashboard_key' },
    )

  if (error) return { error: error.message }
  return { success: true }
}

export async function resetDashboardLayout(
  dashboardKey: DashboardKey,
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user) return { error: 'Sin sesión' }
  if (!DASHBOARD_KEYS.includes(dashboardKey)) return { error: 'Dashboard inválido' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('dashboard_layouts')
    .delete()
    .eq('user_id', user.id)
    .eq('dashboard_key', dashboardKey)

  if (error) return { error: error.message }
  return { success: true }
}
