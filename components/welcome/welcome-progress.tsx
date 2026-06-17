'use client'

import { cn } from '@/lib/utils'

type Props = {
  total:   number
  current: number
  dark:    boolean
  onDot:   (i: number) => void
}

// Vertical dots on the right edge. Colors invert with the active screen's
// background so the indicator stays legible on both dark and light screens.
export function WelcomeProgress({ total, current, dark, onDot }: Props) {
  return (
    <div className="fixed right-6 top-1/2 z-50 -translate-y-1/2 flex flex-col items-center gap-3 md:right-9">
      {Array.from({ length: total }).map((_, i) => {
        const isActive = i === current
        return (
          <button
            key={i}
            onClick={() => onDot(i)}
            aria-label={`Ir a la pantalla ${i + 1}`}
            className="grid place-items-center p-1"
          >
            <span
              className={cn(
                'rounded-full transition-all duration-500',
                isActive ? 'size-2.5' : 'size-2',
                dark
                  ? (isActive ? 'bg-[#F5F2EA]' : 'bg-[#F5F2EA]/30')
                  : (isActive ? 'bg-[#1A1A1A]' : 'bg-[#1A1A1A]/30'),
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
