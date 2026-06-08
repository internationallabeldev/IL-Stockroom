// Custom service-worker code, compiled by @ducanh2912/next-pwa and imported
// into the generated workbox SW (public/sw.js) at build time.
// Handles Web Push: shows a notification and focuses/opens the app on click.
// NOTE: only active in production builds (next-pwa is disabled in dev).

/* eslint-disable no-restricted-globals */

self.addEventListener('push', event => {
  let payload = {}
  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = { title: 'IL Stockroom', body: event.data ? event.data.text() : '' }
  }

  const title = payload.title || 'IL Stockroom'
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    // Same tag collapses repeats of the same kind into one notification
    tag: payload.tag || undefined,
    renotify: !!payload.tag,
    data: { url: payload.url || '/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', event => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus an existing tab on the same origin and navigate it
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(targetUrl).catch(() => {})
          return
        }
      }
      // Otherwise open a new window
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    }),
  )
})
