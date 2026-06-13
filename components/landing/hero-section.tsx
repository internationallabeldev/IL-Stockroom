'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '@/lib/landing/gsap-config'

/* cada palabra entra desde una posición distinta y explota hacia otra al scrollear */
const WORDS = [
  { text: 'IMPRESIÓN', accent: false, from: { x: -200, y: 120, r: -15 }, to: { x: -800, y: -300, r: -45, s: 0.3 } },
  { text: 'DE', accent: false, from: { x: 300, y: -80, r: 12 }, to: { x: 600, y: 400, r: 60, s: 0.5 } },
  { text: 'ALTO', accent: true, from: { x: 180, y: -120, r: 8 }, to: { x: -400, y: -500, r: -30, s: 0.2 } },
  { text: 'IMPACTO', accent: false, from: { x: -150, y: 200, r: -8 }, to: { x: 900, y: 200, r: 75, s: 0.4 } },
]

const BACKDROP_ROWS = ['ETIQUETAS', 'BOOKLET LABEL', 'PLEGADIZO', 'MANGA TERMO', 'HOT STAMPING', 'COLD FOIL']

const STATS = [
  ['+20', 'Años de experiencia'],
  ['ISO', '9001 Certificados'],
  ['GMI', 'Certified Printer'],
] as const

function Word({ text, accent }: { text: string; accent: boolean }) {
  return (
    <span className={`hero-word inline-block will-change-transform ${accent ? 'text-(--cmyk-accent)' : ''}`}>
      {text}
    </span>
  )
}

export function HeroSection() {
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        if (window.scrollY < 10) {
          gsap.from('.hero-word', {
            opacity: 0,
            x: i => WORDS[i].from.x,
            y: i => WORDS[i].from.y,
            rotation: i => WORDS[i].from.r,
            duration: 1.2,
            stagger: 0.15,
            ease: 'power4.out',
          })
          gsap.from(['.hero-eyebrow', '.hero-meta', '.hero-hint'], {
            opacity: 0,
            y: 24,
            duration: 0.8,
            delay: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
          })
        }

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: ref.current,
            start: 'top top',
            end: '+=130%',
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        })

        /* fromTo con inicio explícito + immediateRender:false — un .to() perezoso
           capturaba como "inicio" el estado semitransparente de la intro cuando un
           refresh (fonts.ready, resize de la PWA) o un scroll temprano lo inicializaba
           a mitad de la entrada, dejando el titular invisible al volver arriba */
        tl.fromTo('.hero-word', { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 }, {
          x: i => WORDS[i].to.x,
          y: i => WORDS[i].to.y,
          rotation: i => WORDS[i].to.r,
          scale: i => WORDS[i].to.s,
          opacity: 0,
          stagger: 0.05,
          duration: 1,
          ease: 'power2.in',
          overwrite: 'auto',
          immediateRender: false,
        }, 0)
          .fromTo(
            ['.hero-eyebrow', '.hero-meta', '.hero-hint'],
            { opacity: 1, y: 0 },
            { opacity: 0, y: -60, duration: 0.4, overwrite: 'auto', immediateRender: false },
            0,
          )
          .fromTo('.hero-backdrop', { autoAlpha: 0, scale: 1.08 }, { autoAlpha: 1, scale: 1, duration: 0.8 }, 0.25)
          .fromTo(
            '.hero-backdrop-row',
            { xPercent: i => (i % 2 ? 7 : -7) },
            { xPercent: i => (i % 2 ? -7 : 7), duration: 1.3, ease: 'none' },
            0,
          )
      })
    },
    { scope: ref },
  )

  return (
    <section
      ref={ref}
      data-nav-theme="dark"
      className="hero-section relative h-screen overflow-hidden bg-[#1A1A1A] text-[#F5F2EA]"
    >
      {/* composición tipográfica que se revela detrás del texto al explotar */}
      <div className="hero-backdrop absolute inset-0 flex flex-col items-center justify-center opacity-0 select-none" aria-hidden>
        {BACKDROP_ROWS.map(row => (
          <p
            key={row}
            className="hero-backdrop-row font-heading font-bold tracking-tighter leading-[1.05] whitespace-nowrap text-[7vw]"
            style={{ WebkitTextStroke: '1px rgba(245,242,234,0.16)', color: 'transparent' }}
          >
            {row} — {row} — {row}
          </p>
        ))}
        <p className="absolute bottom-[18%] text-[10px] font-bold uppercase tracking-widest text-(--cmyk-accent)">
          Alto impacto en cada milímetro
        </p>
      </div>

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6">
        <p className="hero-eyebrow mb-10 text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">
          Empresa 100% Mexicana — Materiales de Empaque
        </p>

        <h1 className="font-heading text-center font-bold tracking-tighter leading-[0.9] text-[clamp(3.25rem,12vw,10.5rem)]">
          <span className="block">
            <Word {...WORDS[0]} />
          </span>
          <span className="flex justify-center gap-[0.22em]">
            <Word {...WORDS[1]} />
            <Word {...WORDS[2]} />
          </span>
          <span className="block">
            <Word {...WORDS[3]} />
          </span>
        </h1>
      </div>

      {/* barra de stats inferior */}
      <div className="hero-meta absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-6 border-t border-[#F5F2EA]/10 px-8 pb-8 pt-6 md:px-16">
        <div className="flex gap-10">
          {STATS.map(([val, label]) => (
            <div key={val}>
              <p className="font-heading text-2xl font-bold text-(--cmyk-accent)">{val}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-[#F5F2EA]/30">{label}</p>
            </div>
          ))}
        </div>
        <p className="hidden text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/20 md:block">
          Guadalajara, México
        </p>
      </div>

      <div className="hero-hint absolute bottom-28 left-1/2 z-10 -translate-x-1/2 text-[9px] font-bold uppercase tracking-widest text-[#F5F2EA]/25 md:bottom-32">
        Scroll ↓
      </div>
    </section>
  )
}
