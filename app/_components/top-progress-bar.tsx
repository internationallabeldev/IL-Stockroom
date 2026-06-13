'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

const TRICKLE_MS  = 200    // cadence of the fake "loading" trickle
const COMPLETE_MS = 220    // hold at 100% before fading out
const RESET_MS    = 200    // wait until hidden, then snap width back to 0
const SAFETY_MS   = 10000  // auto-complete if a navigation never resolves

/**
 * Global navigation progress bar (Google Classroom style).
 *
 * Mounted once at the root layout so it covers every route. Starts on any
 * internal link click and on browser back/forward, trickles toward 90%, and
 * completes when the pathname commits. Colour comes from the `--foreground`
 * token, so it's black in light theme and white in dark. Zero dependencies.
 */
export function TopProgressBar() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible]   = useState(false)

  const running = useRef(false)
  const trickle = useRef<ReturnType<typeof setInterval> | null>(null)
  const hide    = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const reset   = useRef<ReturnType<typeof setTimeout>  | null>(null)
  const safety  = useRef<ReturnType<typeof setTimeout>  | null>(null)

  const clearTimers = useCallback(() => {
    for (const t of [trickle, hide, reset, safety]) {
      if (t.current) { clearInterval(t.current); clearTimeout(t.current); t.current = null }
    }
  }, [])

  const done = useCallback(() => {
    if (!running.current) return
    running.current = false
    clearTimers()
    setProgress(100)
    hide.current = setTimeout(() => {
      setVisible(false)
      reset.current = setTimeout(() => setProgress(0), RESET_MS)
    }, COMPLETE_MS)
  }, [clearTimers])

  const start = useCallback(() => {
    if (running.current) return
    running.current = true
    clearTimers()
    setVisible(true)
    setProgress(10)
    trickle.current = setInterval(() => {
      setProgress(p => {
        if (p >= 90) return p
        const step = p < 50 ? 10 : p < 75 ? 4 : 2
        return Math.min(p + step * Math.random(), 90)
      })
    }, TRICKLE_MS)
    safety.current = setTimeout(done, SAFETY_MS)
  }, [clearTimers, done])

  // The route committed → finish the bar.
  useEffect(() => { done() }, [pathname, done])

  // Detect the start of a navigation.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const anchor = (e.target as HTMLElement | null)?.closest?.('a')
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      let url: URL
      try { url = new URL(anchor.href, window.location.href) } catch { return }
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname) return // same page (hash/query-only)

      start()
    }
    const onPopState = () => start()

    document.addEventListener('click', onClick, true) // capture, before Link handles it
    window.addEventListener('popstate', onPopState)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', onPopState)
    }
  }, [start])

  // Cleanup on unmount.
  useEffect(() => clearTimers, [clearTimers])

  if (!visible) return null

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-foreground transition-[width,opacity] duration-200 ease-out"
        style={{ width: `${progress}%`, opacity: progress >= 100 ? 0 : 1 }}
      />
    </div>
  )
}
