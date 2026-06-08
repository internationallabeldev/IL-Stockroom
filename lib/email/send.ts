import 'server-only'
import nodemailer, { type Transporter } from 'nodemailer'

/**
 * Provider-agnostic email sender.
 *
 * Today it sends through Gmail SMTP (free, no domain required) using an
 * App Password. To move to Resend + a verified domain later, only this file
 * changes — `sendEmail()` keeps the same signature, so the notify() helper and
 * every caller stay untouched.
 *
 * Required env vars (see .env.local):
 *   GMAIL_USER          the Gmail address that sends the mail
 *   GMAIL_APP_PASSWORD  16-char App Password (NOT the account password)
 *   EMAIL_FROM          optional display From, e.g. "IL Stockroom <user@gmail.com>"
 */

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  const user = process.env.GMAIL_USER
  // Google shows the App Password in 4 space-separated groups; SMTP needs the
  // 16 chars with no spaces.
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '')

  if (!user || !pass) return null

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }
  return transporter
}

export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export type SendEmailResult = { sent: boolean; skipped?: boolean; error?: string }

/**
 * Sends an email. Never throws — a delivery failure must not break the action
 * that triggered the notification. Returns a result the caller can log.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const t = getTransporter()

  // No credentials configured → no-op so local/dev keeps working.
  if (!t) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — email skipped')
    }
    return { sent: false, skipped: true }
  }

  const from = process.env.EMAIL_FROM || process.env.GMAIL_USER!

  try {
    await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    })
    return { sent: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    console.error('[email] send failed:', message)
    return { sent: false, error: message }
  }
}
