import 'server-only'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

/**
 * Limitador de intentos por IP/email, respaldado por Upstash Redis.
 *
 * Si las credenciales de Upstash no están configuradas, las verificaciones
 * abren en lugar de cerrar (fail-open) para no romper el entorno local antes
 * de crear la cuenta de Upstash — ver lib/email/send.ts para el mismo patrón.
 */

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

function makeLimiter(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1]) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: 'il-stockroom',
  })
}

const loginLimiter = makeLimiter(5, '15 m')
const passwordResetLimiter = makeLimiter(3, '1 h')
const botLimiter = makeLimiter(5, '1 m')

export type RateLimitResult = { success: boolean }

async function check(limiter: Ratelimit | null, key: string): Promise<RateLimitResult> {
  if (!limiter) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[rate-limit] UPSTASH_REDIS_REST_URL / TOKEN no configurados — límite omitido')
    }
    return { success: true }
  }
  const { success } = await limiter.limit(key)
  return { success }
}

export const checkLoginRateLimit = (ip: string) => check(loginLimiter, `login:${ip}`)
export const checkPasswordResetRateLimit = (email: string) =>
  check(passwordResetLimiter, `pwreset:${email.toLowerCase()}`)
export const checkBotRateLimit = (userId: string) => check(botLimiter, `bot:${userId}`)

/** Limpia el contador de un login exitoso para no penalizar al usuario legítimo. */
export async function resetLoginRateLimit(ip: string): Promise<void> {
  await loginLimiter?.resetUsedTokens(`login:${ip}`)
}

export async function getClientIp(): Promise<string> {
  const h = await headers()
  const forwarded = h.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return h.get('x-real-ip') ?? '127.0.0.1'
}
