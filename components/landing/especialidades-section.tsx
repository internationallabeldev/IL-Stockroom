'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '@/lib/landing/gsap-config'
import { SPECIALTIES } from '@/lib/landing/data'

export function EspecialidadesSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('.esp-wrap').forEach(wrap => {
          const q = gsap.utils.selector(wrap)
          const tl = gsap.timeline({
            scrollTrigger: { trigger: wrap, start: 'top top', end: 'bottom bottom', scrub: 1 },
          })

          /* fase 1: el nombre escala hasta ocupar la pantalla */
          tl.fromTo(q('.esp-name'), { scale: 0.3, yPercent: 6 }, { scale: 1, yPercent: 0, duration: 1, ease: 'power1.inOut' }, 0)
            .fromTo(q('.esp-plate'), { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.2 }, 0.05)
            /* fase 2: clip-reveal circular de la textura, el texto pasa a outline */
            .fromTo(
              q('.esp-texture'),
              { clipPath: 'circle(0% at 50% 45%)' },
              { clipPath: 'circle(125% at 50% 45%)', duration: 0.85, ease: 'power1.in' },
              0.95,
            )
            .fromTo(q('.esp-name-outline'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 1.05)
            .to(q('.esp-name-solid'), { autoAlpha: 0, duration: 0.25 }, 1.1)
            .fromTo(q('.esp-desc'), { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 1.35)
        })
      })
    },
    { scope: ref },
  )

  return (
    <section id="especialidades" ref={ref} data-nav-theme="dark" className="bg-[#1A1A1A] text-[#F5F2EA]">
      <div className="px-8 pb-10 pt-28 md:px-16">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">03 — Especialidades</p>
        <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          Cuatro placas. <span className="text-(--cmyk-accent)">C · M · Y · K</span>
        </h2>
      </div>

      {SPECIALTIES.map((sp, i) => (
        <div key={sp.plate} className="esp-wrap relative h-[220vh]">
          <div className="esp-sticky sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-[#1A1A1A]">
            <div className="esp-texture absolute inset-0" style={{ ...sp.texture, clipPath: 'circle(0% at 50% 45%)' }}>
              <div
                className="absolute inset-0"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.6) 100%)' }}
              />
            </div>

            <div className="relative z-10 px-6 text-center">
              <p className="esp-plate mb-6 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40 opacity-0">
                <span
                  className="mr-2 inline-flex size-7 items-center justify-center border align-middle font-heading text-xs font-bold"
                  style={{ borderColor: sp.accent, color: sp.accent }}
                >
                  {sp.plate}
                </span>
                Placa 0{i + 1} / 04
              </p>

              <div className="esp-name relative inline-block will-change-transform">
                <span
                  className="esp-name-solid block font-heading text-[clamp(4rem,16vw,15rem)] font-bold tracking-tighter leading-[0.85]"
                  style={{ color: sp.accent }}
                >
                  {sp.name.map(line => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
                <span
                  aria-hidden
                  className="esp-name-outline absolute inset-0 block font-heading text-[clamp(4rem,16vw,15rem)] font-bold tracking-tighter leading-[0.85] opacity-0"
                  style={{ WebkitTextStroke: '2px #F5F2EA', color: 'transparent' }}
                >
                  {sp.name.map(line => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>

              <p className="esp-desc mx-auto mt-8 max-w-md text-sm leading-relaxed text-[#F5F2EA]/70 opacity-0 md:text-base">
                {sp.desc}
              </p>
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}
