'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { gsap, useGSAP, MOTION_OK, MOTION_REDUCE } from '@/lib/landing/gsap-config'
import { openChat } from '@/lib/chat/open-chat'
import { CMYKNumber } from './cmyk-number'

const GLITCH_INTERVAL_MS = 8000

export function NotFoundContent() {
  const ref = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Desregistro progresivo: las 3 capas de color respiran fuera de
      // sincronía, buscando alinearse con la capa negra y sin lograrlo nunca.
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ repeat: -1, yoyo: true })
        tl.to('.layer-cyan', { x: -8, y: -5, duration: 2, ease: 'sine.inOut' })
          .to('.layer-magenta', { x: 8, y: 3, duration: 2, ease: 'sine.inOut' }, '<')
          .to('.layer-yellow', { x: 3, y: 8, duration: 2, ease: 'sine.inOut' }, '<')

        function glitch() {
          gsap.to('.color-layer', {
            x: () => gsap.utils.random(-20, 20),
            y: () => gsap.utils.random(-15, 15),
            duration: 0.08,
            ease: 'power4.inOut',
            onComplete: () => {
              gsap.to('.color-layer', { x: 0, y: 0, duration: 0.3, ease: 'power2.out' })
            },
          })
          gsap.fromTo(
            '.scanlines',
            { opacity: 0 },
            { opacity: 0.5, duration: 0.06, yoyo: true, repeat: 3 }
          )
        }
        const id = window.setInterval(glitch, GLITCH_INTERVAL_MS)

        return () => {
          window.clearInterval(id)
          tl.kill()
        }
      })

      // Sin movimiento: el desregistro queda fijo, sin glitch ni animación continua.
      mm.add(MOTION_REDUCE, () => {
        gsap.set('.layer-cyan', { x: -3, y: -2 })
        gsap.set('.layer-magenta', { x: 3, y: 1 })
        gsap.set('.layer-yellow', { x: 1, y: 3 })
      })

      return () => mm.revert()
    },
    { scope: ref }
  )

  function reportInChat() {
    const message = `Encontré una página rota: ${pathname}`
    navigator.clipboard?.writeText(message).catch(() => {})
    openChat()
    toast.success('Mensaje copiado — pégalo en el chat')
  }

  return (
    <div
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F5F2EA] px-6"
    >
      <div
        className="scanlines pointer-events-none absolute inset-0 opacity-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, rgba(26,26,26,0.4) 0px, rgba(26,26,26,0.4) 1px, transparent 1px, transparent 4px)',
        }}
        aria-hidden
      />

      <CMYKNumber number="404" />

      <h1 className="mt-8 text-center font-display text-xl font-black uppercase tracking-widest text-[#1A1A1A] sm:text-2xl">
        Página fuera de registro
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[#5f5e59]">
        La página que buscas no existe o fue movida.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-3">
        <Link
          href="/dashboard"
          className="flex h-11 w-full items-center justify-center bg-[#1A1A1A] text-[11px] font-bold uppercase tracking-[0.15em] text-[#F5F2EA] transition-opacity hover:opacity-80"
        >
          Volver al inicio →
        </Link>
        <button
          type="button"
          onClick={reportInChat}
          className="text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] transition-colors hover:text-[#1A1A1A]"
        >
          Reportar este error en el chat
        </button>
      </div>

      <p className="mt-10 text-[10px] tracking-wide text-[#5f5e59]/50">
        Código de error: DESREG-404 · Cobertura de tinta: 0%
      </p>
    </div>
  )
}
