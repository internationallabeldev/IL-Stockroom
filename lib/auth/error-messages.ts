export type AuthErrorCode =
  | 'disabled'
  | 'unauthorized_domain'
  | 'expired'
  | 'rate_limited'
  | 'invalid_credentials'
  | 'session_expired'

export type AuthErrorEntry = { title: string; message: string }

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode | 'default', AuthErrorEntry> = {
  disabled: {
    title: 'Cuenta desactivada',
    message: 'Un administrador desactivó tu cuenta. Contáctalo para más información.',
  },
  unauthorized_domain: {
    title: 'Acceso no autorizado',
    message: 'Esta cuenta no tiene una invitación activa en el sistema.',
  },
  expired: {
    title: 'Link inválido',
    message: 'El enlace ha expirado o ya fue utilizado.',
  },
  rate_limited: {
    title: 'Demasiados intentos',
    message: 'Hiciste demasiados intentos. Espera unos minutos e inténtalo de nuevo.',
  },
  invalid_credentials: {
    title: 'Credenciales incorrectas',
    message: 'Correo o contraseña incorrectos.',
  },
  session_expired: {
    title: 'Sesión expirada',
    message: 'Tu sesión expiró. Inicia sesión de nuevo.',
  },
  default: {
    title: 'Link inválido',
    message: 'El link ha expirado o es inválido.',
  },
}

export function getAuthErrorEntry(code: string | null): AuthErrorEntry {
  if (code && code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[code as AuthErrorCode]
  }
  return AUTH_ERROR_MESSAGES.default
}
