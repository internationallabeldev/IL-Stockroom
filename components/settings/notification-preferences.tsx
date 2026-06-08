'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { updateNotificationPreferences } from '@/actions/users.actions'
import type { AppUser } from '@/actions/users.actions'
import { isPushSupported, isPushEnabled, enablePush, disablePush } from '@/lib/push/client'

type Role = AppUser['role']

type NotifKey =
  | 'pending_requisitions'
  | 'quality_pending'
  | 'quality_result'
  | 'low_stock'
  | 'order_overdue'
  | 'requisition_approved'
  | 'requisition_rejected'
  | 'requisition_fulfilled'
  | 'chat_mention'

type NotifConfig = { key: NotifKey; label: string; description: string }

// Everyone can be mentioned in the chat, regardless of role.
const CHAT_MENTION: NotifConfig = {
  key: 'chat_mention',
  label: 'Menciones en el chat',
  description: 'Cuando alguien te menciona con @ en el chat',
}

const BY_ROLE: Record<Role, NotifConfig[]> = {
  ADMIN: [
    { key: 'pending_requisitions', label: 'Requisiciones pendientes',  description: 'Nuevas requisiciones esperando aprobación' },
    { key: 'quality_pending',      label: 'Calidad pendiente',         description: 'Recepciones que requieren revisión de calidad' },
    { key: 'quality_result',       label: 'Resultado de calidad',      description: 'Lotes rechazados o condicionales en calidad' },
    { key: 'low_stock',            label: 'Stock bajo',                description: 'Materiales por debajo del mínimo' },
    { key: 'order_overdue',        label: 'Órdenes vencidas',          description: 'Órdenes de compra sin recepción fuera de plazo' },
    { key: 'requisition_approved', label: 'Requisición aprobada',      description: 'Tus requisiciones fueron aprobadas' },
    { key: 'requisition_rejected', label: 'Requisición rechazada',     description: 'Tus requisiciones fueron rechazadas' },
    { key: 'requisition_fulfilled', label: 'Requisición surtida',      description: 'Tus requisiciones fueron surtidas (total o parcial)' },
    CHAT_MENTION,
  ],
  WAREHOUSE_MANAGER: [
    { key: 'pending_requisitions', label: 'Requisiciones pendientes', description: 'Nuevas requisiciones esperando aprobación' },
    { key: 'quality_pending',      label: 'Calidad pendiente',        description: 'Recepciones que requieren revisión de calidad' },
    { key: 'low_stock',            label: 'Stock bajo',               description: 'Materiales por debajo del mínimo' },
    { key: 'requisition_fulfilled', label: 'Requisición surtida',     description: 'Tus requisiciones fueron surtidas (total o parcial)' },
    CHAT_MENTION,
  ],
  PURCHASER: [
    { key: 'low_stock',        label: 'Stock bajo',          description: 'Materiales por debajo del mínimo' },
    { key: 'order_overdue',    label: 'Órdenes vencidas',    description: 'Órdenes de compra sin recepción fuera de plazo' },
    { key: 'quality_result',   label: 'Resultado de calidad', description: 'Lotes rechazados o condicionales en calidad' },
    CHAT_MENTION,
  ],
  PRODUCER: [
    { key: 'requisition_approved',  label: 'Requisición aprobada',  description: 'Tus requisiciones fueron aprobadas' },
    { key: 'requisition_rejected',  label: 'Requisición rechazada', description: 'Tus requisiciones fueron rechazadas' },
    { key: 'requisition_fulfilled', label: 'Requisición surtida',   description: 'Tus requisiciones fueron surtidas (total o parcial)' },
    CHAT_MENTION,
  ],
  USER: [CHAT_MENTION],
}

type ExtUser = AppUser & { notifications?: Record<string, boolean> | null }

type Props = { user: AppUser }

export function NotificationPreferences({ user }: Props) {
  const u      = user as ExtUser
  const items  = BY_ROLE[user.role] ?? []
  const stored = (u.notifications ?? {}) as Record<string, boolean>

  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(items.map(i => [i.key, stored[i.key] ?? true]))
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
      <PushToggle />

      <div className="border-t border-border/60 pt-4 space-y-4">
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
    </div>
  )
}

// ── Per-device Web Push toggle ──────────────────────────────────────────────────

function PushToggle() {
  const [supported, setSupported] = useState(true)
  const [enabled, setEnabled]     = useState(false)
  const [busy, setBusy]           = useState(false)

  useEffect(() => {
    if (!isPushSupported()) {
      setSupported(false)
      return
    }
    isPushEnabled().then(setEnabled).catch(() => {})
  }, [])

  async function toggle(value: boolean) {
    setBusy(true)
    const res = value ? await enablePush() : await disablePush()
    setBusy(false)
    if (res.ok) {
      setEnabled(value)
      toast.success(value ? 'Notificaciones push activadas en este dispositivo' : 'Notificaciones push desactivadas')
    } else {
      toast.error(res.reason)
      setEnabled(!value)
    }
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold">Notificaciones push (este dispositivo)</p>
        <p className="text-[10px] text-muted-foreground">
          {supported
            ? 'Recibe avisos en el navegador/celular aunque la app esté cerrada.'
            : 'Este navegador no soporta notificaciones push.'}
        </p>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={!supported || busy} />
    </div>
  )
}
