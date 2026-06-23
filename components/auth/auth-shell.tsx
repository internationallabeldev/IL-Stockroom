'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { SPECIALTIES } from '@/lib/landing/data'
import { CmykPattern } from './cmyk-pattern'
import { CmykBackdropCycler } from './cmyk-backdrop-cycler'

const INTERVAL_MS = 11000

// Full-screen wrapper compartido por todas las pantallas de auth — fondo
// negro técnico + placas CMYK que se revelan en wipe circular + patrón de
// rombos sutil encima. Expone --cmyk-accent (mismo mecanismo que
// welcome-experience.tsx) para que la línea del card y el foco de los
// inputs sigan el color de la placa activa.
export function AuthShell({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0)
  const [reduced, setReduced] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setReduced(r)
    el.style.setProperty('--cmyk-accent', SPECIALTIES[0].accent)
    if (r) return

    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SPECIALTIES.length
      setIndex(i)
      el.style.setProperty('--cmyk-accent', SPECIALTIES[i].accent)
    }, INTERVAL_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      ref={wrapRef}
      className="cmyk-cycling relative min-h-screen overflow-hidden bg-[#1A1A1A] text-[#F5F2EA]"
    >
      <CmykBackdropCycler index={index} reduced={reduced} />
      <CmykPattern />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20">
        <Link
          href="/"
          className="absolute left-6 top-6 font-heading text-sm font-bold tracking-tighter text-[#F5F2EA]/40 transition-opacity hover:opacity-70 sm:left-10 sm:top-10"
        >
          IL_STOCKROOM
        </Link>

        {children}

        <p className="absolute bottom-6 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20 sm:bottom-10">
          IL Stockroom · Sistema de Inventario
        </p>
      </div>
    </div>
  )
}
