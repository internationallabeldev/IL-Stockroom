'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '@/lib/landing/gsap-config'

const MOMENTS = [
  { lines: ['Somos una empresa', '100% mexicana'] },
  { lines: ['+20 años fabricando', 'materiales de empaque'] },
  { lines: ['Con la tecnología más', 'avanzada de la industria'] },
]

export function NosotrosSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        const counters = gsap.utils.toArray<HTMLElement>('.nosotros-count')
        const proxy = { v: 0 }
        counters.forEach(el => (el.textContent = '0'))

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
          },
        })

        /* contador 0 → 20 a lo largo de los 300vh */
        tl.to(proxy, {
          v: 20,
          duration: 2.7,
          ease: 'none',
          onUpdate: () => {
            const t = String(Math.round(proxy.v))
            counters.forEach(el => {
              if (el.textContent !== t) el.textContent = t
            })
          },
        }, 0.15)
        tl.fromTo(
          '.nosotros-fill',
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: 2.7, ease: 'none' },
          0.15,
        )

        /* tres momentos, cada uno con una transición distinta */
        const m = gsap.utils.toArray<HTMLElement>('.nosotros-moment')
        tl.to(m[0], { yPercent: -25, skewY: -5, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 0.75)
          .fromTo(
            m[1],
            { clipPath: 'inset(0% 100% 0% 0%)', xPercent: 5, autoAlpha: 1 },
            { clipPath: 'inset(0% 0% 0% 0%)', xPercent: 0, duration: 0.4 },
            0.95,
          )
          .to(m[1], { scale: 0.94, filter: 'blur(12px)', autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, 1.75)
          .fromTo(
            m[2],
            { yPercent: 30, rotation: 2, autoAlpha: 0 },
            { yPercent: 0, rotation: 0, autoAlpha: 1, duration: 0.4 },
            1.95,
          )

        /* rail de progreso */
        const ticks = gsap.utils.toArray<HTMLElement>('.nosotros-tick')
        const starts = [0.02, 0.95, 1.95]
        ticks.forEach((tick, i) => {
          tl.to(tick, { backgroundColor: 'var(--cmyk-accent)', duration: 0.05 }, starts[i])
          if (i < 2) tl.to(tick, { backgroundColor: 'rgba(26,26,26,0.15)', duration: 0.05 }, starts[i + 1])
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      id="nosotros"
      ref={ref}
      data-nav-theme="light"
      className="nosotros-wrap relative h-[300vh] bg-[#F5F2EA] text-[#1A1A1A]"
    >
      <div className="nosotros-sticky sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-8 md:px-16">
        <p className="absolute left-8 top-24 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] md:left-16">
          01 — Nosotros
        </p>

        <div className="grid w-full items-center gap-10 md:grid-cols-2">
          <div className="nosotros-moments relative h-[38vh] md:h-[50vh]">
            {MOMENTS.map((mo, i) => (
              <div
                key={i}
                className={`nosotros-moment absolute inset-0 flex flex-col justify-center ${i > 0 ? 'opacity-0' : ''}`}
              >
                <p className="mb-5 text-[10px] font-bold uppercase tracking-widest text-(--cmyk-accent)">
                  0{i + 1} / 03
                </p>
                {mo.lines.map(line => (
                  <span
                    key={line}
                    className="block font-heading text-4xl font-bold tracking-tighter leading-[1.04] md:text-6xl"
                  >
                    {line}
                  </span>
                ))}
              </div>
            ))}
            <div className="absolute bottom-0 left-0 flex gap-2">
              {MOMENTS.map((_, i) => (
                <span key={i} className="nosotros-tick h-1 w-10 bg-[#1A1A1A]/15" />
              ))}
            </div>
          </div>

          {/* contador gigante */}
          <div className="relative flex items-end justify-center select-none md:justify-end">
            <span className="sr-only">Más de 20 años de experiencia</span>
            <span className="font-heading mb-4 mr-2 text-[10vw] font-bold leading-none text-(--cmyk-accent) md:text-[5vw]" aria-hidden>
              +
            </span>
            <span className="relative font-heading text-[38vw] font-bold leading-[0.8] md:text-[23vw]" aria-hidden>
              <span className="nosotros-count block" style={{ WebkitTextStroke: '2px #1A1A1A', color: 'transparent' }}>
                20
              </span>
              <span className="nosotros-fill nosotros-count absolute inset-0 text-(--cmyk-accent)">20</span>
            </span>
            <span className="absolute -bottom-8 right-0 text-[10px] font-bold uppercase tracking-widest text-[#5f5e59] md:-bottom-10">
              años de experiencia
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
