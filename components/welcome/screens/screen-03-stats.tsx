'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/landing/gsap-config'
import type { WelcomeData, WelcomeAccent } from '@/actions/onboarding.actions'

type Props = { active: boolean; data: WelcomeData; reduced: boolean }

const ACCENT_COLOR: Record<WelcomeAccent, string> = {
  red:     '#ef4444',
  amber:   '#fbbf24',
  green:   '#F5F2EA',
  neutral: '#F5F2EA',
}

function StatNumber({ value, run, reduced }: { value: number; run: boolean; reduced: boolean }) {
  const [display, setDisplay] = useState(reduced ? value : 0)
  const started = useRef(false)

  useEffect(() => {
    if (!run || reduced || started.current) return
    started.current = true
    const obj = { v: 0 }
    const tween = gsap.to(obj, {
      v: value,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => setDisplay(Math.round(obj.v)),
    })
    return () => { tween.kill() }
  }, [run, value, reduced])

  return <>{display.toLocaleString('es-MX')}</>
}

export function ScreenStats({ active, data, reduced }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const stats = data.stats

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!active) { gsap.set(root, { autoAlpha: 0 }); return }

    const ctx = gsap.context(() => {
      if (reduced) { gsap.set(root, { autoAlpha: 1 }); return }
      gsap.fromTo(root, { autoAlpha: 0, scale: 0.85 }, { autoAlpha: 1, scale: 1, duration: 0.6, ease: 'power3.out' })
      gsap.from('.stat', { y: 40, opacity: 0, duration: 0.6, stagger: 0.2, ease: 'power3.out', delay: 0.15 })
    }, root)

    return () => ctx.revert()
  }, [active, reduced])

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col justify-center bg-[#1A1A1A] px-8 md:px-16"
      style={{ opacity: 0, zIndex: active ? 30 : 10, pointerEvents: active ? 'auto' : 'none' }}
    >
      <p className="mb-10 text-[11px] font-bold uppercase tracking-[0.4em] text-[#F5F2EA]/40 md:mb-16">
        El sistema hoy
      </p>

      <div className="space-y-8 md:space-y-12">
        {stats.map((s, i) => (
          <div key={i} className="stat flex items-baseline gap-5 md:gap-8">
            <span
              className="font-heading font-black leading-none tracking-tighter text-[clamp(3.5rem,12vw,9rem)]"
              style={{ color: ACCENT_COLOR[s.accent] }}
            >
              <StatNumber value={s.value} run={active} reduced={reduced} />
            </span>
            <span className="max-w-50 text-[11px] font-bold uppercase tracking-widest leading-tight text-[#F5F2EA]/60 md:max-w-xs md:text-sm">
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
