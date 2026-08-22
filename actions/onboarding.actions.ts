'use server'

import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/actions/auth.actions'
import { getDashboardKPIs } from '@/actions/dashboard.actions'
import { getSystemStats } from '@/actions/system-status.actions'
import { getPublicSettings } from '@/actions/app-settings.actions'
import { setAuditUser } from '@/lib/supabase/audit'
import type { UserRole } from '@/lib/welcome/content'

export type WelcomeAccent = 'red' | 'amber' | 'green' | 'neutral'
export type WelcomeStat = { label: string; value: number; unit?: string; accent: WelcomeAccent }

export type WelcomeData = {
  profile: {
    id:         string
    first_name: string
    last_name:  string
    nickname:   string | null
    job_title:  string | null
    role:       UserRole
    avatar_url: string | null
  }
  welcomeMessage: string
  stats:          WelcomeStat[]
  needsPassword:  boolean
  tourTarget:     string | null
}

// Home each role lands on after completing onboarding.
const ROLE_HOME: Record<UserRole, string> = {
  ADMIN:             '/dashboard',
  PURCHASER:         '/dashboard/orders/ink',
  WAREHOUSE_MANAGER: '/dashboard/inventory/inks',
  PRODUCER:          '/dashboard/requisitions',
  USER:              '/dashboard',
}

// Page whose driver.js tour we auto-start for "Iniciar tour" (must be a route
// with a registered tour in lib/tours). USER has no tour.
const ROLE_TOUR: Record<UserRole, string | null> = {
  ADMIN:             '/dashboard/providers',
  PURCHASER:         '/dashboard/orders/ink',
  WAREHOUSE_MANAGER: '/dashboard/inventory/inks',
  PRODUCER:          '/dashboard/requisitions/inks',
  USER:              null,
}

type StatInputs = {
  k:         Awaited<ReturnType<typeof getDashboardKPIs>>
  sys:       Awaited<ReturnType<typeof getSystemStats>>
  providers: number
}

function buildStats(role: UserRole, { k, sys, providers }: StatInputs): WelcomeStat[] {
  const lowStock     = k.lowStockCount       ?? 0
  const pendingReqs  = k.pendingReqsCount    ?? 0
  const pendingQual  = k.pendingQualityCount ?? 0
  const activeOrders = k.activeOrdersCount   ?? 0
  const myReqs       = k.myActiveReqs        ?? 0
  const stockAccent: WelcomeAccent = lowStock > 0 ? 'amber' : 'neutral'

  switch (role) {
    case 'WAREHOUSE_MANAGER':
      return [
        { label: 'Requisiciones pendientes', value: pendingReqs, accent: pendingReqs > 0 ? 'red' : 'neutral' },
        { label: 'Materiales bajo mínimo',   value: lowStock,    accent: stockAccent },
        { label: 'Recepciones por aprobar',  value: pendingQual, accent: pendingQual > 0 ? 'amber' : 'neutral' },
      ]
    case 'PURCHASER':
      return [
        { label: 'Órdenes activas',          value: activeOrders, accent: 'neutral' },
        { label: 'Materiales bajo mínimo',   value: lowStock,     accent: stockAccent },
        { label: 'Proveedores registrados',  value: providers,    accent: 'neutral' },
      ]
    case 'PRODUCER':
      return [
        { label: 'Mis requisiciones activas', value: myReqs,         accent: 'neutral' },
        { label: 'Tintas disponibles',        value: sys.inkLots,    accent: 'neutral' },
        { label: 'Bobinas disponibles',       value: sys.paperLots,  accent: 'neutral' },
      ]
    case 'ADMIN':
      return [
        { label: 'Usuarios en el sistema',   value: sys.users,   accent: 'neutral' },
        { label: 'Materiales bajo mínimo',   value: lowStock,    accent: stockAccent },
        { label: 'Requisiciones pendientes', value: pendingReqs, accent: pendingReqs > 0 ? 'amber' : 'neutral' },
      ]
    case 'USER':
    default:
      return [
        { label: 'Tintas en inventario',   value: sys.inkLots,   accent: 'neutral' },
        { label: 'Bobinas en inventario',  value: sys.paperLots, accent: 'neutral' },
        { label: 'Materiales bajo mínimo', value: lowStock,      accent: stockAccent },
      ]
  }
}

export async function getWelcomeData(): Promise<WelcomeData | null> {
  const user = await getSessionUser()
  if (!user) return null

  const role = user.role as UserRole
  const admin = createAdminClient()

  const [kpis, sys, settings, providersRes] = await Promise.all([
    getDashboardKPIs(),
    getSystemStats(),
    getPublicSettings(),
    admin.from('providers').select('id', { count: 'exact', head: true }),
  ])

  return {
    profile: {
      id:         user.id,
      first_name: user.first_name,
      last_name:  user.last_name,
      nickname:   user.nickname ?? null,
      job_title:  user.job_title ?? null,
      role,
      avatar_url: user.avatar_url,
    },
    welcomeMessage: settings.onboarding.welcome_message,
    stats:          buildStats(role, { k: kpis, sys, providers: providersRes.count ?? 0 }),
    needsPassword:  user.onboarding_completed !== true,
    tourTarget:     ROLE_TOUR[role],
  }
}

export async function markOnboardingComplete(opts?: { tour?: boolean }): Promise<never> {
  const user = await getSessionUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  await setAuditUser(admin, user.id)
  await admin
    .from('users')
    .update({
      onboarding_completed: true,
      onboarded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', user.id)

  const role = user.role as UserRole

  if (opts?.tour) {
    const target = ROLE_TOUR[role]
    if (target) redirect(`${target}?tour=1`)
  }

  redirect(ROLE_HOME[role])
}
