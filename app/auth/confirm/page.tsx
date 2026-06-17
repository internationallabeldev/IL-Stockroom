'use client'

import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { EmailOtpType } from '@supabase/supabase-js'

export default function ConfirmPage() {
  useEffect(() => {
    const supabase = createClient()

    async function processAuth() {
      const searchParams = new URLSearchParams(window.location.search)
      const hashParams = new URLSearchParams(window.location.hash.slice(1))

      // Error explícito en la URL
      const errorCode = searchParams.get('error_code') ?? hashParams.get('error_code')
      if (errorCode) {
        const msg = encodeURIComponent('El link de invitación ha expirado o es inválido')
        window.location.href = `/auth/error?message=${msg}`
        return
      }

      // 1. PKCE: code en query param
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) { window.location.href = '/welcome'; return }
      }

      // 2. OTP: token_hash + type en query param
      const token_hash = searchParams.get('token_hash')
      const type = searchParams.get('type') as EmailOtpType | null
      if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash })
        if (!error) { window.location.href = '/welcome'; return }
      }

      // 3. Implicit flow: access_token en el hash — @supabase/ssr no lo detecta automáticamente,
      //    así que parseamos el hash y llamamos setSession() manualmente
      const access_token = hashParams.get('access_token')
      const refresh_token = hashParams.get('refresh_token')
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token, refresh_token })
        if (!error) { window.location.href = '/welcome'; return }
      }

      // Sin sesión ni params válidos
      const msg = encodeURIComponent('El link de invitación ha expirado o es inválido')
      window.location.href = `/auth/error?message=${msg}`
    }

    processAuth()
  }, [])

  return (
    <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="size-8 animate-spin text-[#1A1A1A]/30 mx-auto mb-4" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
          Verificando acceso...
        </p>
      </div>
    </div>
  )
}
