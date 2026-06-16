'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowRight, Lock } from 'lucide-react'
import { gsap } from '@/lib/landing/gsap-config'
import { createClient } from '@/lib/supabase/client'
import { resetPasswordSchema, type ResetPasswordValues } from '@/lib/validations/user.schema'
import type { WelcomeData } from '@/actions/onboarding.actions'

type Props = {
  active:   boolean
  data:     WelcomeData
  reduced:  boolean
  isMobile: boolean
  onEnter:  () => void
  onTour:   () => void
}

export function ScreenStart({ active, data, reduced, isMobile, onEnter, onTour }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const exitingRef = useRef(false)

  const { profile, needsPassword, tourTarget } = data
  const displayName = profile.nickname || profile.first_name

  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<null | 'enter' | 'tour'>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // ── Entrance: fade + blur ────────────────────────────────────────────────
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (!active) { gsap.set(root, { autoAlpha: 0 }); return }

    const ctx = gsap.context(() => {
      if (reduced) { gsap.set(root, { autoAlpha: 1 }); return }
      gsap.fromTo(root, { autoAlpha: 0, filter: 'blur(20px)' }, { autoAlpha: 1, filter: 'blur(0px)', duration: 0.8, ease: 'power2.out' })
      gsap.from('.s5', { y: 30, opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power3.out', delay: 0.2 })
    }, root)

    return () => ctx.revert()
  }, [active, reduced])

  // ── Magnetic button (desktop only) ───────────────────────────────────────
  useEffect(() => {
    if (!active || reduced || isMobile) return
    const btn = btnRef.current
    if (!btn) return

    const onMove = (e: MouseEvent) => {
      if (exitingRef.current) return
      const rect = btn.getBoundingClientRect()
      const dx = e.clientX - (rect.left + rect.width / 2)
      const dy = e.clientY - (rect.top + rect.height / 2)
      const dist = Math.hypot(dx, dy)
      if (dist < 150) gsap.to(btn, { x: dx * 0.3, y: dy * 0.3, duration: 0.4, ease: 'power2.out' })
      else gsap.to(btn, { x: 0, y: 0, duration: 0.4 })
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [active, reduced, isMobile])

  // ── Exit: button expands to fill the screen, then run the action ─────────
  function fireExit(action: () => void) {
    if (reduced || isMobile || !btnRef.current || !ref.current) { action(); return }
    exitingRef.current = true
    gsap.to(btnRef.current, { x: 0, y: 0, scale: 45, duration: 0.55, ease: 'power3.in' })
    gsap.to(ref.current, { opacity: 0, duration: 0.4, delay: 0.25, onComplete: action })
  }

  async function setPasswordThen(action: () => void, which: 'enter' | 'tour', values: ResetPasswordValues) {
    setError(null)
    setBusy(which)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: values.password })
    if (err) { setError(err.message); setBusy(null); return }
    fireExit(action)
  }

  function onPrimary() {
    if (needsPassword) handleSubmit(v => setPasswordThen(onEnter, 'enter', v))()
    else fireExit(onEnter)
  }

  function onStartTour() {
    if (needsPassword) handleSubmit(v => setPasswordThen(onTour, 'tour', v))()
    else fireExit(onTour)
  }

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex flex-col items-center justify-center bg-[#1A1A1A] px-6 text-center"
      style={{ opacity: 0, zIndex: active ? 30 : 10, pointerEvents: active ? 'auto' : 'none' }}
    >
      <h2 className="s5 font-heading text-5xl font-black uppercase tracking-tighter leading-none md:text-7xl">
        Listo para empezar
      </h2>
      <p className="s5 mt-4 text-sm font-bold uppercase tracking-[0.3em] text-(--cmyk-accent)">
        {displayName}
      </p>

      {needsPassword && (
        <div className="s5 mt-10 w-full max-w-sm space-y-4 text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#F5F2EA]/40">
            Crea tu contraseña para entrar
          </p>
          <div className="relative">
            <Lock className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-[#F5F2EA]/30" />
            <input
              {...register('password')}
              type="password"
              placeholder="Nueva contraseña"
              className="w-full border-b border-[#F5F2EA]/25 bg-transparent py-2 pl-6 text-sm text-[#F5F2EA] placeholder:text-[#F5F2EA]/30 outline-none focus:border-(--cmyk-accent) transition-colors"
            />
            {errors.password && <p className="mt-1 text-[10px] text-red-400">{errors.password.message}</p>}
          </div>
          <div className="relative">
            <Lock className="absolute left-0 top-1/2 size-3.5 -translate-y-1/2 text-[#F5F2EA]/30" />
            <input
              {...register('confirm')}
              type="password"
              placeholder="Confirmar contraseña"
              className="w-full border-b border-[#F5F2EA]/25 bg-transparent py-2 pl-6 text-sm text-[#F5F2EA] placeholder:text-[#F5F2EA]/30 outline-none focus:border-(--cmyk-accent) transition-colors"
            />
            {errors.confirm && <p className="mt-1 text-[10px] text-red-400">{errors.confirm.message}</p>}
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
      )}

      <button
        ref={btnRef}
        onClick={onPrimary}
        disabled={busy !== null}
        className="s5 group mt-10 inline-flex items-center gap-3 border border-[#F5F2EA] bg-transparent px-10 py-4 text-xs font-bold uppercase tracking-widest text-[#F5F2EA] transition-colors hover:bg-[#F5F2EA] hover:text-[#1A1A1A] disabled:opacity-60 will-change-transform"
      >
        {busy === 'enter'
          ? <Loader2 className="size-4 animate-spin" />
          : <>{needsPassword ? 'Crear contraseña y entrar' : 'Entrar al sistema'} <ArrowRight className="size-4" /></>}
      </button>

      {tourTarget && (
        <button
          onClick={onStartTour}
          disabled={busy !== null}
          className="s5 mt-5 text-[11px] text-[#F5F2EA]/50 underline underline-offset-4 hover:text-[#F5F2EA] transition-colors disabled:opacity-60"
        >
          {busy === 'tour' ? 'Iniciando…' : 'También puedes iniciar el tour guiado'}
        </button>
      )}

      <p className="s5 absolute bottom-6 left-6 text-[9px] font-bold uppercase tracking-widest text-[#F5F2EA]/25">
        © International Label · IL Stockroom
      </p>
    </div>
  )
}
