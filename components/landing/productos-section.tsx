'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK, DESKTOP } from '@/lib/landing/gsap-config'
import { PRODUCTS } from '@/lib/landing/data'

export function ProductosSection() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      /* desktop: cinta horizontal embebida en el scroll vertical */
      mm.add(`${DESKTOP} and ${MOTION_OK}`, () => {
        const track = trackRef.current
        if (!track) return
        const dist = () => track.scrollWidth - window.innerWidth

        const tween = gsap.to(track, {
          x: () => -dist(),
          ease: 'none',
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: () => '+=' + dist(),
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: self => gsap.set('.products-progress', { scaleX: self.progress }),
          },
        })

        /* número gigante en parallax — se mueve más lento que la cinta */
        gsap.utils.toArray<HTMLElement>('.product-num').forEach(num => {
          gsap.fromTo(
            num,
            { xPercent: 16 },
            {
              xPercent: -16,
              ease: 'none',
              scrollTrigger: {
                trigger: num.closest('.product-panel') as Element,
                containerAnimation: tween,
                start: 'left right',
                end: 'right left',
                scrub: true,
              },
            },
          )
        })

        /* la descripción aparece con retraso al entrar el panel */
        gsap.utils.toArray<HTMLElement>('.product-desc').forEach(desc => {
          gsap.fromTo(
            desc,
            { autoAlpha: 0, y: 36 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: desc.closest('.product-panel') as Element,
                containerAnimation: tween,
                start: 'left 55%',
                toggleActions: 'play none none reverse',
              },
            },
          )
        })
      })

      /* mobile: apilado vertical con reveals sencillos */
      mm.add(`(max-width: 767px) and ${MOTION_OK}`, () => {
        gsap.utils.toArray<HTMLElement>('.product-panel').forEach(panel => {
          gsap.from(panel.querySelectorAll('h3, .product-desc'), {
            autoAlpha: 0,
            y: 40,
            duration: 0.7,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: panel, start: 'top 70%', toggleActions: 'play none none reverse' },
          })
        })
      })
    },
    { scope: ref },
  )

  return (
    <section
      id="productos"
      ref={ref}
      data-nav-theme="dark"
      className="products-section relative overflow-hidden bg-[#1A1A1A] text-[#F5F2EA]"
    >
      <div className="relative md:h-screen md:overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-8 pt-24 md:px-16">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">02 — Productos</p>
          <p className="hidden text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30 md:block">
            04 líneas de producción
          </p>
        </div>

        <div ref={trackRef} className="products-track flex flex-col md:w-max md:flex-row">
          {PRODUCTS.map(({ num, name, desc }) => (
            <article
              key={num}
              className="product-panel relative flex w-full shrink-0 items-center overflow-hidden border-b border-[#F5F2EA]/10 px-8 py-24 md:h-screen md:w-[80vw] md:border-b-0 md:border-r md:px-20 md:py-0"
            >
              <span
                aria-hidden
                className="product-num absolute right-[4%] top-1/2 -translate-y-1/2 select-none font-heading text-[44vw] font-bold leading-none md:text-[30vw]"
                style={{ WebkitTextStroke: '1.5px rgba(245,242,234,0.14)', color: 'transparent' }}
              >
                {num}
              </span>
              <div className="relative z-10 max-w-2xl">
                <p className="mb-6 text-[10px] font-bold uppercase tracking-widest text-(--cmyk-accent)">
                  Línea {num}
                </p>
                <h3 className="mb-8 font-heading text-[clamp(2.75rem,7vw,6.5rem)] font-bold tracking-tighter leading-[0.95]">
                  {name}
                </h3>
                <p className="product-desc max-w-md text-base leading-relaxed text-[#F5F2EA]/50 md:text-lg">{desc}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="absolute bottom-10 left-8 right-8 hidden h-px bg-[#F5F2EA]/15 md:left-16 md:right-16 md:block">
          <div className="products-progress h-full w-full origin-left scale-x-0 bg-(--cmyk-accent)" />
        </div>
      </div>
    </section>
  )
}
