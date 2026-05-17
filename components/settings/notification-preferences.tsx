'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { updateNotificationPreferences } from '@/actions/users.actions'
import type { AppUser } from '@/actions/users.actions'

type Role = AppUser['role']

type NotifKey =
  | 'pending_requisitions'
  | 'quality_pending'
  | 'low_stock'
  | 'order_overdue'
  | 'requisition_approved'
  | 'requisition_rejected'

type NotifConfig = { key: NotifKey; label: string; description: string }

const BY_ROLE: Record<Role, NotifConfig[]> = {
  ADMIN: [
    { key: 'pending_requisitions', label: 'Requisiciones pendientes',  description: 'Nuevas requisiciones esperando aprobación' },
    { key: 'quality_pending',      label: 'Calidad pendiente',         description: 'Recepciones que requieren revisión de calidad' },
    { key: 'low_stock',            label: 'Stock bajo',                description: 'Materiales por debajo del mínimo' },
    { key: 'order_overdue',        label: 'Órdenes vencidas',          description: 'Órdenes de compra sin recepción fuera de plazo' },
    { key: 'requisition_approved', label: 'Requisición aprobada',      description: 'Tus requisiciones fueron aprobadas' },
    { key: 'requisition_rejected', label: 'Requisición rechazada',     description: 'Tus requisiciones fueron rechazadas' },
  ],
  WAREHOUSE_MANAGER: [
    { key: 'pending_requisitions', label: 'Requisiciones pendientes', description: 'Nuevas requisiciones esperando aprobación' },
    { key: 'quality_pending',      label: 'Calidad pendiente',        description: 'Recepciones que requieren revisión de calidad' },
    { key: 'low_stock',            label: 'Stock bajo',               description: 'Materiales por debajo del mínimo' },
  ],
  PURCHASER: [
    { key: 'low_stock',        label: 'Stock bajo',       description: 'Materiales por debajo del mínimo' },
    { key: 'order_overdue',    label: 'Órdenes vencidas', description: 'Órdenes de compra sin recepción fuera de plazo' },
  ],
  PRODUCER: [
    { key: 'requisition_approved', label: 'Requisición aprobada', description: 'Tus requisiciones fueron aprobadas' },
    { key: 'requisition_rejected', label: 'Requisición rechazada', description: 'Tus requisiciones fueron rechazadas' },
  ],
  USER: [],
}

type ExtUser = AppUser & { notifications?: Record<string, boolean> | null }

type Props = { user: AppUser }

export function NotificationPreferences({ user }: Props) {
  const u      = user as ExtUser
  const items  = BY_ROLE[user.role] ?? []
  const stored = (u.notifications ?? {}) as Record<string, boolean>

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.key, stored[i.key] ?? false]))
  )
  const [saving, setSaving] = useState(false)

  if (items.length === 0) {
    return (
      <p className="text-[10px] text-muted-foreground">
        No hay notificaciones configurables para tu rol.
      </p>
    )
  }

  async function toggle(key: string, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    setSaving(true)
    const res = await updateNotificationPreferences(next)
    setSaving(false)
    if (res.error) {
      toast.error(res.error)
      setPrefs(prefs)
    }
  }

  return (
    <div className="space-y-4">
      {items.map(item => (
        <div key={item.key} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold">{item.label}</p>
            <p className="text-[10px] text-muted-foreground">{item.description}</p>
          </div>
          <Switch
            checked={prefs[item.key] ?? false}
            onCheckedChange={v => toggle(item.key, v)}
            disabled={saving}
          />
        </div>
      ))}
    </div>
  )
}
