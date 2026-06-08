/**
 * Generic transactional email template for notifications.
 * Keeps the visual language of the original low-stock alert but works for any
 * notification type via a small, structured input.
 */

export type EmailStat = { label: string; value: string; emphasis?: boolean }

export type NotificationEmailInput = {
  badge: string          // small uppercase pill, e.g. "⚠️ Stock bajo"
  title: string          // main heading
  subtitle?: string      // muted line under the title
  intro?: string         // optional paragraph before the stats
  stats?: EmailStat[]     // label/value rows
  ctaLabel?: string      // button text
  ctaUrl?: string        // button link (absolute)
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function renderNotificationEmail(input: NotificationEmailInput): string {
  const { badge, title, subtitle, intro, stats = [], ctaLabel, ctaUrl } = input

  const statsHtml = stats
    .map(
      (s) => `
    <div class="stat-row">
      <span class="stat-label">${esc(s.label)}</span>
      <span class="stat-value${s.emphasis ? ' red' : ''}">${esc(s.value)}</span>
    </div>`,
    )
    .join('')

  const ctaHtml =
    ctaLabel && ctaUrl
      ? `<a href="${ctaUrl}" class="cta">${esc(ctaLabel)} →</a>`
      : ''

  const introHtml = intro ? `<p class="intro">${esc(intro)}</p>` : ''
  const subtitleHtml = subtitle ? `<p class="category">${esc(subtitle)}</p>` : ''

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .card { background: #fff; border-radius: 8px; padding: 32px; max-width: 480px; margin: 0 auto; border: 1px solid #e5e5e5; }
    .badge { display: inline-block; background: #f1f1f1; color: #333; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 4px; }
    h2 { font-size: 20px; font-weight: 700; margin: 16px 0 4px; color: #111; }
    .category { font-size: 12px; color: #888; margin: 0 0 16px; }
    .intro { font-size: 13px; color: #444; line-height: 1.5; margin: 16px 0; }
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
    <span class="badge">${esc(badge)}</span>
    <h2>${esc(title)}</h2>
    ${subtitleHtml}
    ${introHtml}
    ${statsHtml}
    ${ctaHtml}
    <p class="footer">Este correo fue generado automáticamente por IL Stockroom.</p>
  </div>
</body>
</html>`
}
