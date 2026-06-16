'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import { gsap } from '@/lib/landing/gsap-config'
import { cn } from '@/lib/utils'
import { ROLE_MODULES, ROLE_STEPS } from '@/lib/welcome/content'
import { WelcomeChecklist } from '../welcome-checklist'
import type { WelcomeData } from '@/actions/onboarding.actions'

type Props = { active: boolean; data: WelcomeData; reduced: boolean }

export function ScreenModules({ active, data, reduced }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [stepsOpen, setStepsOpen] = useState(false)
  const modules = ROLE_MODULES[data.profile.role]
  const steps = ROLE_STEPS[data.profile.role]

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!active) { gsap.set(root, { autoAlpha: 0 }); return }

    const ctx = gsap.context(() => {
      gsap.set(root, { autoAlpha: 1 })
      if (reduced) {
        gsap.set(['.title-line', '.mod-row', '.mod-line'], { clearProps: 'all', opacity: 1 })
        gsap.set('.title-line', { clipPath: 'inset(0 0% 0 0)' })
        return
      }
      const tl = gsap.timeline()
      tl.fromTo('.parallax', { yPercent: 100 }, { yPercent: 0, duration: 0.7, ease: 'power3.inOut' })
      tl.fromTo('.title-line',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.6, ease: 'power3.out' }, '-=0.25')
      tl.from('.mod-row', { opacity: 0, y: 18, duration: 0.4, stagger: 0.08, ease: 'power3.out' }, '-=0.3')
      tl.from('.mod-line', { scaleX: 0, transformOrigin: 'left center', duration: 0.5, stagger: 0.08, ease: 'power3.out' }, '<')
    }, root)

    return () => ctx.revert()
  }, [active, reduced])

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-[#F5F2EA] text-[#1A1A1A]"
      style={{ opacity: 0, zIndex: active ? 30 : 10, pointerEvents: active ? 'auto' : 'none' }}
    >
      <div className="parallax mx-auto flex h-full max-w-4xl flex-col justify-center px-8 py-16 md:px-16">
        <h2 className="title-line mb-10 font-heading text-4xl font-black uppercase tracking-tighter md:text-6xl">
          Tus herramientas
        </h2>

        {/* Module list */}
        <div className="overflow-y-auto">
          {modules.map((m, i) => (
            <div
              key={m.label + i}
              className="mod-row group flex items-center gap-4 py-3 cursor-default"
            >
              <span className="font-mono text-[11px] text-[#1A1A1A]/40 w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="font-heading text-base font-bold uppercase tracking-tight shrink-0 transition-transform duration-300 group-hover:translate-x-2 md:text-lg">
                {m.label}
              </span>
              <span className="mod-line h-px flex-1 bg-[#1A1A1A]/20 transition-colors duration-300 group-hover:bg-(--cmyk-accent)" />
              <ArrowRight className="size-4 shrink-0 text-[#1A1A1A]/30 transition-all duration-300 group-hover:translate-x-1 group-hover:text-(--cmyk-accent)" />
            </div>
          ))}
        </div>

        {/* Collapsible first steps */}
        <div className="mt-8 border-t border-[#1A1A1A]/15 pt-5">
          <button
            onClick={() => setStepsOpen(o => !o)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/60 hover:text-[#1A1A1A] transition-colors"
          >
            Primeros pasos
            <ChevronDown className={cn('size-3.5 transition-transform', stepsOpen && 'rotate-180')} />
          </button>
          <div
            className={cn(
              'grid transition-all duration-500 ease-out',
              stepsOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0',
            )}
          >
            <div className="overflow-hidden">
              <WelcomeChecklist steps={steps} userId={data.profile.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
