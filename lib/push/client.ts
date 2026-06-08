'use client'

import { savePushSubscription, deletePushSubscription } from '@/actions/push.actions'

// VAPID public key is safe to expose; the browser needs it to subscribe.
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** Returns the active SW registration, or null if none (e.g. dev: PWA off). */
async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing) return existing
  // next-pwa registers /sw.js itself in prod; wait briefly for it.
  try {
    return await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>(resolve => setTimeout(() => resolve(null), 3000)),
    ])
  } catch {
    return null
  }
}

/** True if this browser already has an active push subscription. */
export async function isPushEnabled(): Promise<boolean> {
  const reg = await getRegistration()
  if (!reg) return false
  const sub = await reg.pushManager.getSubscription()
  return !!sub
}

export type EnableResult = { ok: true } | { ok: false; reason: string }

/** Ask permission, subscribe, and persist the subscription server-side. */
export async function enablePush(): Promise<EnableResult> {
  if (!isPushSupported()) return { ok: false, reason: 'Este navegador no soporta notificaciones push.' }
  if (!VAPID_PUBLIC_KEY) return { ok: false, reason: 'Falta configurar la llave VAPID pública.' }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    return { ok: false, reason: 'Permiso de notificaciones denegado.' }
  }

  const reg = await getRegistration()
  if (!reg) {
    return { ok: false, reason: 'El service worker no está activo (en desarrollo el PWA está deshabilitado; prueba con un build de producción).' }
  }

  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    })
  }

  const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } }
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: 'No se pudo leer la suscripción.' }
  }

  const res = await savePushSubscription(
    { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } },
    navigator.userAgent,
  )
  if (res.error) return { ok: false, reason: res.error }
  return { ok: true }
}

/** Unsubscribe this device and remove it server-side. */
export async function disablePush(): Promise<EnableResult> {
  const reg = await getRegistration()
  if (!reg) return { ok: true }
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return { ok: true }

  const endpoint = sub.endpoint
  await sub.unsubscribe().catch(() => {})
  await deletePushSubscription(endpoint)
  return { ok: true }
}
