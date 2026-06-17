'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/lib/landing/gsap-config'
import { CERTIFICATIONS } from '@/lib/landing/data'
import { ContactForm } from '@/app/_components/contact-form'

export function ContactoSection() {
  const ref = useRef<HTMLElement>(null)
  const lockedRef = useRef(false)
  /* origen del wipe en %, por defecto centrado-arriba; sigue al cursor hasta congelarse */
  const originRef = useRef({ x: 50, y: 30 })

  /* el wipe circular nace en la última posición conocida del cursor;
     se congela (lockedRef) en cuanto el wipe empieza */
  useEffect(() => {
    const section = ref.current
    if (!section) return
    const onMove = (e: PointerEvent) => {
      if (lockedRef.current) return
      const r = section.getBoundingClientRect()
      originRef.current = {
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  useGSAP(
    () => {
      const section = ref.current
      const wipe = section?.querySelector<HTMLElement>('.contacto-wipe')
      if (!section || !wipe) return

      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        /* El wipe se pinta DIRECTO desde el progreso del ScrollTrigger
           (no desde un tween-proxy con onUpdate): un proxy+onUpdate no se
           re-dispara cuando ScrollTrigger re-evalúa a la misma posición tras
           un refresh/restauración de scroll, y dejaba el clip-path congelado
           en 0% (texto claro sobre fondo claro). Construimos circle() con
           números concretos porque GSAP/CSS no interpola var() dentro. */
        let last = -1
        const paint = (progress: number) => {
          last = progress
          const { x, y } = originRef.current
          wipe.style.clipPath = `circle(${(progress * 150).toFixed(1)}% at ${x.toFixed(1)}% ${y.toFixed(1)}%)`
        }
        paint(0)
        ScrollTrigger.create({
          trigger: section,
          start: 'top 80%',
          end: 'top 20%',
          onUpdate: self => paint(self.progress),
          onRefresh: self => paint(self.progress),
          onToggle: self => paint(self.progress),
          onEnter: () => (lockedRef.current = true),
          onLeaveBack: () => (lockedRef.current = false),
        })

        const inner = gsap.fromTo(
          '.contacto-inner',
          { autoAlpha: 0, y: 60 },
          {
            autoAlpha: 1,
            y: 0,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top 55%', end: 'top 25%', scrub: 1 },
          },
        )

        /* red de seguridad: si los triggers quedaron con posiciones obsoletas
           (refresh perdido tras los pins, scroll restaurado en la PWA) el wipe
           se quedaba en 0% — texto claro sobre fondo claro. Si la sección ya
           pasó de media pantalla y el wipe sigue en 0, forzamos el estado final. */
        const io = new IntersectionObserver(
          entries => {
            for (const entry of entries) {
              if (!entry.isIntersecting || last !== 0) continue
              if (entry.boundingClientRect.top < window.innerHeight * 0.55) {
                lockedRef.current = true
                paint(1)
                inner.progress(1)
              }
            }
          },
          { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
        )
        io.observe(section)
        return () => io.disconnect()

        /* las líneas se dibujan solas (stroke-dashoffset) */
        gsap.utils.toArray<SVGGeometryElement>('.draw-path').forEach(p => {
          const len = p.getTotalLength()
          gsap.fromTo(
            p,
            { strokeDasharray: len, strokeDashoffset: len },
            {
              strokeDashoffset: 0,
              ease: 'none',
              scrollTrigger: { trigger: p, start: 'top 85%', end: 'top 40%', scrub: 1 },
            },
          )
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="contacto" ref={ref} data-nav-theme="dark" className="contacto-section relative overflow-hidden bg-[#F5F2EA]">
      {/* capa oscura revelada con wipe circular desde el cursor */}
      <div className="contacto-wipe absolute inset-0 bg-[#1A1A1A]" />

      <div className="contacto-inner relative z-10 px-8 py-28 text-[#F5F2EA] md:px-16">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">05 — Contacto</p>
        <h2 className="font-heading text-[clamp(2.5rem,8vw,7rem)] font-bold tracking-tighter leading-[0.92]">
          PLATÍCANOS
          <br />
          TU PROYECTO<span className="text-(--cmyk-accent)">.</span>
        </h2>

        {/* línea que se traza bajo el titular */}
        <svg viewBox="0 0 600 20" className="mt-6 h-5 w-full max-w-2xl overflow-visible" aria-hidden>
          <path
            className="draw-path"
            d="M0,10 C150,18 450,2 600,10"
            fill="none"
            stroke="var(--cmyk-accent)"
            strokeWidth="2"
          />
        </svg>

        <div className="mt-16 grid items-start gap-16 md:grid-cols-2">
          <div>
            <p className="mb-10 max-w-md text-base leading-relaxed text-[#F5F2EA]/60">
              Cuéntanos sobre tu proyecto y nuestro equipo de ventas te contactará a la brevedad para asesorarte y
              preparar una cotización.
            </p>
            <div className="space-y-8">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">Email</p>
                <a
                  href="mailto:ventas@internationallabel.com.mx"
                  className="font-heading text-base font-medium text-(--cmyk-accent) underline-offset-4 hover:underline"
                >
                  ventas@internationallabel.com.mx
                </a>
              </div>
              <div>
                <svg viewBox="0 0 400 2" className="mb-6 h-0.5 w-full" preserveAspectRatio="none" aria-hidden>
                  <path className="draw-path" d="M0,1 L400,1" fill="none" stroke="rgba(245,242,234,0.2)" strokeWidth="2" />
                </svg>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">
                  Certificaciones
                </p>
                <div className="flex flex-col gap-2">
                  {CERTIFICATIONS.map(cert => (
                    <span key={cert} className="flex items-center gap-2 text-xs font-medium text-[#F5F2EA]/60">
                      <span className="inline-block size-1.5 shrink-0 rounded-full bg-(--cmyk-accent)" />
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* el formulario vive en una "etiqueta" de papel sobre el fondo oscuro */}
          <div className="relative">
            <svg className="absolute -inset-3 h-[calc(100%+24px)] w-[calc(100%+24px)] overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
              <rect
                className="draw-path"
                x="0.5"
                y="0.5"
                width="99"
                height="99"
                fill="none"
                stroke="var(--cmyk-accent)"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="relative bg-[#F5F2EA] p-6 text-[#1A1A1A] shadow-[0_40px_80px_rgba(0,0,0,0.45)] md:p-10">
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
