'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { AlertTriangle } from 'lucide-react'

function ErrorContent() {
  const params = useSearchParams()
  const message = params.get('message') ?? 'El link ha expirado o es inválido'

  return (
    <div className="text-center max-w-sm w-full">
      <div className="mb-10 lg:hidden">
        <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
      </div>

      <div className="border border-[#1A1A1A]/15 bg-[#fdf9f0] p-8">
        <div className="size-12 bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="size-5 text-red-600" />
        </div>

        <h1 className="font-heading text-xl font-black uppercase tracking-tight text-[#1A1A1A] mb-2">
          Link inválido
        </h1>

        <p className="text-sm text-[#5f5e59] mb-6">{message}</p>

        <p className="text-[10px] text-[#5f5e59] mb-5">
          Si fuiste invitado al sistema, solicita al administrador que envíe una nueva invitación.
        </p>

        <Link
          href="/login"
          className="block w-full h-9 bg-[#1A1A1A] text-[#F5F2EA] text-[10px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center justify-center"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#F5F2EA] flex">
      <div className="hidden lg:flex w-80 shrink-0 flex-col justify-between bg-[#1A1A1A] text-[#F5F2EA] p-10">
        <span className="font-heading font-bold text-xl tracking-tighter">IL_STOCKROOM</span>
        <div />
        <div className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20">
          Uso interno exclusivo
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center px-8">
        <Suspense>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  )
}
