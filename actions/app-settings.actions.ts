'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getSessionUser } from '@/actions/auth.actions'
import { revalidatePath } from 'next/cache'
import type { AppSettings } from '@/types/app-settings.types'

type RawRow = { key: string; value: unknown }

// app_settings is not in the generated types yet (migration pending).
// Remove the cast once `pnpm supabase gen types` is re-run after the migration.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function settingsFrom(admin: any) {
  return admin.from('app_settings')
}

const DEFAULTS: AppSettings = {
  company: {
    name:              'International Label S.A. de C.V.',
    logo_url:          null,
    address:           'Galeana No. 45 Col. Acapantzingo, C.P. 62440 Cuernavaca, Mor.',
    phone:             '(777)312-6897',
    rfc:               '',
    fiscal_address:    '',
    warehouse_address: 'Galeana No. 45 Col. Acapantzingo Cuernavaca, Mor.',
  },
  pdf: {
    footer_legal:    'FAVOR DE FACTURAR A: INTERNATIONAL LABEL S.A. DE C.V.',
    reception_notes: 'RECEPCIÓN DE MATERIALES LUNES A VIERNES DE 08:30 A 16:30 HRS. NO SE RECIBIRÁN MATERIALES SI ESTOS NO VIENEN ACOMPAÑADOS DE FACTURA QUE INDIQUE N° DE ORDEN DE COMPRA, TIPO DE CAMBIO (SOLO PARA FACTURAS EN PESOS), ASÍ COMO CERTIFICADOS DE CALIDAD.',
    revision:        'Rev: 3',
  },
  alerts: {
    quality_pending_days:  2,
    order_overdue_days:    3,
    low_stock_percentage:  20,
  },
  orders: {
    number_sequence_start:  1000,
    default_payment_method: 'Transferencia',
    default_delivery_place: 'Directo en Planta',
  },
  requisitions: {
    max_response_hours:    24,
    rejection_placeholder: 'Por favor especifica el motivo del rechazo...',
  },
  supplies: {
    alert_roles:          ['ADMIN', 'WAREHOUSE_MANAGER'],
    alert_cooldown_hours: 24,
  },
}

function parseSettings(rows: RawRow[]): AppSettings {
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]))

  return {
    company: {
      name:              (map['company.name']              as string)        ?? DEFAULTS.company.name,
      logo_url:          (map['company.logo_url']          as string | null) ?? null,
      address:           (map['company.address']           as string)        ?? DEFAULTS.company.address,
      phone:             (map['company.phone']             as string)        ?? DEFAULTS.company.phone,
      rfc:               (map['company.rfc']               as string)        ?? '',
      fiscal_address:    (map['company.fiscal_address']    as string)        ?? '',
      warehouse_address: (map['company.warehouse_address'] as string)        ?? DEFAULTS.company.warehouse_address,
    },
    pdf: {
      footer_legal:    (map['pdf.footer_legal']    as string) ?? DEFAULTS.pdf.footer_legal,
      reception_notes: (map['pdf.reception_notes'] as string) ?? DEFAULTS.pdf.reception_notes,
      revision:        (map['pdf.revision']        as string) ?? DEFAULTS.pdf.revision,
    },
    alerts: {
      quality_pending_days:  (map['alerts.quality_pending_days']  as number) ?? DEFAULTS.alerts.quality_pending_days,
      order_overdue_days:    (map['alerts.order_overdue_days']    as number) ?? DEFAULTS.alerts.order_overdue_days,
      low_stock_percentage:  (map['alerts.low_stock_percentage']  as number) ?? DEFAULTS.alerts.low_stock_percentage,
    },
    orders: {
      number_sequence_start:  (map['orders.number_sequence_start']  as number) ?? DEFAULTS.orders.number_sequence_start,
      default_payment_method: (map['orders.default_payment_method'] as string) ?? DEFAULTS.orders.default_payment_method,
      default_delivery_place: (map['orders.default_delivery_place'] as string) ?? DEFAULTS.orders.default_delivery_place,
    },
    requisitions: {
      max_response_hours:    (map['requisitions.max_response_hours']    as number) ?? DEFAULTS.requisitions.max_response_hours,
      rejection_placeholder: (map['requisitions.rejection_placeholder'] as string) ?? DEFAULTS.requisitions.rejection_placeholder,
    },
    supplies: {
      alert_roles:          (map['supplies.alert_roles']          as string[]) ?? DEFAULTS.supplies.alert_roles,
      alert_cooldown_hours: (map['supplies.alert_cooldown_hours'] as number)   ?? DEFAULTS.supplies.alert_cooldown_hours,
    },
  }
}

export async function getAppSettings(): Promise<AppSettings | null> {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return null

  const admin = createAdminClient()
  const { data, error } = await settingsFrom(admin).select('key, value')
  // Table may not exist yet (migration pending) — return defaults instead of crashing
  if (error) return DEFAULTS
  return parseSettings((data ?? []) as RawRow[])
}

// Accessible by all authenticated users — uses admin client to bypass ADMIN-only RLS
export async function getPublicSettings(): Promise<AppSettings> {
  const user = await getSessionUser()
  if (!user) return DEFAULTS

  const admin = createAdminClient()
  const { data } = await settingsFrom(admin).select('key, value')
  return parseSettings((data ?? []) as RawRow[])
}

export async function updateSettings(
  section: keyof AppSettings,
  values: AppSettings[keyof AppSettings],
): Promise<{ success?: boolean; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return { error: 'Sin permisos' }

  const admin = createAdminClient()

  const upserts = Object.entries(values as Record<string, unknown>).map(([field, value]) => ({
    key:        `${section}.${field}`,
    value,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  }))

  const { error } = await settingsFrom(admin)
    .upsert(upserts, { onConflict: 'key' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings/app')
  revalidatePath('/dashboard')

  return { success: true }
}

export async function uploadCompanyLogo(
  formData: FormData,
): Promise<{ success?: boolean; url?: string; error?: string }> {
  const user = await getSessionUser()
  if (!user || user.role !== 'ADMIN') return { error: 'Sin permisos' }

  const file = formData.get('logo') as File | null
  if (!file) return { error: 'Archivo no encontrado' }

  if (file.size > 5 * 1024 * 1024) return { error: 'El archivo no debe superar 5MB' }

  const allowed = ['image/png', 'image/jpeg', 'image/svg+xml']
  if (!allowed.includes(file.type)) return { error: 'Solo se permiten PNG, JPG o SVG' }

  const ext  = file.name.split('.').pop() ?? 'png'
  const path = `logo.${ext}`

  const admin = createAdminClient()

  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage
    .from('company-assets')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return { error: uploadError.message }

  const { data: { publicUrl } } = admin.storage
    .from('company-assets')
    .getPublicUrl(path)

  const { error: settingError } = await settingsFrom(admin)
    .upsert(
      { key: 'company.logo_url', value: publicUrl, updated_by: user.id, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    )

  if (settingError) return { error: settingError.message }

  revalidatePath('/dashboard/settings/app')
  revalidatePath('/dashboard')

  return { success: true, url: publicUrl }
}
