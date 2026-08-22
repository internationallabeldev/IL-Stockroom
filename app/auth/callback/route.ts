import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Callback dedicado al login con Google (signInWithOAuth) — separado de
// /auth/confirm, que sigue manejando invite/recovery/magic-link. Corre en el
// servidor para poder cortar el acceso (dominio no permitido, usuario sin
// invitación, cuenta desactivada) antes de que llegue a hidratar cualquier página.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/auth/error?error=expired', request.url))
  }

  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !user) {
    return NextResponse.redirect(new URL('/auth/error?error=expired', request.url))
  }

  const allowedDomain = process.env.NEXT_PUBLIC_ALLOWED_DOMAIN
  if (allowedDomain && !user.email?.toLowerCase().endsWith(`@${allowedDomain.toLowerCase()}`)) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/error?error=unauthorized_domain', request.url))
  }

  // Solo cuentas ya invitadas pueden entrar por Google — signInWithOAuth crea
  // un usuario en auth.users para CUALQUIER cuenta de Google, así que sin este
  // chequeo cualquier persona ajena a la organización podría autoregistrarse.
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('enabled, onboarding_completed')
    .eq('email', user.email!)
    .maybeSingle()

  if (!profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/error?error=unauthorized_domain', request.url))
  }

  if (!profile.enabled) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=disabled', request.url))
  }

  const destination = profile.onboarding_completed ? '/dashboard' : '/welcome'
  return NextResponse.redirect(new URL(destination, request.url))
}
