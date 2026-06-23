'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EmailOtpType } from '@supabase/supabase-js'
import { AuthShell } from '@/components/auth/auth-shell'

export default function ConfirmPage() {
  useEffect(() => {
    const supabase = createClient()

    async function processAuth() {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.slice(1))
      const next = searchParams.get('next')
      const destination = next && next.startsWith('/') ? next : '/welcome'

      // Error explícito en la URL
      const errorCode = searchParams.get('error_code') ?? hashParams.get('error_code')
      if (errorCode) {
        window.location.href = '/auth/error?error=expired'
        return
      }

      // 1. PKCE: code en query param
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { window.location.href = destination; return }
      }

      // 2. OTP: token_hash + type en query param
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) { window.location.href = destination; return }
      }

      // 3. Implicit flow: access_token en el hash — @supabase/ssr no lo detecta automáticamente,
      //    así que parseamos el hash y llamamos setSession() manualmente
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (!error) { window.location.href = destination; return }
      }

      // Sin sesión ni params válidos
      window.location.href = '/auth/error?error=expired'
    }

    processAuth()
  }, [])

  return (
    <AuthShell>
      <div className="text-center">
        <Loader2 className="size-8 animate-spin text-[#F5F2EA]/30 mx-auto mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">
          Verificando acceso...
        </p>
      </div>
    </AuthShell>
  )
}
