'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 18 18" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  )
}

export function GoogleAuthButton() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { prompt: 'select_account' },
      },
    })
    if (oauthError) {
      setError('No se pudo iniciar sesión con Google')
      setLoading(false)
    }
    // En éxito, Supabase redirige al provider — no hay más que hacer acá.
  }

  return (
    <div>
      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#F5F2EA]/10" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">O</span>
        <span className="h-px flex-1 bg-[#F5F2EA]/10" />
      </div>

      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-none border border-[#F5F2EA]/15 bg-transparent text-[11px] font-bold uppercase tracking-[0.15em] text-[#F5F2EA] transition-colors duration-150 hover:border-[#F5F2EA]/30 hover:bg-white/[0.04] disabled:opacity-50"
      >
        <GoogleIcon className="size-4" />
        {loading ? 'Conectando…' : 'Continuar con Google'}
      </button>

      {error && (
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
