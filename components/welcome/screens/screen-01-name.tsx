'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/landing/gsap-config'
import type { WelcomeData } from '@/actions/onboarding.actions'

type Props = { active: boolean; data: WelcomeData; reduced: boolean; isMobile: boolean }

export function ScreenName({ active, data, reduced, isMobile }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const name = (data.profile.nickname || data.profile.first_name).toUpperCase()
  const letters = [...name]

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!active) { gsap.set(root, { autoAlpha: 0 }); return }

    const ctx = gsap.context(() => {
      gsap.set(root, { autoAlpha: 1 })
      if (reduced) {
        gsap.set(['.letter', '.subtitle'], { clearProps: 'all', opacity: 1 })
        return
      }
      const tl = gsap.timeline({ delay: 0.3 })
      if (isMobile) {
        tl.from('.letter', { opacity: 0, y: 24, duration: 0.5, stagger: 0.03, ease: 'power3.out' })
      } else {
        tl.from('.letter', {
          x: () => gsap.utils.random(-500, 500),
          y: () => gsap.utils.random(-300, 300),
          rotation: () => gsap.utils.random(-180, 180),
          opacity: 0,
          duration: 1.2,
          ease: 'power4.out',
          stagger: { amount: 0.6, from: 'random' },
        })
      }
      tl.from('.subtitle', { opacity: 0, y: 20, duration: 0.8, ease: 'power3.out' }, 0.8)
    }, root)

    return () => ctx.revert()
  }, [active, reduced, isMobile])

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] px-6"
      style={{ opacity: 0, zIndex: active ? 30 : 10, pointerEvents: active ? 'auto' : 'none' }}
    >
      <h1 className="font-heading text-center font-bold uppercase tracking-tighter leading-[0.85] text-(--cmyk-accent) text-[clamp(3.5rem,16vw,13rem)]">
        {letters.map((ch, i) => (
          <span key={i} className="letter inline-block will-change-transform" style={ch === ' ' ? { width: '0.3em' } : undefined}>
            {ch === ' ' ? ' ' : ch}
          </span>
        ))}
      </h1>
      <p className="subtitle mt-8 text-[11px] md:text-xs font-bold uppercase tracking-[0.4em] text-[#F5F2EA]/50">
        Bienvenido a IL Stockroom
      </p>
    </div>
  )
}
