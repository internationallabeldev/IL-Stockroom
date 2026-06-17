'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/landing/gsap-config'
import { UserAvatar } from '@/components/shared/user-avatar'
import { RoleBadge } from '@/components/users/role-badge'
import type { WelcomeData } from '@/actions/onboarding.actions'

type Props = { active: boolean; data: WelcomeData; reduced: boolean; isMobile: boolean }

// Split into ~2 balanced lines so the clip-path reveal staggers nicely.
function splitLines(text: string): string[] {
  const words = text.trim().split(/\s+/)
  if (words.length < 4) return [text]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

export function ScreenRole({ active, data, reduced, isMobile }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const { profile, welcomeMessage } = data
  const lines = splitLines(welcomeMessage)
  const fullName = `${profile.first_name} ${profile.last_name}`.trim()

  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!active) { gsap.set(root, { autoAlpha: 0 }); return }

    const ctx = gsap.context(() => {
      gsap.set(root, { autoAlpha: 1 })
      if (reduced) {
        gsap.set(['.badge', '.quote-line', '.avatar-block'], { clearProps: 'all', opacity: 1 })
        gsap.set('.quote-line', { clipPath: 'inset(0 0% 0 0)' })
        return
      }
      const tl = gsap.timeline()
      if (isMobile) {
        tl.from(root, { opacity: 0, duration: 0.5 })
      } else {
        tl.fromTo(root, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.7, ease: 'power3.inOut' })
      }
      tl.from('.badge', { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.15')
      tl.fromTo('.quote-line',
        { clipPath: 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0% 0 0)', duration: 0.6, stagger: 0.18, ease: 'power3.out' },
        '-=0.2',
      )
      tl.from('.avatar-block', { x: 80, opacity: 0, duration: 0.6, ease: 'power3.out' }, '-=0.7')
    }, root)

    return () => ctx.revert()
  }, [active, reduced, isMobile])

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden bg-[#F5F2EA] text-[#1A1A1A]"
      style={{ opacity: 0, zIndex: active ? 30 : 10, pointerEvents: active ? 'auto' : 'none' }}
    >
      {/* Background number */}
      <span className="pointer-events-none absolute left-2 top-0 font-heading font-black leading-none text-[#1A1A1A]/10 text-[30vw] md:text-[22vw]">
        02
      </span>

      <div className="relative z-10 mx-auto flex h-full max-w-5xl flex-col justify-center gap-10 px-8 md:flex-row md:items-center md:justify-between md:px-16">
        {/* Left: badge + quote */}
        <div className="max-w-xl">
          <div className="badge mb-6 inline-block">
            <RoleBadge role={profile.role} />
          </div>
          <blockquote className="border-l-2 border-(--cmyk-accent) pl-5 md:pl-7">
            {lines.map((line, i) => (
              <span
                key={i}
                className="quote-line block font-heading font-bold tracking-tight leading-tight text-2xl md:text-4xl"
              >
                {line}
              </span>
            ))}
          </blockquote>
        </div>

        {/* Right: avatar */}
        <div className="avatar-block flex shrink-0 flex-col items-start gap-4 md:items-center md:text-center">
          <UserAvatar
            firstName={profile.first_name}
            lastName={profile.last_name}
            avatarUrl={profile.avatar_url}
            size="lg"
            className="size-30 text-3xl"
          />
          <div>
            <p className="font-heading text-lg font-bold tracking-tight leading-none">{fullName}</p>
            {profile.job_title && (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/50">
                {profile.job_title}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
