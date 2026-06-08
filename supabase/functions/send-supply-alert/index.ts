import { Resend } from 'npm:resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const APP_URL = Deno.env.get('APP_URL') ?? 'https://app.example.com'

interface AlertPayload {
  item_id: number
  item_name: string
  category_name: string
  quantity_current: number
  quantity_minimum: number
  unit: string
  alert_emails: string[]
  provider_name?: string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let payload: AlertPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const {
    item_name,
    category_name,
    quantity_current,
    quantity_minimum,
    unit,
    alert_emails,
    provider_name,
  } = payload

  const falta = quantity_minimum - quantity_current
  const suppliesUrl = `${APP_URL}/dashboard/supplies`

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 8px; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #e5e5e5; }
    .badge { display: inline-block; background: #fee2e2; color: #dc2626; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; }
    h2 { font-size: 20px; font-weight: 700; margin: 16px 0 4px; color: #111; }
    .category { font-size: 12px; color: #888; margin-bottom: 24px; }
    .stat-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .stat-label { font-size: 12px; color: #666; }
    .stat-value { font-size: 14px; font-weight: 700; color: #111; }
    .stat-value.red { color: #dc2626; }
    .cta { display: block; margin-top: 28px; text-align: center; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 0.04em; }
    .footer { margin-top: 24px; font-size: 11px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">⚠️ Stock bajo</span>
    <h2>${item_name}</h2>
    <p class="category">${category_name}</p>

    <div class="stat-row">
      <span class="stat-label">Stock actual</span>
      <span class="stat-value red">${quantity_current} ${unit}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Mínimo requerido</span>
      <span class="stat-value">${quantity_minimum} ${unit}</span>
    </div>
    <div class="stat-row">
      <span class="stat-label">Cantidad faltante</span>
      <span class="stat-value red">${falta} ${unit}</span>
    </div>
    ${provider_name ? `
    <div class="stat-row">
      <span class="stat-label">Proveedor sugerido</span>
      <span class="stat-value">${provider_name}</span>
    </div>` : ''}

    <a href="${suppliesUrl}" class="cta">Ver módulo de consumibles →</a>
    <p class="footer">Este correo fue generado automáticamente por el sistema de inventario.</p>
  </div>
</body>
</html>
`

  const { error } = await resend.emails.send({
    from:    'Inventario <alertas@international-label.com>',
    to:      alert_emails,
    subject: `⚠️ Stock bajo: ${item_name}`,
    html,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
