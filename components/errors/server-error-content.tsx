'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { gsap, useGSAP, MOTION_OK, MOTION_REDUCE } from '@/lib/landing/gsap-config'

type Props = {
  digest?: string
  reset: () => void
}

// Patrón de rombos (lattice de dos gradientes diagonales) — la "banda" que
// se mueve vía backgroundPosition hasta atascarse en el centro.
const BAND_PATTERN = {
  backgroundImage:
    'repeating-linear-gradient(45deg, #1A1A1A 0 2px, transparent 2px 10px), ' +
    'repeating-linear-gradient(-45deg, #1A1A1A 0 2px, transparent 2px 10px)',
  backgroundSize: '20px 20px',
}

export function ServerErrorContent({ digest, reset }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        const band = gsap.to('.paper-band', {
          backgroundPosition: '200px 0',
          duration: 3,
          repeat: -1,
          ease: 'none',
        })

        const jam = gsap.delayedCall(1.5, () => {
          band.pause()
          gsap.to('.paper-band', { scaleY: 0.85, skewX: 3, duration: 0.3, ease: 'power4.out' })
          gsap.to('.alert-light', {
            opacity: 1,
            repeat: -1,
            yoyo: true,
            duration: 0.6,
            stagger: 0.15,
          })
        })

        return () => {
          jam.kill()
          band.kill()
        }
      })

      // Atasco ya consumado, sin animación continua.
      mm.add(MOTION_REDUCE, () => {
        gsap.set('.paper-band', { scaleY: 0.85, skewX: 3 })
        gsap.set('.alert-light', { opacity: 1 })
      })

      return () => mm.revert()
    },
    { scope: ref }
  )

  return (
    <div
      ref={ref}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#F5F2EA] px-6"
    >
      <span className="alert-light absolute top-4 left-4 size-2 rounded-full bg-[#FFE600] opacity-30" aria-hidden />
      <span className="alert-light absolute top-4 right-9 size-2 rounded-full bg-[#EC008C] opacity-30" aria-hidden />
      <span className="alert-light absolute top-4 right-4 size-2 rounded-full bg-[#FFE600] opacity-30" aria-hidden />

      <div className="paper-band mb-10 h-3 w-full max-w-md" style={BAND_PATTERN} aria-hidden />

      <div
        role="img"
        aria-label="500"
        className="relative inline-flex items-center font-display text-[120px] font-black leading-none text-[#1A1A1A] select-none sm:text-[180px] md:text-[220px]"
      >
        <span aria-hidden>5</span>
        <span aria-hidden className="relative inline-block">
          <span className="invisible">0</span>
          <span
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)',
              transform: 'translate(-3px, -2px) rotate(-2deg)',
            }}
          >
            0
          </span>
          <span
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: 'polygon(0 50%, 100% 50%, 100% 100%, 0 100%)',
              transform: 'translate(3px, 2px) rotate(2deg)',
            }}
          >
            0
          </span>
        </span>
        <span aria-hidden>0</span>
      </div>

      <h1 className="mt-6 text-center font-display text-xl font-black uppercase tracking-widest text-[#1A1A1A] sm:text-2xl">
        Atasco en el sistema
      </h1>
      <p className="mt-2 max-w-sm text-center text-sm text-[#5f5e59]">
        Algo salió mal de nuestro lado. Ya estamos trabajando para resolverlo.
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex h-11 w-full items-center justify-center bg-[#1A1A1A] text-[11px] font-bold uppercase tracking-[0.15em] text-[#F5F2EA] transition-opacity hover:opacity-80"
        >
          Reintentar
        </button>
        <Link
          href="/dashboard"
          className="flex h-11 w-full items-center justify-center border border-[#1A1A1A]/20 text-[11px] font-bold uppercase tracking-[0.15em] text-[#1A1A1A] transition-colors hover:bg-[#1A1A1A]/5"
        >
          Ir al inicio →
        </Link>
      </div>

      {digest && (
        <p className="mt-10 text-[10px] tracking-wide text-[#5f5e59]/50">Ref: {digest}</p>
      )}
    </div>
  )
}
