'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { gsap, ScrollTrigger, useGSAP, CMYK } from '@/lib/landing/gsap-config'
import { NAV_LINKS } from '@/lib/landing/data'

export function LandingNav() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [open, setOpen] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)
  const menuTl = useRef<gsap.core.Timeline | null>(null)

  useGSAP(() => {
    /* el nav adopta el tema de la sección que tiene debajo */
    gsap.utils.toArray<HTMLElement>('[data-nav-theme]').forEach(sec => {
      ScrollTrigger.create({
        trigger: sec,
        start: 'top 64px',
        end: 'bottom 64px',
        onToggle: self => {
          if (self.isActive) setTheme(sec.dataset.navTheme === 'dark' ? 'dark' : 'light')
        },
      })
    })

    /* menú móvil: wipe circular desde el botón hamburguesa */
    const overlay = overlayRef.current
    if (overlay) {
      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => gsap.set(overlay, { display: 'none' }),
      })
      tl.set(overlay, { display: 'flex' })
        .fromTo(
          overlay,
          { clipPath: 'circle(0% at calc(100% - 44px) 32px)' },
          { clipPath: 'circle(150% at calc(100% - 44px) 32px)', duration: 0.55, ease: 'power3.inOut' },
        )
        .fromTo(
          '.mnav-link',
          { y: 48, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.45, ease: 'power3.out' },
          '-=0.15',
        )
      menuTl.current = tl
    }
  })

  const toggleMenu = () => {
    setOpen(prev => {
      const next = !prev
      if (next) menuTl.current?.play()
      else menuTl.current?.reverse()
      return next
    })
  }

  const dark = theme === 'dark'

  return (
    <>
      <header
        className={cn(
          'fixed top-0 z-50 flex h-16 w-full items-center justify-between px-6 transition-colors duration-500 md:px-12',
          dark
            ? 'bg-transparent text-[#F5F2EA]'
            : 'border-b border-[#1A1A1A]/10 bg-[#F5F2EA]/90 text-[#1A1A1A] backdrop-blur-sm',
        )}
      >
        <a href="#" className="flex items-center gap-3 select-none">
          <span className="flex gap-1" aria-hidden>
            {CMYK.map(c => (
              <span key={c} className="size-1.5" style={{ background: c }} />
            ))}
          </span>
          <span className="font-heading text-base font-bold tracking-tighter">INTERNATIONAL LABEL</span>
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-[10px] font-bold uppercase tracking-widest opacity-50 transition-opacity duration-150 hover:opacity-100"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className={cn(
              'hidden items-center border px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors duration-150 md:flex',
              dark
                ? 'border-[#F5F2EA]/40 hover:bg-[#F5F2EA] hover:text-[#1A1A1A]'
                : 'border-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-[#F5F2EA]',
            )}
          >
            Acceso al sistema
          </Link>

          <button
            type="button"
            onClick={toggleMenu}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            className="relative z-50 flex size-10 flex-col items-center justify-center gap-1.5 md:hidden"
          >
            <span
              className={cn(
                'h-0.5 w-6 transition-transform duration-300',
                open ? 'translate-y-1 rotate-45 bg-[#F5F2EA]' : dark ? 'bg-[#F5F2EA]' : 'bg-[#1A1A1A]',
              )}
            />
            <span
              className={cn(
                'h-0.5 w-6 transition-transform duration-300',
                open ? '-translate-y-1 -rotate-45 bg-[#F5F2EA]' : dark ? 'bg-[#F5F2EA]' : 'bg-[#1A1A1A]',
              )}
            />
          </button>
        </div>
      </header>

      {/* overlay móvil */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40 hidden flex-col justify-center gap-3 bg-[#1A1A1A] px-8 text-[#F5F2EA] md:hidden"
        style={{ display: 'none' }}
      >
        {NAV_LINKS.map(({ href, label }, i) => (
          <a
            key={href}
            href={href}
            onClick={toggleMenu}
            className="mnav-link flex items-baseline gap-4 font-heading text-5xl font-bold tracking-tighter"
          >
            <span className="text-sm text-(--cmyk-accent)">0{i + 1}</span>
            {label}
          </a>
        ))}
        <Link href="/login" onClick={toggleMenu} className="mnav-link mt-10 inline-flex w-fit border border-[#F5F2EA]/40 px-5 py-3 text-[10px] font-bold uppercase tracking-widest">
          Acceso al sistema
        </Link>
      </div>
    </>
  )
}
