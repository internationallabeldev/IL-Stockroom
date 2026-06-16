'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { WelcomeData } from '@/actions/onboarding.actions'
import { markOnboardingComplete } from '@/actions/onboarding.actions'
import { WelcomeProgress } from './welcome-progress'
import { WelcomeNavHint } from './welcome-nav-hint'
import { ScreenName } from './screens/screen-01-name'
import { ScreenRole } from './screens/screen-02-role'
import { ScreenStats } from './screens/screen-03-stats'
import { ScreenModules } from './screens/screen-04-modules'
import { ScreenStart } from './screens/screen-05-start'

const TOTAL = 5
const LOCK_MS = 950

// Which screens sit on a dark background — drives the progress dot color.
const SCREEN_DARK = [true, false, true, false, true] as const

// CMY accents (no key — too dark to read on the dark screens).
const CMYK = ['#00AEEF', '#EC008C', '#FFE600'] as const

export function WelcomeExperience({ data }: { data: WelcomeData }) {
  const [current, setCurrent] = useState(0)
  const [reduced, setReduced] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const lockRef = useRef(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Capability detection — needs the DOM (matchMedia), so it can only run in an
  // effect; the one-time setState here is the intended pattern, not derived state.
  useEffect(() => {
    const r = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    /* eslint-disable react-hooks/set-state-in-effect */
    setReduced(r)
    setIsMobile(window.matchMedia('(max-width: 767px)').matches)
    // Reduced motion → skip the journey, land straight on the final screen.
    if (r) setCurrent(TOTAL - 1)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [])

  const go = useCallback((next: number) => {
    if (lockRef.current) return
    const target = Math.max(0, Math.min(TOTAL - 1, next))
    lockRef.current = true
    setCurrent(target)
    setTimeout(() => { lockRef.current = false }, LOCK_MS)
  }, [])

  const advance = useCallback(() => { if (current < TOTAL - 1) go(current + 1) }, [current, go])
  const retreat = useCallback(() => { if (current > 0) go(current - 1) }, [current, go])

  // ── Wheel (snap one screen per gesture) ──────────────────────────────────
  useEffect(() => {
    if (reduced) return
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (lockRef.current) { acc = 0; return }
      acc += e.deltaY
      if (Math.abs(acc) < 40) return
      if (acc > 0) advance(); else retreat()
      acc = 0
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [advance, retreat, reduced])

  // ── Keyboard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA'

      if (e.key === 'Escape') {
        e.preventDefault()
        // New users must set a password — ESC jumps to the last screen instead
        // of skipping it (skipping would leave them unable to log in again).
        if (data.needsPassword) go(TOTAL - 1)
        else markOnboardingComplete()
        return
      }
      if (typing) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); advance() }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); retreat() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [advance, retreat, go, data.needsPassword])

  // ── Touch (mobile swipe) ─────────────────────────────────────────────────
  useEffect(() => {
    let startY = 0
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY }
    const onEnd = (e: TouchEvent) => {
      const dy = e.changedTouches[0].clientY - startY
      if (Math.abs(dy) < 50) return
      if (dy < 0) advance(); else retreat()
    }
    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchend', onEnd)
    return () => { window.removeEventListener('touchstart', onStart); window.removeEventListener('touchend', onEnd) }
  }, [advance, retreat])

  // ── CMYK accent cycling on the wrapper ───────────────────────────────────
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    el.style.setProperty('--cmyk-accent', CMYK[0])
    if (reduced) return
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % CMYK.length
      el.style.setProperty('--cmyk-accent', CMYK[i])
    }, 2600)
    return () => clearInterval(id)
  }, [reduced])

  const enter = useCallback(() => { markOnboardingComplete() }, [])
  const tour = useCallback(() => { markOnboardingComplete({ tour: true }) }, [])

  return (
    <div
      ref={wrapRef}
      className="cmyk-cycling fixed inset-0 overflow-hidden bg-[#1A1A1A] text-[#F5F2EA] select-none"
    >
      <ScreenName    active={current === 0} data={data} reduced={reduced} isMobile={isMobile} />
      <ScreenRole    active={current === 1} data={data} reduced={reduced} isMobile={isMobile} />
      <ScreenStats   active={current === 2} data={data} reduced={reduced} />
      <ScreenModules active={current === 3} data={data} reduced={reduced} />
      <ScreenStart
        active={current === 4}
        data={data}
        reduced={reduced}
        isMobile={isMobile}
        onEnter={enter}
        onTour={tour}
      />

      <WelcomeProgress total={TOTAL} current={current} dark={SCREEN_DARK[current]} onDot={go} />
      {current === 0 && !reduced && <WelcomeNavHint />}
    </div>
  )
}
