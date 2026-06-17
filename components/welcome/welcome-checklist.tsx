'use client'

import { useEffect, useState } from 'react'
import { Check, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils'

export function WelcomeChecklist({ steps, userId }: { steps: string[]; userId: string }) {
  const storageKey = `onboarding-checklist-${userId}`
  const [done, setDone] = useState<boolean[]>(() => steps.map(() => false))
  const [hydrated, setHydrated] = useState(false)

  // Load persisted state once (visual only — never touches the DB). Reading
  // localStorage is a genuine external-system sync, so the effect is correct
  // here despite the set-state-in-effect lint heuristic.
  useEffect(() => {
    let restored: boolean[] | null = null
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const saved = JSON.parse(raw) as boolean[]
        if (Array.isArray(saved) && saved.length === steps.length) restored = saved
      }
    } catch { /* ignore corrupt storage */ }
    /* eslint-disable react-hooks/set-state-in-effect */
    if (restored) setDone(restored)
    setHydrated(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, steps.length])

  useEffect(() => {
    if (!hydrated) return
    try { localStorage.setItem(storageKey, JSON.stringify(done)) } catch { /* quota / private mode */ }
  }, [done, hydrated, storageKey])

  function toggle(i: number) {
    setDone(prev => prev.map((v, idx) => (idx === i ? !v : v)))
  }

  const allDone = done.every(Boolean)

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <button
          key={i}
          onClick={() => toggle(i)}
          className="w-full flex items-center gap-3 text-left border border-border bg-card px-4 py-3 hover:bg-muted transition-colors"
        >
          <span
            className={cn(
              'size-5 shrink-0 border flex items-center justify-center transition-all',
              done[i] ? 'bg-foreground border-foreground scale-100' : 'border-foreground/30 scale-95'
            )}
          >
            <Check
              className={cn(
                'size-3 text-background transition-opacity',
                done[i] ? 'opacity-100' : 'opacity-0'
              )}
            />
          </span>
          <span
            className={cn(
              'text-xs transition-colors',
              done[i] ? 'text-muted-foreground line-through' : 'text-foreground'
            )}
          >
            {step}
          </span>
        </button>
      ))}

      {allDone && hydrated && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-800 animate-in fade-in slide-in-from-bottom-1">
          <PartyPopper className="size-4 text-green-600 dark:text-green-400" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">
            ¡Listo para empezar!
          </p>
        </div>
      )}
    </div>
  )
}
