'use client'

import { useEffect, useRef } from 'react'
import { ScrollTrigger, CMYK } from '@/lib/landing/gsap-config'
import { LandingNav } from './landing-nav'
import { HeroSection } from './hero-section'
import { NosotrosSection } from './nosotros-section'
import { ProductosSection } from './productos-section'
import { EspecialidadesSection } from './especialidades-section'
import { SociosSection } from './socios-section'
import { ContactoSection } from './contacto-section'
import { FooterSection } from './footer-section'

export function LandingExperience() {
  const ref = useRef<HTMLDivElement>(null)

  /* ciclado CMYK del acento — idéntico al diseño anterior */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const durations = [8000, 5000, 2000]
    let idx = 0
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      idx = (idx + 1) % CMYK.length
      el.style.setProperty('--cmyk-accent', CMYK[idx])
      id = setTimeout(tick, durations[idx])
    }
    id = setTimeout(tick, durations[idx])
    return () => clearTimeout(id)
  }, [])

  /* fallback estático para prefers-reduced-motion (ver globals.css) */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => el.classList.toggle('landing-reduced', mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  /* esta landing es una experiencia con scroll fijado (pins): restaurar una
     posición mid-scroll tras recargar deja los pin-spacers y los triggers
     desincronizados. Arrancamos siempre desde el hero. */
  useEffect(() => {
    const prev = history.scrollRestoration
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return () => {
      history.scrollRestoration = prev
    }
  }, [])

  /* los triggers del nav se crean antes que los pins de las secciones;
     sort() fuerza el refresh en orden de documento para que los pin
     spacers se acumulen correctamente. Re-refresh al cargar fuentes. */
  useEffect(() => {
    ScrollTrigger.sort()
    ScrollTrigger.refresh()
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh()
    })
    /* en la PWA instalada el 'load' (imágenes, ventana restaurada) llega
       después de fonts.ready; sin este refresh los triggers quedan rancios */
    const onLoad = () => ScrollTrigger.refresh()
    if (document.readyState !== 'complete') window.addEventListener('load', onLoad, { once: true })
    return () => {
      cancelled = true
      window.removeEventListener('load', onLoad)
    }
  }, [])

  return (
    <div ref={ref} className="cmyk-cycling overflow-x-clip bg-[#F5F2EA] text-[#1A1A1A]">
      <LandingNav />
      <HeroSection />
      <NosotrosSection />
      <ProductosSection />
      <EspecialidadesSection />
      <SociosSection />
      <ContactoSection />
      <FooterSection />
    </div>
  )
}
