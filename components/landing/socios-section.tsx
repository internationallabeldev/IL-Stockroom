'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '@/lib/landing/gsap-config'
import { PARTNERS, CERTIFICATIONS } from '@/lib/landing/data'
import { CMYKDrop } from './cmyk-drop'

const BG_ROWS = 7

export function SociosSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        const st = { trigger: ref.current, start: 'top bottom', end: 'bottom top', scrub: true } as const

        /* tres capas a velocidades distintas: fondo 20% · medio 60% · frente 100% */
        gsap.fromTo('.socios-bg', { yPercent: 12 }, { yPercent: -12, ease: 'none', scrollTrigger: { ...st } })
        gsap.fromTo('.socios-mid', { yPercent: 22 }, { yPercent: -22, ease: 'none', scrollTrigger: { ...st } })
        gsap.fromTo(
          '.socios-drop',
          { yPercent: 35, rotation: -6 },
          { yPercent: -40, rotation: 8, ease: 'none', scrollTrigger: { ...st } },
        )

        gsap.from('.socios-card', {
          autoAlpha: 0,
          y: 60,
          stagger: 0.12,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.socios-front', start: 'top 80%', toggleActions: 'play none none reverse' },
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      data-nav-theme="light"
      className="relative overflow-hidden bg-[#F5F2EA] py-[18vh] text-[#1A1A1A]"
    >
      {/* capa fondo: patrón tipográfico */}
      <div className="socios-bg absolute inset-x-0 -inset-y-[20%] flex flex-col justify-between select-none" aria-hidden>
        {Array.from({ length: BG_ROWS }).map((_, i) => (
          <p
            key={i}
            className={`whitespace-nowrap font-heading text-[5vw] font-bold tracking-tighter leading-none ${i % 2 ? 'translate-x-[-6%]' : 'translate-x-[2%]'}`}
            style={{ WebkitTextStroke: '1px rgba(26,26,26,0.07)', color: 'transparent' }}
          >
            INTERNATIONAL LABEL — EMPAQUE — CMYK — INTERNATIONAL LABEL — EMPAQUE — CMYK
          </p>
        ))}
      </div>

      {/* gota CMYK flotando a su propia velocidad */}
      <div className="socios-drop absolute right-[4%] top-[8%] hidden md:block" aria-hidden>
        <CMYKDrop className="h-[38vh] w-auto" />
      </div>

      <div className="relative z-10 px-8 md:px-16">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">04 — Alianzas</p>
        <h2 className="mb-16 font-heading text-3xl font-bold tracking-tight md:text-4xl">Socios comerciales</h2>

        {/* capa media: nombres enormes */}
        <div className="socios-mid mb-24 space-y-3">
          {PARTNERS.map((name, i) => (
            <p
              key={name}
              className="font-heading text-[11vw] font-bold tracking-tighter leading-[0.95] transition-colors duration-300 hover:text-(--cmyk-accent) md:text-[7.5vw]"
              style={
                i % 2
                  ? { WebkitTextStroke: '2px #1A1A1A', color: 'transparent' }
                  : undefined
              }
            >
              {name}
            </p>
          ))}
        </div>

        {/* capa frente: certificaciones */}
        <div className="socios-front grid gap-4 md:grid-cols-3">
          {CERTIFICATIONS.map((cert, i) => (
            <div key={cert} className="socios-card border border-[#1A1A1A]/15 bg-[#F5F2EA] p-8 shadow-[0_20px_50px_rgba(26,26,26,0.08)]">
              <p className="mb-8 font-heading text-4xl font-bold text-(--cmyk-accent)">0{i + 1}</p>
              <p className="font-heading text-xl font-bold tracking-tight">{cert}</p>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59]">
                Certificación vigente
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
